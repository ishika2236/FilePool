// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    
    // STRUCTURE TO HOLD FILE INFORMATION
    struct File {
        string ipfsHash; // IPFS hash of the uploaded file
        address uploader; // Address of the user who uploaded the file
    }

    // DYNAMIC ARRAY TO STORE FILES
    File[] public files;

    // EVENT TO EMIT WHEN A FILE IS UPLOADED
    event FileUploaded(string ipfsHash, address indexed uploader);

    // FUNCTION TO STORE FILE
    function storeFile(string memory _ipfsHash) public {
        // PUSH NEW FILE TO THE FILES ARRAY
        files.push(File(_ipfsHash, msg.sender));

        // EMIT EVENT FOR THE FILE UPLOAD
        emit FileUploaded(_ipfsHash, msg.sender);
    }

    // FUNCTION TO RETRIEVE FILE INFORMATION
    function getFile(uint256 _index) public view returns (string memory, address) {
        // ENSURE INDEX IS WITHIN BOUNDS
        require(_index < files.length, "File does not exist");

        // RETURN FILE IPFS HASH AND UPLOADER'S ADDRESS
        return (files[_index].ipfsHash, files[_index].uploader);
    }

    // FUNCTION TO GET TOTAL NUMBER OF FILES UPLOADED
    function getFileCount() public view returns (uint256) {
        return files.length;
    }
}
