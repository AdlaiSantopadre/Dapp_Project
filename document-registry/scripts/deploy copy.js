const hre = require("hardhat");

async function main() {
  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  // NON serve più: await registry.deployed();
  
  console.log("DocumentRegistry deployed to:", registry.target || registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
