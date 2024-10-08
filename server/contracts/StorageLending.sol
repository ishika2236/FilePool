// contracts/StorageLending.sol
pragma solidity ^0.8.0;

contract StorageLending {
    struct Agreement {
        address provider;
        address requester;
        uint256 startTime;
        uint256 duration;
        uint256 payment;
        bool isActive;
    }

    mapping(uint256 => Agreement) public agreements;
    uint256 public agreementCount;

    event AgreementCreated(uint256 agreementId, address provider, address requester);
    event AgreementEnded(uint256 agreementId);

    function createAgreement(address _requester, uint256 _duration) external payable {
        agreementCount++;
        agreements[agreementCount] = Agreement({
            provider: msg.sender,
            requester: _requester,
            startTime: block.timestamp,
            duration: _duration,
            payment: msg.value,
            isActive: true
        });

        emit AgreementCreated(agreementCount, msg.sender, _requester);
    }

    function endAgreement(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.provider || msg.sender == agreement.requester, "Unauthorized");
        require(agreement.isActive, "Agreement already ended");
        require(block.timestamp >= agreement.startTime + agreement.duration, "Agreement not yet expired");

        agreement.isActive = false;
        payable(agreement.provider).transfer(agreement.payment);

        emit AgreementEnded(_agreementId);
    }
}