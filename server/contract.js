const express = require('express');
const router = express.Router();
const ethers = require('ethers');
const contractABI = require('./contracts/StorageLending.json').abi;
const config = require('./config');
const { exec } = require('child_process');


const provider = new ethers.JsonRpcProvider(config.ganacheURI);
const runCommand = (command) => {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(stdout);
      });
    });
  };
// Contract address should be stored in your config or environment variables
const CONTRACT_ADDRESS = "0x6F2A60765Bea15fdc1F6d71523012de1F743aeE2" || config.contractAddress;

// Initialize contract
let contract;
try {
  contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
  console.log("Contract initialized successfully at address:", CONTRACT_ADDRESS);
} catch (error) {
  console.error("Error initializing contract:", error);
}

// Middleware to check if contract is initialized
const contractInitialized = (req, res, next) => {
  if (!contract) {
    return res.status(503).json({ error: 'Contract not yet initialized' });
  }
  next();
};

// Use the middleware for all routes
router.use(contractInitialized);

router.post('/create', async (req, res) => {
    try {
      // Run the truffle migrate command
      const migrationOutput = await runCommand('truffle migrate --network development');
      console.log('Migration Output:', migrationOutput);
  
      res.json({ message: 'Migration completed successfully', output: migrationOutput });
    } catch (error) {
      console.error("Error in /create route:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  

router.post('/createContract', async (req, res) => {
  try {
    const { providerAddress, requesterAddress, storageSize, duration, price } = req.body;

    // Create a signer for the provider
    const signer = await provider.getSigner(providerAddress);

    // Convert price to wei
    const priceInWei = ethers.parseEther(price.toString());

    const result = await contract.connect(signer).createStorageContract(
      requesterAddress,
      storageSize,
      duration,
      priceInWei,
      { 
        gasLimit: 3000000
      }
    );

    // Wait for the transaction to be mined
    const receipt = await result.wait();

    res.json({
      message: 'Storage contract created successfully',
      transactionHash: receipt.transactionHash,
      contractAddress: receipt.contractAddress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;