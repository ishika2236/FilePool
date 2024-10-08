const express = require('express');
const router = express.Router();
const ethers = require('ethers');
const contractABI = require('../contracts/StorageLending.json').abi;
const config = require('../config');

const provider = new ethers.JsonRpcProvider(config.ganacheURI);

// We'll get the contract instance from the request object
// This will be set by the middleware in server.js

router.post('/create', async (req, res) => {
  try {
    const { providerAddress, requesterAddress, duration, payment } = req.body;
    
    // Get the contract instance from the request object
    const contract = req.contract;
    

    // Create a signer for the provider
    const signer = await provider.getSigner(providerAddress);

    const result = await contract.connect(signer).createAgreement(
      requesterAddress, 
      duration,
      { 
        value: ethers.parseEther(payment.toString()),
        gasLimit: 3000000
      }
    );

    // Wait for the transaction to be mined
    const receipt = await result.wait();

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/end', async (req, res) => {
  try {
    const { agreementId, senderAddress } = req.body;

    // Get the contract instance from the request object
    const contract = req.contract;

    // Create a signer for the sender
    const signer = await provider.getSigner(senderAddress);

    const result = await contract.connect(signer).endAgreement(
      agreementId,
      { gasLimit: 3000000 }
    );

    // Wait for the transaction to be mined
    const receipt = await result.wait();

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;