import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';
import axios from 'axios';

const StorageProvider = ({ signer, account, contractAddress, contractABI }) => {
  const [availableSpace, setAvailableSpace] = useState('');
  const [pricePerGB, setPricePerGB] = useState('');
  const [socket, setSocket] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/providers/register', {
        address: account,
        availableSpace: parseFloat(availableSpace),
        pricePerGB: parseFloat(pricePerGB)
      });

      const result = response.data;
      console.log('Registered as provider:', result);
  
      setupWebRTC();
  
      alert('Successfully registered as a provider!');
    } catch (error) {
      console.error('Error registering as provider:', error);
      alert('Failed to register as provider. See console for details.');
    }
  };

  const setupWebRTC = useCallback(() => {
    const peerConnection = new RTCPeerConnection();

    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = handleReceiveMessage;
      receiveChannel.onopen = () => console.log('Data channel opened');
      receiveChannel.onclose = () => console.log('Data channel closed');
    };

    socket.on('offer', async (offer, roomId) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, roomId);
    });

    socket.on('ice-candidate', (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, 'roomId');
      }
    };
  }, [socket]);

  const handleReceiveMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'file-info') {
      setCurrentFile({
        name: data.name,
        size: data.size,
        receivedSize: 0,
        chunks: []
      });
    } else if (data.type === 'file-chunk') {
      setCurrentFile(prevFile => {
        const newChunks = [...prevFile.chunks, data.chunk];
        const newReceivedSize = prevFile.receivedSize + data.chunk.byteLength;
        const progress = (newReceivedSize / prevFile.size) * 100;
        setTransferProgress(progress);
        
        if (newReceivedSize === prevFile.size) {
          // File transfer complete, create contract
          createContract(prevFile.size);
        }

        return {
          ...prevFile,
          receivedSize: newReceivedSize,
          chunks: newChunks
        };
      });
    }
  }, []);

  const createContract = async (fileSize) => {
    try {
      const response = await axios.post('http://localhost:5000/api/providers/transfer-complete', {
        providerAddress: account,
        requesterAddress: currentFile.requesterAddress, // You need to get this from the file transfer process
        fileSize: fileSize,
        duration: 30 * 24 * 60 * 60 // 30 days in seconds, you might want to make this configurable
      });

      console.log('Contract created:', response.data);
      alert('File transfer completed and contract created!');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract after file transfer. See console for details.');
    }
  };

  return (
    <div>
      <h2>Become a Storage Provider</h2>
      {account ? (
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
      {currentFile && (
        <div>
          <h3>Receiving File: {currentFile.name}</h3>
          <progress value={transferProgress} max="100"></progress>
          <p>{transferProgress.toFixed(2)}% complete</p>
        </div>
      )}
    </div>
  );
};

export default StorageProvider;