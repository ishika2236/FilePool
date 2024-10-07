pragma solidity ^0.8.0;

contract MyContract {
    
    struct File {
        string ipfsHash; 
        address uploader; 
    }

    File[] public files;

    event FileUploaded(string ipfsHash, address indexed uploader);

    function storeFile(string memory _ipfsHash) public {
        files.push(File(_ipfsHash, msg.sender));

        emit FileUploaded(_ipfsHash, msg.sender);
    }

    function getFile(uint256 _index) public view returns (string memory, address) {
        require(_index < files.length, "File does not exist");

        return (files[_index].ipfsHash, files[_index].uploader);
    }

    function getFileCount() public view returns (uint256) {
        return files.length;
    }
}
