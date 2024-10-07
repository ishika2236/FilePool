const MyContract = artifacts.require("MyContract");

contract("MyContract", (accounts) => {
    
    let myContractInstance;
    const [uploader] = accounts; // The first account will be the uploader

    beforeEach(async () => {
        // Deploy a new instance of the contract before each test
        myContractInstance = await MyContract.new();
    });

    describe("File Management", () => {
        
        it("should store a file and emit an event", async () => {
            const ipfsHash = "QmT5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5"; // Example IPFS hash
            
            // Listen for the event emitted when a file is uploaded
            const result = await myContractInstance.storeFile(ipfsHash, { from: uploader });

            // Check that the event was emitted
            const event = result.logs[0];
            assert.equal(event.event, "FileUploaded", "FileUploaded event should be emitted");
            assert.equal(event.args.ipfsHash, ipfsHash, "IPFS hash should match");
            assert.equal(event.args.uploader, uploader, "Uploader address should match");
        });

        it("should retrieve a file correctly", async () => {
            const ipfsHash = "QmT5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5"; // Example IPFS hash
            
            await myContractInstance.storeFile(ipfsHash, { from: uploader });
            const file = await myContractInstance.getFile(0);

            assert.equal(file[0], ipfsHash, "IPFS hash should match the stored hash");
            assert.equal(file[1], uploader, "Uploader address should match");
        });

        it("should return the correct file count", async () => {
            await myContractInstance.storeFile("QmT5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5", { from: uploader });
            await myContractInstance.storeFile("QmR5NvUtoM3nQ4c3Z1gFBrq6WrPUPvfp45WwQ3scA4Ngh5", { from: uploader });

            const count = await myContractInstance.getFileCount();
            assert.equal(count.toString(), "2", "File count should be 2");
        });

        it("should revert when trying to retrieve a non-existent file", async () => {
            try {
                await myContractInstance.getFile(0);
                assert.fail("Expected revert not received");
            } catch (error) {
                assert(error.message.includes("File does not exist"), "Error message should contain 'File does not exist'");
            }
        });
    });
});
