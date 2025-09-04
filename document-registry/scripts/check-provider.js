// contracts/scripts/check-provider.js (ethers v6)
require("dotenv").config();
const { ethers } = require("ethers"); // v6

async function main() {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("SEPOLIA_RPC_URL mancante nel .env");

  const provider = new ethers.JsonRpcProvider(url);

  const network = await provider.getNetwork();
  const block = await provider.getBlockNumber();

  console.log("✅ Connessione RPC OK");
  console.log("⛓  chainId:", Number(network.chainId));
  console.log("📦 blockNumber:", block);

  // opzionale: mostra saldo dell'account di deploy se presente
  const pk = process.env.PRIVATE_KEY || process.env.PRIVATE_KEY_ADMIN;
  if (pk) {
    const wallet = new ethers.Wallet(pk, provider);
    const bal = await provider.getBalance(wallet.address);
    console.log(" address:", wallet.address);
    console.log("balance (ETH):", ethers.formatEther(bal));
  } else {
    console.log("Nessuna PRIVATE_KEY nel .env: salto check saldo.");
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});

