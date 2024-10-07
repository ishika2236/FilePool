require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: "0.8.0", 
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL, 
      accounts: [process.env.PRIVATE_KEY], 
    },
    goerli: {
      url: process.env.GOERLI_URL, 
      accounts: [process.env.PRIVATE_KEY], 
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, 
  },
  paths: {
    artifacts: './src/artifacts', 
  },
};
