const StorageLending = artifacts.require("StorageLending");
const fs = require('fs');
const path = require('path');

module.exports = function(deployer) {
  deployer.deploy(StorageLending)
    .then(() => {
      // Write contract addresses to file
      const addressFile = path.join(__dirname, '..', 'server', 'contractAddress.js');
      const addresses = `module.exports = { address: '${StorageLending.address}' }`;
      fs.writeFileSync(addressFile, addresses);
    });
};