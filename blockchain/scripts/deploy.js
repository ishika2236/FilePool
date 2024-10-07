const hre = require("hardhat");

async function main() {
  // Compile the contract
  await hre.run('compile');

  // Get the ContractFactory and Signers
  const MyContract = await hre.ethers.getContractFactory("MyContract");
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contract
  const myContract = await MyContract.deploy();

  // Wait for the contract to be mined
  await myContract.waitForDeployment();

  console.log("MyContract deployed to:", await myContract.getAddress());
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });