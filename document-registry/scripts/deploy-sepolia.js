// contracts/scripts/deploy-sepolia.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");


async function main() {
  const contract = await hre.ethers.deployContract("DocumentRegistry");
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("✅ Contratto deployato su:", address);

  // Scrivi indirizzo nel backend/.env
  const envPath = path.resolve(__dirname, "../../project-backend/.env");
  fs.appendFileSync(envPath, `\nCONTRACT_ADDRESS=${address}\n`);
  console.log(" Indirizzo scritto in project-backend/.env");

  // Copia ABI dal build di Hardhat → backend/abi/
  const abiSrc = path.resolve(__dirname, "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json");
  const abiDest = path.resolve(__dirname, "../../project-backend/abi/DocumentRegistry.json");
  fs.copyFileSync(abiSrc, abiDest);
  console.log("📦 ABI copiato in project-backend/abi/DocumentRegistry.json");  


}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Per eseguire il deploy su Sepolia:
// npx hardhat run scripts/deploy-sepolia.js --network sepolia