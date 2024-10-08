export const IndexedDBService = {
    initDB: (setDb) => {
      const request = indexedDB.open('FileTransferDB', 1);
      request.onerror = (event) => console.error("IndexedDB error:", event.target.error);
      request.onsuccess = (event) => setDb(event.target.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('files', { keyPath: "id", autoIncrement: true });
      };
    },
    
    loadReceivedFiles: (db, setReceivedFiles) => {
      if (!db) return;
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      request.onsuccess = () => setReceivedFiles(request.result);
      request.onerror = () => console.error('Error loading files');
    }
  };
  