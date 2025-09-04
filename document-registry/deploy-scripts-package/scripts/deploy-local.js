// document-registry/scripts/deploy-local.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const contract = await hre.ethers.deployContract("DocumentRegistry");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ Contratto deployato su localhost:", address);

  const envPath = path.resolve(__dirname, "../../project-backend/.env");
  fs.appendFileSync(envPath, `\nCONTRACT_ADDRESS=${address}\n`);
  console.log("📄 Indirizzo scritto in project-backend/.env");

  const abiSrc = path.resolve(__dirname, "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json");
  const abiDest = path.resolve(__dirname, "../../project-backend/abi/DocumentRegistry.json");
  fs.copyFileSync(abiSrc, abiDest);
  console.log("📦 ABI copiato in project-backend/abi/DocumentRegistry.json");
}

main().catch((err) => {
  console.error("❌ Deploy fallito:", err);
  process.exit(1);
});
