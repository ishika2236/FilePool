const Web3 = require('web3');
const MyContract = require('./build/contracts/MyContract.json'); // Path to compiled contract

async function main() {
    // Connect to local Ethereum node (e.g., Ganache)
    const web3 = new Web3('http://127.0.0.1:7545'); // Change to your provider

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const uploader = accounts[0]; // Use the first account for uploading

    // Deploy the contract
    const myContractInstance = await new web3.eth.Contract(MyContract.abi)
        .deploy({ data: MyContract.bytecode })
        .send({ from: uploader, gas: 1500000, gasPrice: '30000000000000' });

    console.log('Contract deployed at address:', myContractInstance.options.address);

    // Function to upload a file
    const uploadFile = async (ipfsHash) => {
        const result = await myContractInstance.methods.storeFile(ipfsHash).send({ from: uploader });
        console.log('File uploaded:', ipfsHash);
        console.log('Event emitted:', result.events.FileUploaded.returnValues);
    };

    // Function to retrieve a file
    const retrieveFile = async (index) => {
        try {
            const file = await myContractInstance.methods.getFile(index).call();
            console.log(`Retrieved file at index ${index}:`, file);
        } catch (error) {
            console.error('Error retrieving file:', error.message);
        }
    };

    // Function to get file count
    const getFileCount = async () => {
        const count = await myContractInstance.methods.getFileCount().call();
        console.log('Total files uploaded:', count);
    };

    // Sample IPFS hashes to upload
    const sampleHashes = [
        "QmT5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5",
        "QmR5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5"
    ];

    // Upload files
    for (const hash of sampleHashes) {
        await uploadFile(hash);
    }

    // Retrieve and log files
    await retrieveFile(0);
    await retrieveFile(1);
    
    // Get total file count
    await getFileCount();
}

// Run the service
main()
    .then(() => console.log('Service executed successfully.'))
    .catch((error) => console.error('Error in service execution:', error));
