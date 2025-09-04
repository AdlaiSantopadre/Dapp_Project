const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentRegistry - Role Management and Utilities", function () {
  let registry, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    registry = await DocumentRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("should allow admin to grant a role dynamically", async function () {
    const roleName = "MANUTENTORE_ROLE";
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(roleName));

    await registry.grantUserRole(addr1.address, roleName);

    const hasRole = await registry.hasRole(roleHash, addr1.address);
    expect(hasRole).to.be.true;
  });

  it("should reject granting a role by a non-admin", async function () {
    const roleName = "TITOLARE_ROLE";

    await expect(
      registry.connect(addr1).grantUserRole(addr2.address, roleName)
    ).to.be.revertedWithCustomError(
      registry,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("should confirm hasRoleByString returns true if role is assigned", async function () {
    const roleName = "AUTORITA_ROLE";

    await registry.grantUserRole(addr1.address, roleName);

    const result = await registry.hasRoleByString(roleName, addr1.address);
    expect(result).to.be.true;
  });

  it("should return false for unassigned roles using hasRoleByString", async function () {
    const roleName = "MANUTENTORE_ROLE";
    const result = await registry.hasRoleByString(roleName, addr2.address);
    expect(result).to.be.false;
  });

  it("should revert on getDocument if document does not exist", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("not-present"));

    await expect(
      registry.getDocument(fakeHash)
    ).to.be.revertedWith("Document not found");
  });
});
