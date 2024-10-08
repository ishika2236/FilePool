import io from 'socket.io-client';

class WebRTCConnection {
  constructor() {
    this.socket = io('http://localhost:3001'); // Your signaling server address
    this.peerConnection = new RTCPeerConnection();
    this.dataChannel = null;
    this.file = null;
    this.fileReader = new FileReader();
    this.receivedSize = 0;
    this.CHUNK_SIZE = 16384; // 16KB chunks

    this.setupSocketListeners();
    this.setupPeerConnectionListeners();
    this.setupFileReaderListeners();
  }

  // ... (previous methods remain the same)

  setupDataChannelListeners() {
    this.dataChannel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'file-info') {
          this.receivedSize = 0;
          this.file = new File([], message.name, { 
            type: message.type,
            lastModified: message.lastModified
          });
        }
      } else {
        this.receiveFileChunk(event.data);
      }
    };

    this.dataChannel.onopen = () => {
      console.log('Data channel is open');
    };
  }

  setupFileReaderListeners() {
    this.fileReader.onload = (event) => {
      this.dataChannel.send(event.target.result);
      this.offset += event.target.result.byteLength;
      this.sendFileChunks();
    };
  }

  async sendFile(file) {
    this.file = file;
    this.offset = 0;
    
    // Send file info
    const fileInfo = JSON.stringify({
      type: 'file-info',
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    this.dataChannel.send(fileInfo);

    // Start sending file chunks
    this.sendFileChunks();
  }

  sendFileChunks() {
    if (this.offset < this.file.size) {
      const chunk = this.file.slice(this.offset, this.offset + this.CHUNK_SIZE);
      this.fileReader.readAsArrayBuffer(chunk);
    } else {
      console.log('File sent successfully');
    }
  }

  receiveFileChunk(chunk) {
    this.receivedSize += chunk.byteLength;

    // Append chunk to file
    const blob = new Blob([this.file, chunk], { type: this.file.type });
    this.file = new File([blob], this.file.name, { 
      type: this.file.type, 
      lastModified: this.file.lastModified 
    });

    // Check if file is completely received
    if (this.receivedSize === this.file.size) {
      console.log('File received successfully');
      // Here you can trigger a download or further processing of the received file
    }
  }
}

export default WebRTCConnection;