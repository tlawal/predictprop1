// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleProfitOracle
 * @dev Simple implementation of IProfitOracle for testing
 * In production, this would be replaced with Chainlink or platform backend
 */

import "./PolyPropVault.sol";

contract SimpleProfitOracle is IProfitOracle {
    address public owner;
    uint256 public evaluationFeePlatformSplit = 9000; // 90%
    uint256 public traderProfitPlatformSplit = 1000;  // 10%
    uint256 public traderProfitLPSplit = 1000;        // 10%

    // Mock trader addresses for testing
    address[] public mockTraders;

    constructor() {
        owner = msg.sender;
        // Add some mock traders for testing
        mockTraders.push(0x742d35Cc6597C05343Db7c5c00c6b8c6b8c6b8c6);
        mockTraders.push(0x742d35Cc6597C05343Db7c5c00c6b8c6b8c6b8c7);
        mockTraders.push(0x742d35Cc6597C05343Db7c5c00c6b8c6b8c6b8c8);
    }

    function getProfitAllocation(
        uint256 totalProfits
    ) external view override returns (
        bytes[] memory traderAllocations,
        uint256 platformFee,
        uint256 lpYield
    ) {
        // Simple allocation: 80% to traders, 10% platform, 10% LP
        platformFee = (totalProfits * traderProfitPlatformSplit) / 10000;
        lpYield = (totalProfits * traderProfitLPSplit) / 10000;
        uint256 traderTotal = totalProfits - platformFee - lpYield;

        // Distribute evenly among mock traders for testing
        traderAllocations = new bytes[](mockTraders.length);
        uint256 perTrader = traderTotal / mockTraders.length;

        for (uint256 i = 0; i < mockTraders.length; i++) {
            traderAllocations[i] = abi.encode(mockTraders[i], perTrader);
        }
    }

    function getEvaluationFeeSplit(
        uint256 totalFees
    ) external view override returns (
        uint256 platformFee,
        uint256 lpYield
    ) {
        // Simple split: 90% platform, 10% LP
        platformFee = (totalFees * evaluationFeePlatformSplit) / 10000;
        lpYield = totalFees - platformFee;
    }

    function updateFeeSplits(
        uint256 _evaluationFeePlatformSplit,
        uint256 _traderProfitPlatformSplit,
        uint256 _traderProfitLPSplit
    ) external {
        require(msg.sender == owner, "Only owner can update splits");
        evaluationFeePlatformSplit = _evaluationFeePlatformSplit;
        traderProfitPlatformSplit = _traderProfitPlatformSplit;
        traderProfitLPSplit = _traderProfitLPSplit;
    }
}
