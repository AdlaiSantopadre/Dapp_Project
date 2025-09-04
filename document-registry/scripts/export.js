const hre = require("hardhat");
const fs = require("fs");
const path = require("path");


async function main() {
// 1. Ottieni il contratto già deployato
  const contractName = "DocumentRegistry";
  const deployments = await hre.deployments.get(contractName);
  const address = deployments.address;
// 2. Percorsi
  const artifactPath = path.join(__dirname, "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json");
  const abiDest = path.resolve(__dirname, "../../project-backend/contract/DocumentRegistry.json");
  const addressDest = path.resolve(__dirname, "../../project-backend/contract/contract-address.json");
// 3. Copia ABI
  if (!fs.existsSync(artifactPath)) {
    throw new Error("ABI non trovato. Hai compilato il contratto?");
  }
  fs.copyFileSync(artifactPath, abiDest);
  console.log(`ABI copiato in: ${abiDest}`);
  // 4. Scrive l'indirizzo
  const addressJson = { address };
  fs.writeFileSync(addressDest, JSON.stringify(addressJson, null, 2));
  console.log(` Indirizzo salvato in: ${addressDest}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
