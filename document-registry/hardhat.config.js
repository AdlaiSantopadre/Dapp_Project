
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

//const { PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    // rete in-process per test rapidi
    hardhat: {
      chainId: 31337, // chainId coerente con Metamask in locale
    },

    // rete locale esposta su 127.0.0.1:8545 da `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // esempio testnet (Sepolia) per deploy remoto
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111, // Sepolia
    },
  },
  etherscan: {
    apiKey: { apiKey: process.env.ETHERSCAN_API_KEY },
  },
};
