import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import { abi as contractABI } from '/home/ishika/Documents/CSE/HACKATHONS/HackIndia/Attempt2/server/contracts/StorageLending.json';
import StorageProvider from './components/StorageProvider';
import StorageRequester from './components/StorageRequester';
import ProviderList from './components/ProviderList';

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create provider
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          
          // Get signer and account
          const signerInstance = await providerInstance.getSigner();
          const accounts = await providerInstance.listAccounts();
          
          setProvider(providerInstance);
          setSigner(signerInstance);
          setAccount(accounts[0].address);

          // You might want to set your contract address here or load it from a config file
          setContractAddress('0x6F2A60765Bea15fdc1F6d71523012de1F743aeE2');
        } catch (error) {
          console.error("Error accessing account:", error);
          alert("User denied account access or an error occurred.");
        }
      } else {
        console.error("No Ethereum provider detected");
        alert("Please install MetaMask!");
      }
    };
    initEthers();
  }, []);

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/provider">Become a Provider</Link></li>
            <li><Link to="/requester">Request Storage</Link></li>
          </ul>
        </nav>

        <h1>Decentralized Storage Lending</h1>

        {provider && signer && account ? (
          <Routes>
            <Route path="/" element={<h2>Welcome to Decentralized Storage Lending</h2>} />
            <Route path="/provider" element={<StorageProvider signer={signer} account={account} contractAddress={contractAddress} contractABI={contractABI} />} />
            <Route path="/requester" element={<StorageRequester signer={signer} account={account} contractAddress={contractAddress} contractABI={contractABI} />} />
          </Routes>
        ) : (
          <p>Loading Web3 and accounts...</p>
        )}
      </div>
    </Router>
  );
};

export default App;