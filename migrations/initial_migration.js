const Migrations = artifacts.require("Migrations"); // IMPORT THE MIGRATIONS CONTRACT

module.exports = function (deployer) { // EXPORT THE FUNCTION TO DEPLOY THE CONTRACT
  deployer.deploy(Migrations); // DEPLOY THE MIGRATIONS CONTRACT
};
