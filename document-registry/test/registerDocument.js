const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentRegistry - Roles and Registration", function () {
  let registry;
  let owner, certificatore, nonAutorizzato;
  let CERTIFICATORE_ROLE;


  beforeEach(async function () {
    [owner, certificatore, nonAutorizzato] = await ethers.getSigners();

    const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    registry = await DocumentRegistry.deploy();
    await registry.waitForDeployment();

    CERTIFICATORE_ROLE = await registry.CERTIFICATORE_ROLE();
    // Assegna il ruolo con grantRole nativo (equivalente a grantUserRole, ma garantito)
    
    await registry.connect(owner).grantRole(CERTIFICATORE_ROLE, certificatore.address);
  });

  it("should allow a CERTIFICATORE to register a document", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-document"));
    const cid = "bafybeicid1234567";
    const metadata = "impianto elettrico edificio A";
    
    const tx = await registry.connect(certificatore).registerDocument(hash, cid, metadata);
    const receipt = await tx.wait();

    // ✅ Extract the event and check its fields
    const event = receipt.logs
      .map(log => registry.interface.parseLog(log))
      .find(e => e.name === "DocumentRegistered");

    expect(event).to.not.be.undefined;
    expect(event.args.hash).to.equal(hash);
    expect(event.args.cid).to.equal(cid);
    expect(event.args.owner).to.equal(certificatore.address);
    expect(event.args.metadata).to.equal(metadata);
    expect(event.args.version).to.equal(1);
    expect(event.args.timestamp).to.be.gt(0);
  });

  

  it("should reject registration from a non-CERTIFICATORE", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("documento-non-autorizzato"));
    const cid = "bafybeicid7654321";
    const metadata = "impianto gas edificio B";

    await expect(
      registry.connect(nonAutorizzato).registerDocument(hash, cid, metadata)
    ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
  });

   it("should reject duplicate registration", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("duplicate-test"));
    const cid = "bafybeifirst";
    const metadata = "impianto termico edificio X";

    await registry.connect(certificatore).registerDocument(hash, cid, metadata);

    await expect(
      registry.connect(certificatore).registerDocument(hash, cid, metadata)
    ).to.be.revertedWith("Document already registered");
  });

  it("should confirm CERTIFICATORE_ROLE was assigned correctly", async function () {
    
    const hasRole = await registry.hasRole(CERTIFICATORE_ROLE, certificatore.address);
    expect(hasRole).to.be.true;
  });

});

