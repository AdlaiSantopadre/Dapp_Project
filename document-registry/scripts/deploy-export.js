// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const DocumentRegistry = await hre.ethers.deployContract("DocumentRegistry");
  await DocumentRegistry.waitForDeployment();
  const address = await DocumentRegistry.getAddress();

  console.log("✅ Contract deployed at:", address);

  // Percorsi
  const artifactPath = path.join(__dirname, "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json");
  const abiDest = path.resolve(__dirname, "../../project-backend/abi/DocumentRegistry.json");
  const addressDest = path.resolve(__dirname, "../../project-backend/abi/contract-address.json");

  // Copia ABI
  if (!fs.existsSync(artifactPath)) {
    throw new Error("ABI non trovato. Hai compilato il contratto?");
  }
  fs.copyFileSync(artifactPath, abiDest);
  console.log(`✅ ABI copiato in: ${abiDest}`);

  // Scrivi address
  fs.writeFileSync(addressDest, JSON.stringify({ address }, null, 2));
  console.log(`✅ Address salvato in: ${addressDest}`);
}

main().catch((err) => {
  console.error("❌ Errore deploy:", err);
  process.exit(1);
});
