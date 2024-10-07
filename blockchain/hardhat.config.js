require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-ethers");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8080", // This is the default Ganache URL
      accounts: {
        mnemonic: "pioneer spirit fancy tone fuel song mimic retire must margin borrow lunar", // Replace with your Ganache mnemonic
      },
    },
  },
};
