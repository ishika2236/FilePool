pragma solidity ^0.8.0;

contract MyContract {
    
    struct File {
        string ipfsHash;  // HASH OF THE FILE IN IPFS
        address uploader; // WHO UPLOADED THE FILE
        uint256 fileSize; // FILE SIZE IN BYTES
        // uint256 timestamp; // TIMESTAMP OF UPLOAD
    }

    File[] public files; 

    event FileUploaded(string ipfsHash, address indexed uploader, uint256 fileSize, uint256 timestamp);

    function storeFile(string memory _ipfsHash, uint256 _fileSize) public {
        uint256 _timestamp = block.timestamp;

        files.push(File(_ipfsHash, msg.sender, _fileSize, _timestamp));

        emit FileUploaded(_ipfsHash, msg.sender, _fileSize, _timestamp);
    }

    function getFile(uint256 _index) public view returns (string memory, address, uint256, uint256) {
        require(_index < files.length, "File does not exist");

        File memory file = files[_index];
        return (file.ipfsHash, file.uploader, file.fileSize, file.timestamp);
    }

    function getFileCount() public view returns (uint256) {
        return files.length;
    }        
}


