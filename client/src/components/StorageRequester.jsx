
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';

const StorageRequester = ({ signer, account, contractAddress, contractABI }) => {
  const [requiredSpace, setRequiredSpace] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000'); // Your server address
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find a suitable provider
      const response = await fetch('/api/providers/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiredSpace: parseFloat(requiredSpace)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find a suitable provider');
      }

      const { providerId, providerAddress, roomId } = await response.json();

      // Set up WebRTC connection and send file
      await setupWebRTCAndSendFile(roomId);

      // Create agreement on the blockchain
      await createAgreement(providerAddress);

      alert('File transfer initiated and agreement created!');
    } catch (error) {
      console.error('Error requesting storage:', error);
      alert('Failed to request storage. See console for details.');
    }
  };

  const setupWebRTCAndSendFile = (roomId) => {
    return new Promise((resolve, reject) => {
      const peerConnection = new RTCPeerConnection();
      const sendChannel = peerConnection.createDataChannel('fileTransfer');

      sendChannel.onopen = () => {
        console.log('Data channel is open');
        sendFile(sendChannel);
        resolve();
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate, roomId);
        }
      };

      socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
      }).then(() => {
        socket.emit('offer', peerConnection.localDescription, roomId);
      }).catch(reject);
    });
  };

  const sendFile = (channel) => {
    const chunkSize = 16384;
    const fileReader = new FileReader();
    let offset = 0;

    fileReader.onload = (e) => {
      channel.send(e.target.result);
      offset += e.target.result.byteLength;
      if (offset < selectedFile.size) {
        readSlice(offset);
      }
    };

    const readSlice = (o) => {
      const slice = selectedFile.slice(o, o + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  };

  const createAgreement = async (providerAddress) => {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const duration = 30 * 24 * 60 * 60; // 30 days in seconds
    const payment = ethers.parseEther((parseFloat(requiredSpace) * 0.1).toString()); // 0.1 ETH per GB

    const tx = await contract.createAgreement(providerAddress, duration, { value: payment });
    await tx.wait();
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div>
      <h2>Request Storage Space</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Required Space (GB):</label>
          <input
            type="number"
            value={requiredSpace}
            onChange={(e) => setRequiredSpace(e.target.value)}
            required
          />
        </div>
        <div>
          <label>File to Store:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <button type="submit">Request Storage and Send File</button>
      </form>
      {transferProgress > 0 && <p>Transfer progress: {transferProgress}%</p>}
    </div>
  );
};

export default StorageRequester;