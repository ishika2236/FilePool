const express = require('express');
const Provider = require('../models/Provider');
const ethers = require('ethers');
const contractABI = require('../contracts/StorageLending.json').abi;
const contractAddress = require('../contractAddress').address;
const router = express.Router();

// Assuming you have set up your Ethereum provider
const provider = new ethers.JsonRpcProvider('http://localhost:8545');

// Register provider route
router.post('/register', async (req, res) => {
  const { address, availableSpace, pricePerGB } = req.body;

  try {
    const newProvider = new Provider({
      address,
      availableSpace,
      pricePerGB,
    });

    await newProvider.save();
    res.status(201).json({ message: 'Provider registered successfully', provider: newProvider });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register provider. Provider might already exist.' });
  }
});

// Handle file transfer completion and contract creation
router.post('/transfer-complete', async (req, res) => {
  const { providerAddress, requesterAddress, fileSize, duration } = req.body;

  try {
    // Retrieve provider details
    const provider = await Provider.findOne({ address: providerAddress });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Calculate payment based on file size and provider's price
    const paymentAmount = fileSize * provider.pricePerGB;

    // Create and sign the transaction
    const signer = provider.getSigner(requesterAddress);
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const tx = await contract.createAgreement(providerAddress, duration, {
      value: ethers.parseEther(paymentAmount.toString())
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    res.status(200).json({
      message: 'File transfer completed and contract created',
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create contract after file transfer' });
  }
});

module.exports = router;