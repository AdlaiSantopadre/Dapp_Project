const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('DocumentRegistry', function () {
  async function deployFixture() {
    const [deployer, other, maintainer, titolare, autorita] = await ethers.getSigners();
    const Doc = await ethers.getContractFactory('DocumentRegistry');
    const doc = await Doc.deploy();
    await doc.waitForDeployment();
    const address = await doc.getAddress();

    return { doc, address, deployer, other, maintainer, titolare, autorita };
  }

  function toBytes32Sha256(hexLike) {
    // accetta una stringa hex "0x..." di 32 bytes oppure una stringa normale: calcola sha256
    if (typeof hexLike === 'string' && hexLike.startsWith('0x') && hexLike.length === 66) {
      return hexLike;
    }
    // calcoliamo sha256 su string/bytes → ethers v6
    const bytes = ethers.toUtf8Bytes(String(hexLike));
    const sha = ethers.sha256(bytes); // "0x" + 64 hex
    return sha;
  }

  it('deploy: assegna DEFAULT_ADMIN_ROLE e CERTIFICATORE_ROLE al deployer', async () => {
    const { doc, deployer } = await deployFixture();
    const DEFAULT_ADMIN_ROLE = await doc.DEFAULT_ADMIN_ROLE();
    const CERTIFICATORE_ROLE = await doc.CERTIFICATORE_ROLE();

    expect(await doc.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(true);
    expect(await doc.hasRole(CERTIFICATORE_ROLE, deployer.address)).to.eq(true);
  });

  it('registerDocument: salva e emette evento con parametri corretti', async () => {
    const { doc, deployer } = await deployFixture();
    const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
    const hash = toBytes32Sha256('contenuto-finto-pdf');
    const cid = 'bafybeigdyrtestcid123';
    const metadata = JSON.stringify({ filename: 'doc.pdf', mime: 'application/pdf' });

    await expect(doc.connect(deployer).registerDocument(hash, cid, metadata))
      .to.emit(doc, 'DocumentRegistered')
      .withArgs(
        hash,
        cid,
        deployer.address,
        // timestamp non lo verifichiamo direttamente, matchiamo via wildcard
        anyValue, 
        1,        // versione
        metadata
      );

    // lettura
    const res = await doc.getDocument(hash); // solo ruoli: al momento deployer è certificatore, quindi ok
    expect(res[0]).to.eq(cid);
    expect(res[1]).to.eq(deployer.address);
    expect(res[3]).to.eq(1n); // version
    expect(res[4]).to.eq(metadata);
  });

  it('impedisce doppia registrazione dello stesso hash', async () => {
    const { doc, deployer } = await deployFixture();

    const hash = toBytes32Sha256('x1');
    await doc.registerDocument(hash, 'bafy1', '{}');

    await expect(
      doc.registerDocument(hash, 'bafy2', '{}')
    ).to.be.revertedWith('Document already registered');
  });

  it('solo CERTIFICATORE_ROLE può chiamare registerDocument', async () => {
    const { doc, other } = await deployFixture();

    const hash = toBytes32Sha256('x2');
    await expect(
      doc.connect(other).registerDocument(hash, 'bafy-x2', '{}')
    ).to.be.revertedWithCustomError(doc, 'AccessControlUnauthorizedAccount') // OZ v4.9+ custom error
      .withArgs(other.address, await doc.CERTIFICATORE_ROLE());
  });

  it('getDocument è accessibile solo ai ruoli autorizzati', async () => {
    const { doc, deployer, other, maintainer, titolare, autorita } = await deployFixture();

    // registra doc come certificatore (deployer)
    const hash = toBytes32Sha256('x3');
    await doc.registerDocument(hash, 'bafy-x3', '{"k":"v"}');

    // utente senza ruoli → revert
    await expect(
      doc.connect(other).getDocument(hash)
    ).to.be.revertedWith('Access denied');

    // assegna ruoli e verifica accesso
    await doc.grantUserRole(maintainer.address, 'MANUTENTORE_ROLE');
    await doc.grantUserRole(titolare.address, 'TITOLARE_ROLE');
    await doc.grantUserRole(autorita.address, 'AUTORITA_ROLE');

    // ciascuno ora può leggere
    await expect(doc.connect(maintainer).getDocument(hash)).to.not.be.reverted;
    await expect(doc.connect(titolare).getDocument(hash)).to.not.be.reverted;
    await expect(doc.connect(autorita).getDocument(hash)).to.not.be.reverted;
  });

  it('hasRoleByString opera come atteso', async () => {
    const { doc, other } = await deployFixture();

    expect(await doc.hasRoleByString('CERTIFICATORE_ROLE', other.address)).to.eq(false);
    await doc.grantUserRole(other.address, 'CERTIFICATORE_ROLE');
    expect(await doc.hasRoleByString('CERTIFICATORE_ROLE', other.address)).to.eq(true);
  });
});


