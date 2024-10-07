// LOAD WEB3 LIBRARY TO INTERACT WITH THE BLOCKCHAIN
const Web3 = require('web3');

// INITIALIZE WEB3 INSTANCE WITH AN INFURA PROVIDER OR LOCAL NODE
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');

// SET UP YOUR SENDER'S WALLET ADDRESS AND PRIVATE KEY
const senderAddress = '0xYourSenderAddress';
const privateKey = 'YourPrivateKey';

// DEFINE THE RECEIVER'S WALLET ADDRESS
const receiverAddress = '0xReceiverAddress';

// SPECIFY THE AMOUNT TO SEND (IN WEI, CONVERT TO ETHER IF NEEDED)
const amountToSend = web3.utils.toWei('0.1', 'ether'); // 0.1 ETH

// CREATE A FUNCTION TO SEND A TRANSACTION
async function sendPayment() {

    // GET THE LATEST NONCE (TRANSACTION COUNT) FOR THE SENDER
    const nonce = await web3.eth.getTransactionCount(senderAddress, 'latest');

    // SET UP THE TRANSACTION DETAILS
    const transaction = {
        to: receiverAddress,        // RECEIVER'S ADDRESS
        value: amountToSend,        // AMOUNT IN WEI
        gas: 21000,                 // BASIC GAS LIMIT
        nonce: nonce,               // NONCE VALUE
        chainId: 1                  // MAINNET CHAIN ID (1 FOR ETH MAINNET)
    };

    // SIGN THE TRANSACTION WITH THE SENDER'S PRIVATE KEY
    const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);

    // SEND THE SIGNED TRANSACTION TO THE NETWORK
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // LOG THE TRANSACTION RECEIPT
    console.log('Transaction successful with hash:', receipt.transactionHash);
}

// CALL THE FUNCTION TO SEND THE PAYMENT
sendPayment()
    .then(() => console.log('Payment sent successfully!'))
    .catch(error => console.error('Error in sending payment:', error));
