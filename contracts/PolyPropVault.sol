// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PolyPropVault
 * @dev ERC4626 vault for LP deposits, targeting variable 10-20%+ APY from trader profits and eval fees on Polygon
 * @notice Yields not guaranteed but derived from splits:
 * - Evaluation fees: 90% to platform multisig, 10% to LPs (compounded)
 * - Trader profits: 80% to traders via withdrawal claims, 10% to platform, 10% to LPs (compounded)
 *
 * Key Features:
 * - ERC4626 compatible vault with tokenized shares
 * - USDC deposits and withdrawals
 * - Oracle-fed profit allocation from Polymarket resolutions
 * - AI integration hooks for optimized allocations
 * - Governance-controlled fee splits
 * - Security: ReentrancyGuard, Pausable, virtual shares
 * - Gas optimized with immutable constants and batch calculations
 */

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUSDC is IERC20 {
    function decimals() external view returns (uint8);
}

/**
 * @dev Interface for the oracle that provides profit allocation data
 * Can be implemented by platform backend or Chainlink
 */
interface IProfitOracle {
    /**
     * @notice Returns allocation data for resolved trades
     * @param totalProfits Total profits to allocate
     * @return traderAllocations Array of (trader, amount) pairs
     * @return platformFee Platform fee amount
     * @return lpYield LP yield amount to compound
     */
    function getProfitAllocation(
        uint256 totalProfits
    ) external view returns (
        bytes[] memory traderAllocations,
        uint256 platformFee,
        uint256 lpYield
    );

    /**
     * @notice Returns evaluation fee split
     * @param totalFees Total evaluation fees collected
     * @return platformFee Platform fee amount
     * @return lpYield LP yield amount to compound
     */
    function getEvaluationFeeSplit(
        uint256 totalFees
    ) external view returns (
        uint256 platformFee,
        uint256 lpYield
    );
}

