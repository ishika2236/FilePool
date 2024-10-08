import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css'; // Import the CSS file

const socket = io('http://localhost:2000');

const App = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [storageSpace, setStorageSpace] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [file, setFile] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [db, setDb] = useState(null);

  const fileReaderRef = useRef(null);
  const receivedFileChunks = useRef([]);
  const receivedFileName = useRef('');
  const receivedFileType = useRef('');
  const receivedFileSize = useRef(0); // Store file size on receiving end

  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open('FileTransferDB', 1);

      request.onerror = (event) => console.error("IndexedDB error:", event.target.error);

      request.onsuccess = (event) => {
        const database = event.target.result;
        setDb(database);
        loadReceivedFiles(); // Load received files only after DB is successfully opened
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('files', { keyPath: "id", autoIncrement: true });
        console.log('Object store created');
      };
    };

    initDB();
  }, []);

  const loadReceivedFiles = () => {
    if (!db) return;

    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');

    const request = store.getAll();

    request.onsuccess = () => {
      setReceivedFiles(request.result);
    };

    request.onerror = () => {
      console.error('Error loading files');
    };
  };

  useEffect(() => {
    socket.on('userList', (userList) => {
      setUsers(userList.filter(user => user.socketId !== socket.id));
    });

    socket.on('offer', async (data) => {
      const pc = createPeerConnection(data.sender);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { sdp: pc.localDescription, target: data.sender });
    });

    socket.on('answer', async (data) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    });

    socket.on('iceCandidate', async (data) => {
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      socket.off('userList');
      socket.off('offer');
      socket.off('answer');
      socket.off('iceCandidate');
    };
  }, [peerConnection]);

  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          target: targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = handleReceiveMessage;
      setDataChannel(receiveChannel);
    };

    setPeerConnection(pc);
    return pc;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!username) {
      alert('Please enter a username');
      return;
    }

    fetch(`http://localhost:2000/api/users/${username}`)
      .then(response => response.json())
      .then(data => {
        if (data.exists) {
          const userData = { username, storageSpace: data.user.storageSpace, socketId: socket.id };
          socket.emit('registerUser', userData);
          setCurrentUser(userData);
          setIsRegistered(true);
        } else {
          const space = prompt('User not found. Please enter your storage space (in GB):');
          if (!space || isNaN(space) || parseInt(space) <= 0) {
            alert('Invalid storage space. Please try again.');
            return;
          }
          const userData = { username, storageSpace: parseInt(space), socketId: socket.id };
          socket.emit('registerUser', userData);
          setCurrentUser(userData);
          setIsRegistered(true);
        }
      })
      .catch(error => {
        console.error('Error fetching user:', error);
      });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileTransfer = async () => {
    if (!selectedUser || !file) {
      alert('Please select a user and a file');
      return;
    }

    if (currentUser.storageSpace < file.size / (1024 * 1024 * 1024)) { // Convert file size to GB
      alert('Not enough storage space!');
      return;
    }

    const pc = createPeerConnection(selectedUser.socketId);
    const channel = pc.createDataChannel('fileTransfer');

    channel.onopen = () => {
      channel.send(JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size // Send file size to receiving end
      }));

      const chunkSize = 16 * 1024; // 16KB chunks
      fileReaderRef.current = new FileReader();
      let offset = 0;

      fileReaderRef.current.onload = () => {
        const chunk = fileReaderRef.current.result;
        channel.send(chunk);
        offset += chunk.byteLength;
        setTransferProgress((offset / file.size) * 100);

        if (offset < file.size) {
          readSlice(offset);
        } else {
          channel.send('EOF');
          console.log('File transfer completed');
        }
      };

      const readSlice = (o) => {
        const slice = file.slice(o, o + chunkSize);
        fileReaderRef.current.readAsArrayBuffer(slice);
      };

      readSlice(0);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { sdp: pc.localDescription, target: selectedUser.socketId });
  };

  const handleReceiveMessage = (event) => {
    if (typeof event.data === 'string') {
      if (event.data === 'EOF') {
        const fileBlob = new Blob(receivedFileChunks.current, { type: receivedFileType.current });
        saveFile(fileBlob, receivedFileName.current);
        
        // Automatically download the file on User B's screen
        downloadFile(fileBlob, receivedFileName.current);
  
        // Reset chunks array and progress
        receivedFileChunks.current = [];
        setTransferProgress(100);  // Set progress to 100% on completion
      } else {
        const fileMetadata = JSON.parse(event.data);
        receivedFileName.current = fileMetadata.fileName;
        receivedFileType.current = fileMetadata.fileType;
        receivedFileSize.current = fileMetadata.fileSize;  // Store file size on receiving end
      }
    } else {
      receivedFileChunks.current.push(event.data);
    }
  };
  
  const saveFile = (blob, fileName) => {
    if (!db) {
      console.error("Database is not initialized.");
      return; // Early exit if db is not ready
    }
  
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    const fileRecord = { name: fileName, data: blob };
  
    store.add(fileRecord).onsuccess = () => {
      console.log('File saved to IndexedDB:', fileName);
      loadReceivedFiles(); // Reload the files after saving
    };
  
    store.transaction.oncomplete = () => {
      console.log('Transaction completed: File saved');
    };
  
    store.transaction.onerror = (event) => {
      console.error('Transaction failed: ', event.target.error);
    };
  };
  
  // Function to automatically download the file
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();  // Trigger the download
    document.body.removeChild(a);  // Clean up the DOM
    URL.revokeObjectURL(url);  // Revoke the blob URL after downloading
  };
  

  const handleUserSelect = (e) => {
    
    const selectedUserId = e.target.value;
    const user = users.find(user => user.socketId === selectedUserId);
    setSelectedUser(user);
  };

  return (
    <div className="App">
      {!isRegistered ? (
        <form onSubmit={handleRegister}>
          <h2>Register</h2>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
          <button type="submit">Register</button>
        </form>
      ) : (
        <div>
          <h2>Welcome, {currentUser.username}</h2>
          <div>
            <label>Select User to Transfer File:</label>
            <select onChange={handleUserSelect}>
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.socketId} value={user.socketId}>
                  {user.username} - {user.storageSpace} GB
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Select a File:</label>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleFileTransfer}>Send File</button>
          </div>
          <div>
            <h3>File Transfer Progress: {transferProgress}%</h3>
          </div>
          <div>
            <h3>Received Files:</h3>
            <ul>
              {receivedFiles.map(file => (
                <li key={file.id}>
                  <a href={URL.createObjectURL(file.data)} download={file.name}>{file.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
