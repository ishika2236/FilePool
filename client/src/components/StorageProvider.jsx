import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';

const StorageProvider = ({ signer, account, contractAddress, contractABI }) => {
  const [availableSpace, setAvailableSpace] = useState('');
  const [pricePerGB, setPricePerGB] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000'); // Your server address
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Register provider in the database
      const response = await fetch('/api/providers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account, // Use the account prop here
          availableSpace: parseFloat(availableSpace),
          pricePerGB: parseFloat(pricePerGB)
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to register as provider');
      }
  
      const result = await response.json();
      console.log('Registered as provider:', result);
  
      // Set up WebRTC connection to receive files
      setupWebRTC();
  
      alert('Successfully registered as a provider!');
    } catch (error) {
      console.error('Error registering as provider:', error);
      alert('Failed to register as provider. See console for details.');
    }
  };
  

  const setupWebRTC = () => {
    const peerConnection = new RTCPeerConnection();

    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = handleReceiveMessage;
    };

    socket.on('offer', async (offer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, offer.roomId);
    });

    socket.on('ice-candidate', (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, 'roomId'); // You'll need to implement room management
      }
    };
  };

  const handleReceiveMessage = (event) => {
    // Handle received file chunks here
    console.log('Received data:', event.data);
  };

  return (
    <div>
      <h2>Become a Storage Provider</h2>
      {account ? ( // Use account instead of address
        <p>Connected wallet: {account}</p>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Available Space (GB):</label>
          <input
            type="number"
            value={availableSpace}
            onChange={(e) => setAvailableSpace(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Price per GB (ETH):</label>
          <input
            type="number"
            step="0.0001"
            value={pricePerGB}
            onChange={(e) => setPricePerGB(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register as Provider</button>
      </form>
    </div>
  );
};

export default StorageProvider;
