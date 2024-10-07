const HDWalletProvider = require('@truffle/hdwallet-provider'); 
const Web3 = require('web3'); 
const infuraKey = "YOUR_INFURA_PROJECT_ID"; 
const mnemonic = "YOUR_MNEMONIC"; 

module.exports = {
  compilers: {
    solc: {
      version: "0.8.0", 
    },
  },

  networks: {
    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          mnemonic, 
          `https://rinkeby.infura.io/v3/${infuraKey}` 
        ),
      network_id: 4, 
      gas: 5500000, 
      confirmations: 2, 
      timeoutBlocks: 200, 
      skipDryRun: true, 
    },
  },


  migrations_directory: "./migrations",

  // Enable contract verification on etherscan (optional)
  api_keys: {
    etherscan: "YOUR_ETHERSCAN_API_KEY", // Optional: Etherscan API key for contract verification
  },
};
