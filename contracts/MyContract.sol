// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";

contract Space_Share {
    struct StorageOwner {
        address SO;
        uint256 volumeGB;
        uint256 pricePerGB;
        string SOConnectionInfo;
    }

    struct DataOwner {
        address DO;
        string DOConnectionInfo;
    }

    struct StorageContract {
        address DO;
        address SO;
        string SOConnectionInfo;
        string DOConnectionInfo;
        uint256 volumeGB;
        uint256 startDate;
        uint256 pricePerGB;
    }

    mapping(address => StorageOwner) public StorageOwnerMap;
    mapping(address => DataOwner) public DataOwnerMap;
    mapping(bytes32 => StorageContract) public StorageContractMap;

    // MAPPING TO TRACK AMOUNTS OWED TO STORAGE OWNERS
    mapping(address => uint256) public pendingWithdrawals;

    event StorageContractCreated(address dataOwner, address storageOwner, uint256 volumeGB, uint pricePerGB, uint256 startDate);

    address[] SOList;
    address[] DOList;   
    StorageOwner[] allSOList;
    bytes32[] storageContractList;

    error Unauthorized();
    error InsufficientPayment(uint256 required, uint256 sent);

    modifier isExistingStorageOwner(address SO) {
        bool flag = false;
        uint256 l = SOList.length;
        unchecked {
            for (uint256 i = 0; i < l; i++) {
                if (SOList[i] == SO) {
                    flag = true;
                    break;
                }
            }
        }
        if (flag == false) revert Unauthorized();
        _;
    }

    // FUNCTION TO CREATE A STORAGE ORDER
    function createStorageOrder(
        uint256 volumeGB,
        uint256 pricePerGB,
        string memory SOConnectionInfo
    ) public {
        bool flag = true;
        uint256 l = SOList.length;
        address SO = msg.sender;
        unchecked {
            for (uint256 i = 0; i < l; i++) {
                if (SOList[i] == SO) {
                    flag = false;
                    break;
                }
            }
        }
        if (flag == false) revert Unauthorized();
        StorageOwnerMap[SO] = StorageOwner(
            SO,
            volumeGB,
            pricePerGB,
            SOConnectionInfo
        );
        SOList.push(SO);
        allSOList.push(StorageOwnerMap[SO]);
    }

    // FUNCTION TO GET A STORAGE ORDER
    function getStorageOrder(address _SO)
        public
        view
        isExistingStorageOwner(_SO)
        returns (StorageOwner memory SO)
    {
        return StorageOwnerMap[_SO];
    }

    // FUNCTION TO GET ALL STORAGE ORDERS
    function getAllStorageOrder() view public returns (StorageOwner[] memory){
        return allSOList;
    }

    // FUNCTION TO CANCEL A STORAGE ORDER
    function cancelStorageOrder(address SO) public isExistingStorageOwner(SO) {
        delete StorageOwnerMap[SO];
        uint256 index;
        uint256 l = getStorageOrderLength();
        for (uint256 i = 0; i < l; i++) {
            if (SO == SOList[i]) {
                index = i;
                break;
            }
        }
        SOList[index] = SOList[SOList.length - 1];
        SOList.pop();
        for (uint256 i = 0; i < l; i++){
            if (SO == allSOList[i].SO){
                index = i;
                break;
            }
        }
        allSOList[index] = allSOList[allSOList.length - 1];
        allSOList.pop();
    }

    function getStorageOrderLength() public view returns (uint256) {
        return SOList.length;
    }

    // FUNCTION TO CREATE A STORAGE CONTRACT (WITH PAYMENT)
    function createStorageContract(address SO, string calldata DOConnectionInfo)
        public
        payable
    {
        DataOwnerMap[msg.sender] = DataOwner(msg.sender, DOConnectionInfo);
        DOList.push(msg.sender);
        bytes32 key = keccak256(abi.encodePacked(msg.sender, SO));
        StorageOwner memory so = getStorageOrder(SO);

        // CALCULATING REQUIRED PAYMENT
        uint256 totalPayment = so.pricePerGB * so.volumeGB;

        // ENSURING THAT ENOUGH FUNDS ARE SENT BY DATA OWNER
        if (msg.value < totalPayment) {
            revert InsufficientPayment(totalPayment, msg.value);
        }

        // IF EXCESS ETHER IS SENT, REFUND THE DIFFERENCE
        if (msg.value > totalPayment) {
            payable(msg.sender).transfer(msg.value - totalPayment);
        }

        // ADDING PAYMENT TO STORAGE OWNER'S PENDING WITHDRAWALS
        pendingWithdrawals[SO] += totalPayment;

        StorageContractMap[key] = StorageContract(
            msg.sender,
            SO,
            so.SOConnectionInfo,
            DOConnectionInfo,
            so.volumeGB,
            block.timestamp,
            so.pricePerGB
        );
        storageContractList.push(key);
        cancelStorageOrder(SO);
        emit StorageContractCreated(
            msg.sender,
            SO,
            so.volumeGB,
            so.pricePerGB,
            block.timestamp
        );
    }

    // FUNCTION TO ALLOW STORAGE OWNER TO WITHDRAW EARNINGS
    function withdrawPayments() public {
        uint256 amount = pendingWithdrawals[msg.sender];

        require(amount > 0, "No funds available for withdrawal");

        // RESETTING THE AMOUNT BEFORE TRANSFERRING (TO PREVENT RE-ENTRANCY ATTACKS)
        pendingWithdrawals[msg.sender] = 0;

        // TRANSFERRING FUNDS
        payable(msg.sender).transfer(amount);
    }

    // FUNCTION TO GET STORAGE CONTRACTS BY DATA OWNER
    function getStorageContractsByDO(address DO)
        public
        view
        returns (StorageContract[] memory)
    {
        StorageContract[] memory result = new StorageContract[](storageContractList.length);
        uint256 count = 0;

        for (uint256 i = 0; i < storageContractList.length; i++) {
            bytes32 key = storageContractList[i];
            StorageContract memory storageContract = StorageContractMap[key];

            if (storageContract.DO == DO) {
                result[count] = storageContract;
                count++;
            }
        }

        StorageContract[] memory contractsByDO = new StorageContract[](count);
        for (uint256 i = 0; i < count; i++) {
            contractsByDO[i] = result[i];
        }

        return contractsByDO;
    }

    // FUNCTION TO GET STORAGE CONTRACTS BY STORAGE OWNER
    function getStorageContractsBySO(address SO) public view returns (StorageContract[] memory) {
        StorageContract[] memory result = new StorageContract[](storageContractList.length);
        uint256 count = 0;

        for (uint256 i = 0; i < storageContractList.length; i++) {
            bytes32 key = storageContractList[i];
            StorageContract memory storageContract = StorageContractMap[key];

            if (storageContract.SO == SO) {
                result[count] = storageContract;
                count++;
            }
        }

        StorageContract[] memory contractsBySO = new StorageContract[](count);
        for (uint256 i = 0; i < count; i++) {
            contractsBySO[i] = result[i];
        }

        return contractsBySO;
    }

    // FUNCTION TO CANCEL A STORAGE CONTRACT
    function cancelStorageContract(address SO) public {
        uint256 index;
        uint256 length = DOList.length;
        for (uint256 i = 0; i < length; i++) {
            if (DOList[i] == msg.sender) {
                index = i;
                break;
            }
        }
        // require(index != 0x0,"User not having storage contract");
        bytes32 key = keccak256(abi.encodePacked(msg.sender, SO));

        delete StorageContractMap[key];
        delete DataOwnerMap[msg.sender];
        index = 0;
        length = storageContractList.length;
        for (uint256 i = 0; i < length; i++) {
            if (key == storageContractList[i]) {
                index = i;
                break;
            }
        }
        storageContractList[index] = storageContractList[length - 1];
        storageContractList.pop();
        // emit StorageContractCancelled(msg.sender, SO);
    }
}
