// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IPFSPaymentContract is Ownable {
    IERC20 public paymentToken;
    
    uint256 public constant RATE = 1e15; // 0.001 tokens per byte
    uint256 public constant MIN_PROVIDERS = 3;
    
    mapping(address => bool) public storageProviders;
    address[] public providerList;
    
    struct File {
        string ipfsHash;
        address uploader;
        uint256 fileSize;
        uint256 timestamp;
    }
    
    File[] public files;
    
    event PaymentProcessed(address indexed user, uint256 amount, string ipfsHash);
    event ProviderAdded(address provider);
    event ProviderRemoved(address provider);
    event FileUploaded(string ipfsHash, address indexed uploader, uint256 fileSize, uint256 timestamp);

    constructor(address initialOwner, address _tokenAddress) Ownable(initialOwner) {
        paymentToken = IERC20(_tokenAddress);
    }

    function calculatePayment(uint256 fileSize) public pure returns (uint256) {
        return fileSize * RATE;
    }

    function processPayment(string memory ipfsHash, uint256 fileSize) public {
        require(providerList.length >= MIN_PROVIDERS, "Not enough storage providers");
        
        uint256 paymentAmount = calculatePayment(fileSize);
        require(paymentToken.balanceOf(msg.sender) >= paymentAmount, "Insufficient token balance");
        require(paymentToken.allowance(msg.sender, address(this)) >= paymentAmount, "Token allowance too low");

        // Transfer tokens from user to this contract
        require(paymentToken.transferFrom(msg.sender, address(this), paymentAmount), "Token transfer failed");

        // Distribute tokens to storage providers
        uint256 providerShare = paymentAmount / providerList.length;
        for (uint i = 0; i < providerList.length; i++) {
            require(paymentToken.transfer(providerList[i], providerShare), "Provider payment failed");
        }

        // Store file metadata
        storeFile(ipfsHash, fileSize);
        emit PaymentProcessed(msg.sender, paymentAmount, ipfsHash);
    }

    function storeFile(string memory _ipfsHash, uint256 _fileSize) internal {
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

    function addStorageProvider(address provider) public onlyOwner {
        require(!storageProviders[provider], "Provider already exists");
        storageProviders[provider] = true;
        providerList.push(provider);
        emit ProviderAdded(provider);
    }

    function removeStorageProvider(address provider) public onlyOwner {
        require(storageProviders[provider], "Provider does not exist");
        storageProviders[provider] = false;
        for (uint i = 0; i < providerList.length; i++) {
            if (providerList[i] == provider) {
                providerList[i] = providerList[providerList.length - 1];
                providerList.pop();
                break;
            }
        }
        emit ProviderRemoved(provider);
    }

    function getProviderCount() public view returns (uint256) {
        return providerList.length;
    }
}