const MyContract = artifacts.require('MyContract');

contract('MyContract', (accounts) => {
    const uploader = accounts[0];

    it('should upload a file with file size and track details', async () => {
        const contractInstance = await MyContract.deployed();

        // Sample IPFS hash and file size
        const ipfsHash = 'QmT5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5';
        const fileSize = 1024; // File size in bytes

        // Upload the file to the contract
        await contractInstance.storeFile(ipfsHash, fileSize, { from: uploader });

        // Retrieve the file details
        const file = await contractInstance.getFile(0);

        // Assert the values
        assert.equal(file[0], ipfsHash, 'IPFS hash mismatch');
        assert.equal(file[1], uploader, 'Uploader mismatch');
        assert.equal(file[2].toNumber(), fileSize, 'File size mismatch');
    });

    it('should return the correct file count', async () => {
        const contractInstance = await MyContract.deployed();

        const count = await contractInstance.getFileCount();
        assert.equal(count.toNumber(), 1, 'File count should be 1');
    });
});
