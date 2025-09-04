const { ethers } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const CERT_ADDR = process.env.CERT_ADDR;
  const MANU_ADDR = process.env.MANU_ADDR;

  if (!CONTRACT_ADDRESS || !CERT_ADDR || !MANU_ADDR) {
    throw new Error("Mancano variabili di ambiente (CONTRACT_ADDRESS, CERT_ADDR, MANU_ADDR)");
  }

  // Collegati al contratto già deployato
  const c = await ethers.getContractAt("DocumentRegistry", CONTRACT_ADDRESS);

  console.log("→ Grant CERTIFICATORE_ROLE a", CERT_ADDR);
  const tx1 = await c.grantUserRole(CERT_ADDR, "CERTIFICATORE_ROLE");
  await tx1.wait();

  console.log("→ Grant MANUTENTORE_ROLE a", MANU_ADDR);
  const tx2 = await c.grantUserRole(MANU_ADDR, "MANUTENTORE_ROLE");
  await tx2.wait();

  console.log("✅ Ruoli assegnati!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
