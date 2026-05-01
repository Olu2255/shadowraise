// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";

/// @title ShadowRaiseConfidentialToken
/// @notice Minimal ERC-7984 confidential credit token for private investment amounts.
contract ShadowRaiseConfidentialToken is ERC7984, Ownable {
    mapping(address => bool) public hasClaimedDemoCredits;

    constructor()
        ERC7984("ShadowRaise Confidential Credit", "sRCC", "")
        Ownable(msg.sender)
    {}

    function mint(
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner returns (euint256) {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);
        return _mint(to, amount);
    }

    /// @notice Testnet-only faucet for hackathon demos.
    /// @dev Not production logic. A production token should use proper issuance,
    /// caps, compliance controls, and anti-sybil protections.
    function claimDemoCredits() external returns (euint256) {
        require(!hasClaimedDemoCredits[msg.sender], "already claimed");

        hasClaimedDemoCredits[msg.sender] = true;
        return _mint(msg.sender, Nox.toEuint256(1000));
    }
}