contract PolyPropVault is ERC4626, ReentrancyGuard, Pausable, Ownable {
    // ========== IMMUTABLE CONSTANTS ==========
    // USDC contract address on Polygon
    IUSDC public immutable USDC;
    // Platform multisig address for fee collection
    address public immutable PLATFORM_MULTISIG;
    // Maximum BPS for fee calculations (100%)
    uint256 public constant MAX_BPS = 10000;

    // ========== STATE VARIABLES ==========
    // Oracle contract for profit allocation
    IProfitOracle public profitOracle;
    // Fee split percentages in basis points (BPS)
    uint256 public evaluationFeePlatformSplit = 9000; // 90%
    uint256 public traderProfitPlatformSplit = 1000;  // 10%
    uint256 public traderProfitLPSplit = 1000;        // 10%
    // Total yield accrued for APY calculation
    uint256 public totalYieldAccrued;
    // Virtual shares to prevent inflation attacks
    uint256 private _virtualShares;
    // Internal total assets tracking (includes virtual assets)
    uint256 private _totalAssets;

    // ========== EVENTS ==========
    event ProfitAllocated(
        uint256 totalProfits,
        uint256 traderAllocation,
        uint256 platformFee,
        uint256 lpYield
    );
    event EvaluationFeesCollected(
        uint256 totalFees,
        uint256 platformFee,
        uint256 lpYield
    );
    event FeeSplitsUpdated(
        uint256 evaluationFeePlatformSplit,
        uint256 traderProfitPlatformSplit,
        uint256 traderProfitLPSplit
    );
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TraderWithdrawalClaimed(
        address indexed trader,
        uint256 amount
    );

    // ========== MAPPINGS ==========
    // Trader withdrawal claims (address => amount)
    mapping(address => uint256) public traderWithdrawalClaims;

    // ========== MODIFIERS ==========
    /**
     * @dev Reverts if contract is paused
     */
    modifier notPaused() {
        require(!paused(), "PolyPropVault: contract paused");
        _;
    }

    /**
     * @dev Reverts if caller is not the oracle
     */
    modifier onlyOracle() {
        require(msg.sender == address(profitOracle), "PolyPropVault: caller is not oracle");
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Initializes the vault with USDC as underlying asset
     * @param _usdcAddress USDC contract address on Polygon
     * @param _platformMultisig Platform multisig address for fee collection
     * @param _profitOracle Initial profit oracle address
     */
    constructor(
        address _usdcAddress,
        address _platformMultisig,
        address _profitOracle
    )
        ERC4626(IERC20(_usdcAddress))
        ERC20("PolyProp Vault Share", "ppUSDC")
    {
        require(_usdcAddress != address(0), "PolyPropVault: invalid USDC address");
        require(_platformMultisig != address(0), "PolyPropVault: invalid platform multisig");
        require(_profitOracle != address(0), "PolyPropVault: invalid oracle address");

        USDC = IUSDC(_usdcAddress);
        PLATFORM_MULTISIG = _platformMultisig;
        profitOracle = IProfitOracle(_profitOracle);

        // Initialize virtual shares to prevent inflation attacks
        _virtualShares = 1e18; // 1 virtual share
        _totalAssets = 1e6;     // 1 virtual USDC (1e6 = 1 USDC with 6 decimals)
    }

    // ========== EXTERNAL FUNCTIONS ==========

    /**
     * @notice Allows LP to deposit USDC and mint vault shares
     * @param assets Amount of USDC to deposit
     * @param receiver Address to receive the shares
     * @return shares Amount of shares minted
     */
    function deposit(
        uint256 assets,
        address receiver
    ) public override notPaused nonReentrant returns (uint256 shares) {
        require(assets > 0, "PolyPropVault: deposit amount must be > 0");
        require(receiver != address(0), "PolyPropVault: invalid receiver");

        // Check user has enough USDC and allowance
        require(USDC.balanceOf(msg.sender) >= assets, "PolyPropVault: insufficient USDC balance");
        require(USDC.allowance(msg.sender, address(this)) >= assets, "PolyPropVault: insufficient USDC allowance");

        // Calculate shares to mint
        shares = previewDeposit(assets);

        // Effects: Update state before external calls
        _mint(receiver, shares);
        _totalAssets += assets;

        // Interactions: Transfer USDC
        require(USDC.transferFrom(msg.sender, address(this), assets), "PolyPropVault: USDC transfer failed");

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /**
     * @notice Allows LP to redeem shares for USDC
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the USDC
     * @param owner Address that owns the shares
     * @return assets Amount of USDC withdrawn
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override notPaused nonReentrant returns (uint256 assets) {
        require(shares > 0, "PolyPropVault: redeem amount must be > 0");
        require(receiver != address(0), "PolyPropVault: invalid receiver");

        // Check owner has enough shares
        require(balanceOf(owner) >= shares, "PolyPropVault: insufficient share balance");

        // Calculate assets to return
        assets = previewRedeem(shares);
        require(assets <= _totalAssets, "PolyPropVault: insufficient vault assets");

        // Check for allowance if caller != owner
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            require(allowed >= shares, "PolyPropVault: insufficient allowance");
            _approve(owner, msg.sender, allowed - shares);
        }

        // Effects: Update state before external calls
        _burn(owner, shares);
        _totalAssets -= assets;

        // Interactions: Transfer USDC
        require(USDC.transfer(receiver, assets), "PolyPropVault: USDC transfer failed");

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    /**
     * @notice Allocates resolved trader profits (oracle only)
     * @param totalProfits Total profits to allocate from resolved trades
     * @dev Called by oracle after Polymarket resolution
     */
    function allocateProfits(uint256 totalProfits) external onlyOracle notPaused nonReentrant {
        require(totalProfits > 0, "PolyPropVault: profits must be > 0");

        // Get allocation from oracle (batched for gas efficiency)
        (bytes[] memory traderAllocations, uint256 platformFee, uint256 lpYield) =
            profitOracle.getProfitAllocation(totalProfits);

        // Validate allocation totals
        uint256 totalAllocated = platformFee + lpYield;
        for (uint256 i = 0; i < traderAllocations.length; i++) {
            // Decode trader allocation (address, amount)
            (address trader, uint256 amount) = abi.decode(traderAllocations[i], (address, uint256));
            totalAllocated += amount;
            traderWithdrawalClaims[trader] += amount;
        }
        require(totalAllocated <= totalProfits, "PolyPropVault: allocation exceeds profits");

        // Update yield tracking
        totalYieldAccrued += lpYield;
        _totalAssets += lpYield;

        // Transfer platform fee
        if (platformFee > 0) {
            require(USDC.transfer(PLATFORM_MULTISIG, platformFee), "PolyPropVault: platform fee transfer failed");
        }

        emit ProfitAllocated(totalProfits, totalProfits - platformFee - lpYield, platformFee, lpYield);
    }

    /**
     * @notice Collects evaluation fees and splits them (oracle only)
     * @param totalFees Total evaluation fees collected
     */
    function collectEvaluationFees(uint256 totalFees) external onlyOracle notPaused nonReentrant {
        require(totalFees > 0, "PolyPropVault: fees must be > 0");

        // Get fee split from oracle
        (uint256 platformFee, uint256 lpYield) = profitOracle.getEvaluationFeeSplit(totalFees);

        // Validate split
        require(platformFee + lpYield <= totalFees, "PolyPropVault: split exceeds fees");

        // Update yield tracking
        totalYieldAccrued += lpYield;
        _totalAssets += lpYield;

        // Transfer platform fee
        if (platformFee > 0) {
            require(USDC.transfer(PLATFORM_MULTISIG, platformFee), "PolyPropVault: platform fee transfer failed");
        }

        emit EvaluationFeesCollected(totalFees, platformFee, lpYield);
    }

    /**
     * @notice Allows traders to claim their allocated profits
     * @param amount Amount to claim
     */
    function claimTraderProfits(uint256 amount) external notPaused nonReentrant {
        require(amount > 0, "PolyPropVault: claim amount must be > 0");
        require(traderWithdrawalClaims[msg.sender] >= amount, "PolyPropVault: insufficient claim balance");

        // Effects: Update state before transfer
        traderWithdrawalClaims[msg.sender] -= amount;

        // Interactions: Transfer USDC
        require(USDC.transfer(msg.sender, amount), "PolyPropVault: claim transfer failed");

        emit TraderWithdrawalClaimed(msg.sender, amount);
    }

    /**
     * @notice Updates fee split percentages (owner only)
     * @param _evaluationFeePlatformSplit Platform split for evaluation fees (BPS)
     * @param _traderProfitPlatformSplit Platform split for trader profits (BPS)
     * @param _traderProfitLPSplit LP split for trader profits (BPS)
     */
    function updateFeeSplits(
        uint256 _evaluationFeePlatformSplit,
        uint256 _traderProfitPlatformSplit,
        uint256 _traderProfitLPSplit
    ) external onlyOwner {
        require(_evaluationFeePlatformSplit <= MAX_BPS, "PolyPropVault: invalid evaluation split");
        require(_traderProfitPlatformSplit + _traderProfitLPSplit <= MAX_BPS, "PolyPropVault: invalid profit splits");

        evaluationFeePlatformSplit = _evaluationFeePlatformSplit;
        traderProfitPlatformSplit = _traderProfitPlatformSplit;
        traderProfitLPSplit = _traderProfitLPSplit;

        emit FeeSplitsUpdated(_evaluationFeePlatformSplit, _traderProfitPlatformSplit, _traderProfitLPSplit);
    }

    /**
     * @notice Updates the profit oracle (owner only)
     * @param _newOracle New oracle address
     */
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "PolyPropVault: invalid oracle address");

        address oldOracle = address(profitOracle);
        profitOracle = IProfitOracle(_newOracle);

        emit OracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @notice Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resume operations (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== INTERNAL FUNCTIONS ==========

    /**
     * @dev Internal total assets calculation (includes virtual assets)
     */
    function _totalAssets() internal view override returns (uint256) {
        return _totalAssets;
    }

    /**
     * @dev Override to prevent inflation attacks with virtual shares
     */
    function _convertToShares(
        uint256 assets,
        Math.Rounding rounding
    ) internal view override returns (uint256) {
        uint256 totalShares = totalSupply() + _virtualShares;
        uint256 totalAssets = _totalAssets;

        if (totalAssets == 0) {
            return assets * _virtualShares / 1e6; // Scale to match virtual assets
        }

        return assets * totalShares / totalAssets;
    }

    /**
     * @dev Override to prevent inflation attacks with virtual shares
     */
    function _convertToAssets(
        uint256 shares,
        Math.Rounding rounding
    ) internal view override returns (uint256) {
        uint256 totalShares = totalSupply() + _virtualShares;
        uint256 totalAssets = _totalAssets;

        if (totalShares == 0) {
            return 0;
        }

        return shares * totalAssets / totalShares;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Returns current APY estimate
     * @return apy Annual percentage yield (basis points)
     * @dev Calculated as (totalYieldAccrued / TVL) * 365 * 100
     */
    function getEstimatedAPY() external view returns (uint256 apy) {
        uint256 tvl = _totalAssets;
        if (tvl == 0) return 0;

        // APY = (yield_accrued / tvl) * 365 * 100 (in basis points)
        apy = (totalYieldAccrued * 365 * 10000) / tvl;
    }

    /**
     * @notice Returns trader's claimable balance
     * @param trader Trader address
     * @return claimable Amount claimable by trader
     */
    function getTraderClaimable(address trader) external view returns (uint256 claimable) {
        return traderWithdrawalClaims[trader];
    }

    /**
     * @notice Returns current fee split configuration
     */
    function getFeeSplits() external view returns (
        uint256 evaluationPlatform,
        uint256 traderPlatform,
        uint256 traderLP
    ) {
        return (evaluationFeePlatformSplit, traderProfitPlatformSplit, traderProfitLPSplit);
    }

    // ========== OVERRIDE FUNCTIONS ==========

    /**
     * @dev Override to include pause check
     */
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override notPaused {
        super._deposit(caller, receiver, assets, shares);
    }

    /**
     * @dev Override to include pause check
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override notPaused {
        super._withdraw(caller, receiver, owner, assets, shares);
    }
}
