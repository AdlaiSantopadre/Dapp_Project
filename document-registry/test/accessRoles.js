const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentRegistry - Access Control by Roles", function () {
  let registry;
  let owner, certificatore, autorita, manutentore, titolare, esterno;
  let hash, cid, metadata;

  beforeEach(async function () {
    [owner, certificatore, autorita, manutentore, titolare, esterno] = await ethers.getSigners();

    const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    registry = await DocumentRegistry.deploy();
    await registry.waitForDeployment();

    // ruoli
    const CERTIFICATORE_ROLE = await registry.CERTIFICATORE_ROLE();
    const AUTORITA_ROLE = await registry.AUTORITA_ROLE();
    const MANUTENTORE_ROLE = await registry.MANUTENTORE_ROLE();
    const TITOLARE_ROLE = await registry.TITOLARE_ROLE();

    // grant ruoli
    await registry.grantRole(CERTIFICATORE_ROLE, certificatore.address);
    await registry.grantRole(AUTORITA_ROLE, autorita.address);
    await registry.grantRole(MANUTENTORE_ROLE, manutentore.address);
    await registry.grantRole(TITOLARE_ROLE, titolare.address);

    // documento test da registrare
    hash = ethers.keccak256(ethers.toUtf8Bytes("documento-accesso"));
    cid = "bafybeifakecid0001";
    metadata = "impianto antincendio";

    await registry.connect(certificatore).registerDocument(hash, cid, metadata);
  });

  it("should allow AUTORITA_ROLE to read the document", async function () {
    const doc = await registry.connect(autorita).getDocument(hash);
    expect(doc.cid).to.equal(cid);
  });

  it("should allow MANUTENTORE_ROLE to read the document", async function () {
    const doc = await registry.connect(manutentore).getDocument(hash);
    expect(doc.cid).to.equal(cid);
  });

  it("should allow TITOLARE_ROLE to read the document", async function () {
    const doc = await registry.connect(titolare).getDocument(hash);
    expect(doc.cid).to.equal(cid);
  });

  it("should reject access to document from user without role", async function () {
    await expect(
      registry.connect(esterno).getDocument(hash)
    ).to.be.revertedWith("Access denied");

  });
});
