// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./adapters/AaveAdapter.sol";
import "./adapters/MentoAdapter.sol";
import "./adapters/UniswapAdapter.sol";
import "./interfaces/IERC20.sol";
import "./libraries/SafeERC20.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Price Oracle Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @notice Minimal oracle interface for IL detection and guardrail checks.
 *         Plug in Chainlink, Redstone, or any compatible feed.
 *         Returns price with 18 decimal precision.
 */
interface IPriceOracle {
    function getPrice(address asset) external view returns (uint256);
}

// ─────────────────────────────────────────────────────────────────────────────
// ReentrancyGuard (inline — no OZ dependency needed)
// ─────────────────────────────────────────────────────────────────────────────

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;
    uint256 private _status;

    constructor() { _status = _NOT_ENTERED; }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SentinelExecutor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title  SentinelExecutor
 * @notice Singleton contract managing all user savings strategies.
 *         Mainnet-safe: circuit breaker, reentrancy guard, oracle support,
 *         restricted agent withdraw, per-user strategy allocations.
 *
 * Architecture:
 *   User Wallet (Privy EOA)
 *     → approve() this contract to spend their tokens
 *     → registerGoal() to register position
 *     → withdraw() to exit anytime (even when contract is paused)
 *
 *   Agent Wallet (single backend EOA = agentSigner)
 *     → calls executeAaveSupply(), executeUniswapLP(), rebalance(),
 *       executeMentoSwap(), checkAndExitLPIfIL()
 *     → emergencyWithdraw() only when contract is paused
 *     → NEVER holds user funds
 *
 * Non-custodial:
 *   Smart contract holds yield positions on behalf of users — same model as
 *   Yearn Finance and other DeFi vaults. No human (agent, owner, or anyone)
 *   has discretionary control over user funds. All movements are governed
 *   by smart contract rules only.
 *
 *   Aave aTokens  → held by SentinelExecutor on behalf of userWallet
 *   Uniswap LP    → NFT held by UniswapAdapter as escrow for userWallet
 *   Mento output  → sent directly to userWallet
 *   This contract → never holds funds permanently; positions always redeemable
 *                   by user via withdraw() at any time, even when paused
 */
contract SentinelExecutor is ReentrancyGuard {

    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────

    address public owner;

    // FIX #8 — Two-step ownership transfer.
    // Versi lama: transferOwnership langsung apply — typo = owner hilang permanen.
    // Fix: propose dulu, pendingOwner harus acceptOwnership() dari address baru.
    address public pendingOwner;

    address public agentSigner;
    address public treasury;
    address public priceOracle;

    bool public paused;

    AaveAdapter    public aaveAdapter;
    MentoAdapter   public mentoAdapter;
    UniswapAdapter public uniswapAdapter;

    address public wETH;
    address public usdm;

    mapping(address => uint8) public assetDecimals;

    // ─────────────────────────────────────────────
    // Asset Whitelist
    // ─────────────────────────────────────────────

    mapping(address => bool) public whitelistedAssets;

    // ─────────────────────────────────────────────
    // Guardrail Constants
    // ─────────────────────────────────────────────

    uint256 public constant MAX_LP_ALLOCATION_BPS   = 3000;   // 30%
    uint256 public constant MAX_VOLATILE_ALLOC_BPS  = 4000;   // 40%
    uint256 public constant IL_STOP_LOSS_BPS        = 500;    // 5%
    uint256 public constant MAX_REBALANCE_INTERVAL  = 24 hours;
    uint256 public constant MAX_SLIPPAGE_BPS        = 100;    // 1%
    uint256 public constant PERFORMANCE_FEE_BPS     = 500;    // 5% — channelled to disability causes
    uint256 public constant BPS_DENOMINATOR         = 10_000;

    // FIX — epoch duration: MIN adalah floor untuk proteksi abuse.
    // User bebas pilih epochDuration >= MIN saat registerGoal().
    // Mingguan: 7 days. Bulanan: 30 days. Dikontrol user, bukan agent.
    // Worst case agent key bocor: attacker drain maks 1x spendLimit per epochDuration pilihan user.
    uint256 public constant MIN_EPOCH_DURATION      = 7 days;

    // FIX #6 — Batas maksimum LP position per user.
    // Tanpa ini: unbounded array → withdraw() / emergencyWithdraw() bisa OOG.
    uint256 public constant MAX_LP_POSITIONS        = 10;

    // ─────────────────────────────────────────────
    // Strategy Allocation (per user)
    // ─────────────────────────────────────────────

    struct StrategyAllocation {
        uint256 stableAllocationBps;
        uint256 lpAllocationBps;
        uint256 wethAllocationBps;
    }

    mapping(address => StrategyAllocation) public allocations;

    StrategyAllocation public defaultAllocation = StrategyAllocation({
        stableAllocationBps: 10_000,
        lpAllocationBps:     0,
        wethAllocationBps:   0
    });

    // ─────────────────────────────────────────────
    // User Position
    // ─────────────────────────────────────────────

    struct Position {
        uint256 principalDeposited;
        uint256 lastRebalancedAt;
        bool    userPaused;
        uint256 goalTarget;
        uint256 goalDeadline;
        uint256 spendLimit;
        uint256 cumulativeSpent;
        uint256 epochStart;
        // FIX — Non-Custodial Epoch: user set on-chain saat registerGoal().
        // Sebelum: epoch duration dikontrol backend (agent) → agent bisa reset
        //          lebih sering dari yang user inginkan.
        // Fix: simpan di sini → resetSpendEpoch() enforce pilihan user on-chain.
        // Contoh: user mingguan → epochDuration = 7 days
        //         user bulanan  → epochDuration = 30 days
        uint256 epochDuration;
    }

    struct LPPosition {
        address pool;
        uint256 tokenId;
        uint256 entryValueUSD;
        uint256 entryTimestamp;
    }

    mapping(address => Position)     public positions;
    mapping(address => LPPosition[]) public lpPositions;

    mapping(address => mapping(address => uint256)) public userATokenShares;
    mapping(address => uint256) public totalATokenShares;
    mapping(address => mapping(address => uint256)) public parkedFunds;
    mapping(address => uint256) public allowanceExpiry;

    // ─────────────────────────────────────────────
    // Agent Signer Timelock
    // ─────────────────────────────────────────────

    address public pendingAgentSigner;
    uint256 public agentSignerChangeAt;
    uint256 public constant AGENT_SIGNER_TIMELOCK = 48 hours;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    // System
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event AgentSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event AgentSignerProposed(address indexed proposed, uint256 executeAt);
    event AgentSignerChangeCancelled(address indexed cancelled);
    event OracleUpdated(address indexed oracle);

    // FIX #8 — Two-step ownership events
    event OwnershipTransferProposed(address indexed currentOwner, address indexed proposedOwner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed cancelledProposal);

    // User lifecycle
    event GoalRegistered(address indexed user, address indexed asset, uint256 amount);
    event AllowanceExpirySet(address indexed user, uint256 expiresAt);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event GoalCompleted(address indexed user, uint256 totalReturned, uint256 feeTaken);

    // FIX #10 — EmergencyWithdraw sekarang emit actual amount
    event EmergencyWithdraw(address indexed user, address indexed asset, uint256 totalAmount);

    event WithdrawFallback(address indexed user, address indexed asset, uint256 amount, string reason);

    // Strategy
    event StrategyExecuted(address indexed user, address indexed asset, uint256 amount, string protocol);
    event Rebalanced(address indexed user);
    event LPEntered(address indexed user, uint256 tokenId, uint256 valueUSD);
    event LPExited(address indexed user, uint256 tokenId, string reason);
    event AllocationSet(address indexed user, uint256 stableBps, uint256 lpBps, uint256 wethBps);

    // FIX #12 — Event untuk forwardToUser agar pergerakan dana ter-log
    event FundsForwarded(address indexed user, address indexed asset, uint256 amount);

    // Epoch
    event EpochReset(address indexed user, uint256 newEpochStart);
    event EpochDurationUpdated(address indexed user, uint256 newDuration);

    // Guardrails
    event AssetWhitelisted(address indexed asset, bool status);
    event GuardrailTripped(address indexed user, string reason);

    // ─────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────

    error NotOwner();
    error NotAgent();
    error NotUser();
    error ContractPaused();
    error NotPaused();
    error AssetNotWhitelisted(address asset);
    error UserPositionPaused(address user);
    error RebalanceTooSoon(uint256 nextAllowed);
    error EpochResetTooSoon(uint256 nextAllowed);
    error TimelockNotExpired(uint256 executeAt);
    error NoPendingSignerChange();
    error NoPendingOwnerChange();
    error LPAllocationExceeded(uint256 requested, uint256 max);
    error VolatileAllocationExceeded(uint256 requested, uint256 max);
    error AllocationSumInvalid(uint256 sum);
    error SlippageExceeded(uint256 actual, uint256 max);
    error SpendLimitExceeded(uint256 requested, uint256 remaining);
    error ZeroAmount();
    error NoPosition();
    error OracleNotSet();
    error AllowanceExpired();
    error EpochDurationTooShort(uint256 provided, uint256 minimum);
    error MaxLPPositionsReached(uint256 max);
    error InvalidGoalTarget();

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agentSigner) revert NotAgent();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyWhitelisted(address asset) {
        if (!whitelistedAssets[asset]) revert AssetNotWhitelisted(asset);
        _;
    }

    modifier userNotPaused(address user) {
        if (positions[user].userPaused) revert UserPositionPaused(user);
        _;
    }

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    constructor(
        address _agentSigner,
        address _treasury,
        address _aaveAdapter,
        address _mentoAdapter,
        address _uniswapAdapter
    ) {
        require(_agentSigner    != address(0), "SentinelExecutor: zero agentSigner");
        require(_treasury       != address(0), "SentinelExecutor: zero treasury");
        require(_aaveAdapter    != address(0), "SentinelExecutor: zero aaveAdapter");
        require(_mentoAdapter   != address(0), "SentinelExecutor: zero mentoAdapter");
        require(_uniswapAdapter != address(0), "SentinelExecutor: zero uniswapAdapter");
        owner          = msg.sender;
        agentSigner    = _agentSigner;
        treasury       = _treasury;
        aaveAdapter    = AaveAdapter(_aaveAdapter);
        mentoAdapter   = MentoAdapter(_mentoAdapter);
        uniswapAdapter = UniswapAdapter(_uniswapAdapter);
    }

    // ─────────────────────────────────────────────
    // Admin — Epoch Reset
    // ─────────────────────────────────────────────

    /**
     * @notice Reset spend epoch user (cumulativeSpent → 0).
     *         Dipanggil agent sesuai epochDuration pilihan user.
     *
     * FIX — Non-Custodial Epoch:
     *   Sebelum: enforce MIN_EPOCH_DURATION (hardcoded) → agent bisa reset
     *            lebih sering dari yang user setujui.
     *   Fix: enforce pos.epochDuration yang di-set USER saat registerGoal().
     *        Agent tidak bisa reset lebih cepat dari pilihan user.
     *        Ini enforced on-chain → benar-benar non-custodial.
     */
    function resetSpendEpoch(address userWallet) external {
        if (msg.sender != agentSigner && msg.sender != owner) revert NotAgent();
        Position storage pos = positions[userWallet];
        if (pos.principalDeposited == 0) revert NoPosition();

        // FIX: gunakan epochDuration user, bukan MIN_EPOCH_DURATION global
        uint256 duration    = pos.epochDuration > 0 ? pos.epochDuration : MIN_EPOCH_DURATION;
        uint256 nextAllowed = pos.epochStart + duration;
        if (block.timestamp < nextAllowed) revert EpochResetTooSoon(nextAllowed);

        pos.cumulativeSpent = 0;
        pos.epochStart      = block.timestamp;
        emit EpochReset(userWallet, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // Admin — Circuit Breaker
    // ─────────────────────────────────────────────

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ─────────────────────────────────────────────
    // Admin — Configuration
    // ─────────────────────────────────────────────

    function proposeAgentSigner(address _proposed) external onlyOwner {
        require(_proposed != address(0), "SentinelExecutor: zero agentSigner");
        require(_proposed != agentSigner, "SentinelExecutor: same as current");
        pendingAgentSigner  = _proposed;
        agentSignerChangeAt = block.timestamp + AGENT_SIGNER_TIMELOCK;
        emit AgentSignerProposed(_proposed, agentSignerChangeAt);
    }

    function executeAgentSignerChange() external onlyOwner {
        if (pendingAgentSigner == address(0)) revert NoPendingSignerChange();
        if (block.timestamp < agentSignerChangeAt) revert TimelockNotExpired(agentSignerChangeAt);

        address oldSigner  = agentSigner;
        agentSigner        = pendingAgentSigner;
        pendingAgentSigner = address(0);
        agentSignerChangeAt = 0;

        emit AgentSignerUpdated(oldSigner, agentSigner);
    }

    function cancelAgentSignerChange() external onlyOwner {
        if (pendingAgentSigner == address(0)) revert NoPendingSignerChange();
        address cancelled  = pendingAgentSigner;
        pendingAgentSigner = address(0);
        agentSignerChangeAt = 0;
        emit AgentSignerChangeCancelled(cancelled);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "SentinelExecutor: zero treasury");
        treasury = _treasury;
    }

    // ─────────────────────────────────────────────
    // FIX #8 — Two-Step Ownership Transfer
    // ─────────────────────────────────────────────

    /**
     * @notice Step 1: Owner propose transfer ke alamat baru.
     *         Tidak langsung apply — pendingOwner harus acceptOwnership() dulu.
     *
     * FIX: versi lama langsung apply → typo = owner hilang permanen.
     * Fix: two-step seperti OZ Ownable2Step.
     *      Owner lama tetap aktif sampai pendingOwner confirm.
     *      Kalau salah alamat: cancel sebelum dia acceptOwnership().
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SentinelExecutor: zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferProposed(owner, newOwner);
    }

    /**
     * @notice Step 2: Alamat baru confirm ownership.
     *         Harus dipanggil dari wallet pendingOwner itu sendiri.
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "SentinelExecutor: not pending owner");
        address oldOwner = owner;
        owner            = pendingOwner;
        pendingOwner     = address(0);
        emit OwnershipTransferred(oldOwner, owner);
    }

    /**
     * @notice Cancel pending ownership transfer.
     */
    function cancelOwnershipTransfer() external onlyOwner {
        if (pendingOwner == address(0)) revert NoPendingOwnerChange();
        address cancelled = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferCancelled(cancelled);
    }

    function setVolatileAssets(address _wETH) external onlyOwner {
        require(_wETH != address(0), "SentinelExecutor: zero wETH");
        wETH = _wETH;
    }

    function setUsdm(address _usdm) external onlyOwner {
        require(_usdm != address(0), "SentinelExecutor: zero usdm");
        usdm = _usdm;
    }

    function setWhitelistedAsset(address asset, bool status) external onlyOwner {
        if (status) require(assetDecimals[asset] > 0, "SentinelExecutor: set decimals first");
        whitelistedAssets[asset] = status;
        emit AssetWhitelisted(asset, status);
    }

    function setAssetDecimals(address asset, uint8 decimals) external onlyOwner {
        assetDecimals[asset] = decimals;
    }

    function setPriceOracle(address oracle) external onlyOwner {
        priceOracle = oracle;
        emit OracleUpdated(oracle);
    }

    function setDefaultAllocation(
        uint256 stableBps,
        uint256 lpBps,
        uint256 wethBps
    ) external onlyOwner {
        if (stableBps + lpBps + wethBps != BPS_DENOMINATOR) {
            revert AllocationSumInvalid(stableBps + lpBps + wethBps);
        }
        if (lpBps   > MAX_LP_ALLOCATION_BPS)  revert LPAllocationExceeded(lpBps, MAX_LP_ALLOCATION_BPS);
        if (wethBps > MAX_VOLATILE_ALLOC_BPS) revert VolatileAllocationExceeded(wethBps, MAX_VOLATILE_ALLOC_BPS);
        defaultAllocation = StrategyAllocation(stableBps, lpBps, wethBps);
    }

    // ─────────────────────────────────────────────
    // User: Register Goal
    // ─────────────────────────────────────────────

    /**
     * @notice Register a savings goal.
     *
     * @param asset          Input asset (must be whitelisted)
     * @param amount         Amount to register as principal
     * @param goalTarget     Target amount in asset units (must be > 0)
     * @param goalDeadline   Unix timestamp for goal deadline
     * @param spendLimit     Max agent can pull per epoch
     * @param epochDuration  Saving cycle duration: 7 days (weekly) or 30 days (monthly).
     *                       User sets this — enforced on-chain. Agent CANNOT reset
     *                       spend limit more frequently than this value.
     *                       Must be >= MIN_EPOCH_DURATION (7 days).
     * @param stableBps      Allocation to Aave stable yield (0 = use default)
     * @param lpBps          Allocation to Uniswap LP
     * @param wethBps        Allocation to WETH hold
     */
    function registerGoal(
        address asset,
        uint256 amount,
        uint256 goalTarget,
        uint256 goalDeadline,
        uint256 spendLimit,
        uint256 epochDuration,
        uint256 stableBps,
        uint256 lpBps,
        uint256 wethBps
    ) external onlyWhitelisted(asset) whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        // FIX #22 — goalTarget harus > 0, tidak bermakna mendaftar goal 0
        if (goalTarget == 0) revert InvalidGoalTarget();

        require(spendLimit > 0, "SentinelExecutor: spendLimit must be > 0");
        require(goalDeadline > block.timestamp, "SentinelExecutor: deadline must be in future");

        // FIX — Validasi epochDuration on-chain
        if (epochDuration < MIN_EPOCH_DURATION) {
            revert EpochDurationTooShort(epochDuration, MIN_EPOCH_DURATION);
        }

        // Set allocation
        if (stableBps + lpBps + wethBps == BPS_DENOMINATOR) {
            if (lpBps   > MAX_LP_ALLOCATION_BPS)  revert LPAllocationExceeded(lpBps, MAX_LP_ALLOCATION_BPS);
            if (wethBps > MAX_VOLATILE_ALLOC_BPS) revert VolatileAllocationExceeded(wethBps, MAX_VOLATILE_ALLOC_BPS);
            allocations[msg.sender] = StrategyAllocation(stableBps, lpBps, wethBps);
        } else {
            allocations[msg.sender] = defaultAllocation;
        }

        Position storage pos = positions[msg.sender];

        bool isNewPosition = pos.principalDeposited == 0;
        if (isNewPosition) {
            pos.cumulativeSpent = 0;
            pos.epochStart      = block.timestamp;
            pos.epochDuration   = epochDuration;  // FIX: set epoch pilihan user
        }
        // Catatan: top-up tidak overwrite epochDuration yang sudah ada.
        // Gunakan setEpochDuration() untuk mengubahnya secara eksplisit.

        pos.principalDeposited += _normalizeTo18(asset, amount);
        pos.goalTarget          = goalTarget;
        pos.goalDeadline        = goalDeadline;
        pos.spendLimit          = _normalizeTo18(asset, spendLimit);

        emit GoalRegistered(msg.sender, asset, amount);
        emit AllocationSet(
            msg.sender,
            allocations[msg.sender].stableAllocationBps,
            allocations[msg.sender].lpAllocationBps,
            allocations[msg.sender].wethAllocationBps
        );
    }

    // ─────────────────────────────────────────────
    // User: Update Epoch Duration
    // ─────────────────────────────────────────────

    /**
     * @notice User dapat mengubah epoch duration setelah posisi aktif.
     *         Tanpa ini user harus withdraw + registerGoal ulang hanya untuk
     *         ganti dari saving mingguan ke bulanan.
     *
     * Hanya user sendiri yang bisa panggil — agent/owner tidak bisa override.
     */
    function setEpochDuration(uint256 newDuration) external {
        if (positions[msg.sender].principalDeposited == 0) revert NoPosition();
        if (newDuration < MIN_EPOCH_DURATION) {
            revert EpochDurationTooShort(newDuration, MIN_EPOCH_DURATION);
        }
        positions[msg.sender].epochDuration = newDuration;
        emit EpochDurationUpdated(msg.sender, newDuration);
    }

    // ─────────────────────────────────────────────
    // User: Pause / Resume own position
    // ─────────────────────────────────────────────

    function setUserPaused(bool _paused) external {
        if (positions[msg.sender].principalDeposited == 0) revert NoPosition();
        positions[msg.sender].userPaused = _paused;
    }

    function setAllowanceExpiry(uint256 expiresAt) external {
        require(expiresAt == 0 || expiresAt > block.timestamp, "Expiry must be in the future");
        allowanceExpiry[msg.sender] = expiresAt;
        emit AllowanceExpirySet(msg.sender, expiresAt);
    }

    function isAllowanceValid(address user) public view returns (bool) {
        uint256 expiry = allowanceExpiry[user];
        return expiry == 0 || expiry > block.timestamp;
    }

    // ─────────────────────────────────────────────
    // Agent: Execute Aave Withdraw (for rebalancing)
    // ─────────────────────────────────────────────

    function executeAaveWithdraw(
        address userWallet,
        address asset,
        uint256 amount
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(asset)
        userNotPaused(userWallet)
        returns (uint256 withdrawn)
    {
        if (amount == 0) revert ZeroAmount();
        Position storage pos = positions[userWallet];
        if (pos.principalDeposited == 0) revert NoPosition();

        _subATokenShares(userWallet, asset, amount);

        address aToken = aaveAdapter.pool().getReserveData(asset).aTokenAddress;
        IERC20(aToken).approve(address(aaveAdapter), 0);
        IERC20(aToken).approve(address(aaveAdapter), amount);

        withdrawn = aaveAdapter.withdraw(userWallet, asset, amount, address(this));
        parkedFunds[userWallet][asset] += withdrawn;
        emit StrategyExecuted(userWallet, asset, withdrawn, "aave_withdraw");
    }

    /**
     * @notice Agent forward sisa parkedFunds ke userWallet.
     *
     * FIX #11 — Tambah nonReentrant (konsisten dengan fungsi lain).
     * FIX #12 — Emit FundsForwarded per asset agar pergerakan dana ter-log.
     */
    function forwardToUser(
        address userWallet,
        address[] calldata assets
    ) external nonReentrant onlyAgent whenNotPaused userNotPaused(userWallet) {
        if (positions[userWallet].principalDeposited == 0) revert NoPosition();

        for (uint256 i = 0; i < assets.length; i++) {
            address asset  = assets[i];
            uint256 parked = parkedFunds[userWallet][asset];
            if (parked == 0) continue;

            // CEI: reset slot dulu sebelum transfer
            parkedFunds[userWallet][asset] = 0;
            IERC20(asset).safeTransfer(userWallet, parked);

            // FIX #12: emit event agar pergerakan dana ter-log
            emit FundsForwarded(userWallet, asset, parked);
        }
    }

    // ─────────────────────────────────────────────
    // Agent: Execute Aave Supply
    // ─────────────────────────────────────────────

    function executeAaveSupply(
        address userWallet,
        address asset,
        uint256 amount,
        uint256 minOut
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(asset)
        userNotPaused(userWallet)
        returns (uint256 aTokensReceived)
    {
        _checkAndUpdateSpend(userWallet, _normalizeTo18(asset, amount));

        IERC20(asset).safeTransferFrom(userWallet, address(this), amount);
        IERC20(asset).approve(address(aaveAdapter), 0);
        IERC20(asset).approve(address(aaveAdapter), amount);

        aTokensReceived = aaveAdapter.supply(userWallet, asset, amount);

        if (aTokensReceived < minOut) revert SlippageExceeded(aTokensReceived, minOut);

        _addATokenShares(userWallet, asset, aTokensReceived);

        emit StrategyExecuted(userWallet, asset, amount, "aave");
    }

    // ─────────────────────────────────────────────
    // Agent: Execute Uniswap LP
    // ─────────────────────────────────────────────

    function executeUniswapLP(
        address userWallet,
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 totalValueUSD,
        uint256 totalPortfolioUSD
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(token0)
        onlyWhitelisted(token1)
        userNotPaused(userWallet)
        returns (uint256 tokenId)
    {
        // FIX #6 — Batasi LP positions per user untuk cegah OOG di withdraw()
        if (lpPositions[userWallet].length >= MAX_LP_POSITIONS) {
            revert MaxLPPositionsReached(MAX_LP_POSITIONS);
        }

        StrategyAllocation storage alloc = allocations[userWallet];
        uint256 userMaxLPBps = alloc.lpAllocationBps > 0
            ? alloc.lpAllocationBps
            : defaultAllocation.lpAllocationBps;

        uint256 newLPTotal = _totalLPValue(userWallet) + totalValueUSD;
        uint256 maxLP      = (totalPortfolioUSD * userMaxLPBps) / BPS_DENOMINATOR;
        if (newLPTotal > maxLP) {
            emit GuardrailTripped(userWallet, "LP_ALLOCATION_EXCEEDED");
            revert LPAllocationExceeded(newLPTotal, maxLP);
        }

        if (_isVolatile(token0) || _isVolatile(token1)) {
            address volatileToken = _isVolatile(token0) ? token0 : token1;
            uint256 volatileAmt   = _isVolatile(token0) ? amount0 : amount1;
            uint256 volatileUSD   = _toUSD(volatileToken, volatileAmt);
            uint256 maxVolatile   = (totalPortfolioUSD * MAX_VOLATILE_ALLOC_BPS) / BPS_DENOMINATOR;
            if (volatileUSD > maxVolatile) {
                emit GuardrailTripped(userWallet, "VOLATILE_ALLOCATION_EXCEEDED");
                revert VolatileAllocationExceeded(volatileUSD, maxVolatile);
            }
        }

        _checkAndUpdateSpend(userWallet, _normalizeTo18(token0, amount0) + _normalizeTo18(token1, amount1));

        uint256 parked0 = parkedFunds[userWallet][token0];
        if (parked0 >= amount0) {
            parkedFunds[userWallet][token0] -= amount0;
        } else {
            parkedFunds[userWallet][token0] = 0;
            IERC20(token0).safeTransferFrom(userWallet, address(this), amount0 - parked0);
        }

        uint256 parked1 = parkedFunds[userWallet][token1];
        if (parked1 >= amount1) {
            parkedFunds[userWallet][token1] -= amount1;
        } else {
            parkedFunds[userWallet][token1] = 0;
            IERC20(token1).safeTransferFrom(userWallet, address(this), amount1 - parked1);
        }

        IERC20(token0).approve(address(uniswapAdapter), 0);
        IERC20(token0).approve(address(uniswapAdapter), amount0);
        IERC20(token1).approve(address(uniswapAdapter), 0);
        IERC20(token1).approve(address(uniswapAdapter), amount1);

        tokenId = uniswapAdapter.mintPosition(userWallet, token0, token1, amount0, amount1, amount0Min, amount1Min);

        lpPositions[userWallet].push(LPPosition({
            pool:           address(uniswapAdapter),
            tokenId:        tokenId,
            entryValueUSD:  totalValueUSD,
            entryTimestamp: block.timestamp
        }));

        emit LPEntered(userWallet, tokenId, totalValueUSD);
    }

    // ─────────────────────────────────────────────
    // Agent: IL Stop Loss
    // ─────────────────────────────────────────────

    /**
     * FIX #3 — Tambah try/catch pada exitPosition.
     *   Versi lama: bare call → satu LP gagal = seluruh fungsi revert →
     *   agent tidak bisa exit posisi IL manapun.
     *   Fix: try/catch per position, identik dengan pattern di withdraw().
     *
     * FIX #23 — Validasi panjang currentValues == panjang lps.
     *   Versi lama: agent bisa pass array lebih pendek untuk skip posisi tertentu.
     *   Fix: require length match sebelum loop.
     */
    function checkAndExitLPIfIL(
        address userWallet,
        uint256[] calldata currentValues
    ) external nonReentrant onlyAgent whenNotPaused userNotPaused(userWallet) {
        LPPosition[] storage lps = lpPositions[userWallet];

        // FIX #23: pastikan currentValues cover semua LP positions
        require(
            currentValues.length == lps.length,
            "SentinelExecutor: currentValues length mismatch"
        );

        uint256 i = 0;
        while (i < lps.length) {
            uint256 currentVal = currentValues[i];
            if (currentVal == 0) { i++; continue; }

            uint256 entryVal = lps[i].entryValueUSD;
            bool exited = false;

            if (currentVal < entryVal) {
                uint256 lossBps = ((entryVal - currentVal) * BPS_DENOMINATOR) / entryVal;

                if (lossBps >= IL_STOP_LOSS_BPS) {
                    // FIX #3 — try/catch: satu gagal tidak freeze semua
                    uint256 tokenId = lps[i].tokenId;
                    try uniswapAdapter.exitPosition(userWallet, tokenId) {
                        emit LPExited(userWallet, tokenId, "IL_STOP_LOSS");
                        lps[i] = lps[lps.length - 1];
                        lps.pop();
                        exited = true;
                    } catch {
                        // Gagal exit — log dan lanjut ke posisi berikutnya
                        emit GuardrailTripped(userWallet, "IL_EXIT_FAILED");
                    }
                }
            }
            if (!exited) i++;
        }
    }

    // ─────────────────────────────────────────────
    // Agent: Rebalance Gate
    // ─────────────────────────────────────────────

    function rebalance(address userWallet)
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        userNotPaused(userWallet)
    {
        Position storage pos = positions[userWallet];
        if (pos.principalDeposited == 0) revert NoPosition();

        if (block.timestamp < pos.lastRebalancedAt + MAX_REBALANCE_INTERVAL) {
            revert RebalanceTooSoon(pos.lastRebalancedAt + MAX_REBALANCE_INTERVAL);
        }

        pos.lastRebalancedAt = block.timestamp;
        emit Rebalanced(userWallet);
    }

    // ─────────────────────────────────────────────
    // Agent: Uniswap Swap (WETH swaps only)
    // ─────────────────────────────────────────────

    function executeUniswapSwap(
        address userWallet,
        address fromAsset,
        address toAsset,
        uint256 amountIn,
        uint256 minAmountOut
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(fromAsset)
        onlyWhitelisted(toAsset)
        userNotPaused(userWallet)
        returns (uint256 amountOut)
    {
        _checkAndUpdateSpend(userWallet, _normalizeTo18(fromAsset, amountIn));

        uint256 parked = parkedFunds[userWallet][fromAsset];
        if (parked >= amountIn) {
            parkedFunds[userWallet][fromAsset] -= amountIn;
        } else {
            parkedFunds[userWallet][fromAsset] = 0;
            uint256 needed = amountIn - parked;
            IERC20(fromAsset).safeTransferFrom(userWallet, address(this), needed);
        }
        IERC20(fromAsset).approve(address(uniswapAdapter), 0);
        IERC20(fromAsset).approve(address(uniswapAdapter), amountIn);

        amountOut = uniswapAdapter.swap(userWallet, fromAsset, toAsset, amountIn, minAmountOut);

        if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

        emit StrategyExecuted(userWallet, fromAsset, amountIn, "uniswap_swap");
    }

    // ─────────────────────────────────────────────
    // Agent: Mento Swap → Aave Supply (atomic, 1 approval)
    // ─────────────────────────────────────────────

    function executeMentoSwapAndSupply(
        address userWallet,
        address fromAsset,
        address toAsset,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 minATokens
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(fromAsset)
        onlyWhitelisted(toAsset)
        userNotPaused(userWallet)
        returns (uint256 amountOut, uint256 aTokensReceived)
    {
        _checkAndUpdateSpend(userWallet, _normalizeTo18(fromAsset, amountIn));

        IERC20(fromAsset).safeTransferFrom(userWallet, address(this), amountIn);
        IERC20(fromAsset).approve(address(mentoAdapter), 0);
        IERC20(fromAsset).approve(address(mentoAdapter), amountIn);

        amountOut = mentoAdapter.swap(address(this), fromAsset, toAsset, amountIn, minAmountOut);
        if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

        IERC20(toAsset).approve(address(aaveAdapter), 0);
        IERC20(toAsset).approve(address(aaveAdapter), amountOut);
        aTokensReceived = aaveAdapter.supply(userWallet, toAsset, amountOut);
        if (aTokensReceived < minATokens) revert SlippageExceeded(aTokensReceived, minATokens);

        _addATokenShares(userWallet, toAsset, aTokensReceived);

        emit StrategyExecuted(userWallet, fromAsset, amountIn, "mento_swap_supply");
        emit StrategyExecuted(userWallet, toAsset, amountOut, "aave");
    }

    function executeMentoSwap(
        address userWallet,
        address fromAsset,
        address toAsset,
        uint256 amountIn,
        uint256 minAmountOut
    )
        external
        nonReentrant
        onlyAgent
        whenNotPaused
        onlyWhitelisted(fromAsset)
        onlyWhitelisted(toAsset)
        userNotPaused(userWallet)
        returns (uint256 amountOut)
    {
        _checkAndUpdateSpend(userWallet, _normalizeTo18(fromAsset, amountIn));

        uint256 parked = parkedFunds[userWallet][fromAsset];
        if (parked >= amountIn) {
            parkedFunds[userWallet][fromAsset] -= amountIn;
        } else {
            parkedFunds[userWallet][fromAsset] = 0;
            uint256 needed = amountIn - parked;
            IERC20(fromAsset).safeTransferFrom(userWallet, address(this), needed);
        }

        IERC20(fromAsset).approve(address(mentoAdapter), 0);
        IERC20(fromAsset).approve(address(mentoAdapter), amountIn);

        amountOut = mentoAdapter.swap(userWallet, fromAsset, toAsset, amountIn, minAmountOut);
        if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

        emit StrategyExecuted(userWallet, fromAsset, amountIn, "mento");
    }

    // ─────────────────────────────────────────────
    // User: Withdraw ALL
    // ─────────────────────────────────────────────

    /**
     * @notice User menarik SEMUA dananya — Aave + LP + parkedFunds — dalam satu call.
     *
     * FIX #1  — Fee calculation: normalize semua ke 18 desimal sebelum dijumlah.
     *           Versi lama: totalPrincipal += shares (USDC 6dec + USDm 18dec)
     *           → penjumlahan tidak bermakna → potensi underflow → REVERT permanen.
     *           Fix: _normalizeTo18(asset, shares) sebelum akumulasi.
     *
     * FIX #15 — parkedFunds cleanup sebelum delete positions.
     *           Versi lama: jika agent withdraw dari Aave (parkedFunds terisi)
     *           lalu user panggil withdraw() sebelum forwardToUser() → parkedFunds
     *           tidak di-drain → delete positions[] → dana terkunci selamanya.
     *           Fix: drain parkedFunds ke userWallet sebelum delete.
     */
    function withdraw(address[] calldata aaveAssets) external nonReentrant {
        address userWallet = msg.sender;

        Position storage pos = positions[userWallet];
        if (pos.principalDeposited == 0) revert NoPosition();

        uint256 totalWithdrawn = 0;
        uint256 totalPrincipal = 0;

        // ── BUG #2 FIX: track per-user withdrawn amounts ─────────────────────
        // Bug lama: forward loop pakai balanceOf(address(this)) = SEMUA token di
        // contract, bukan hanya milik user ini.
        // Skenario: agent sudah executeAaveWithdraw untuk user B (parkedFunds terisi),
        // user A panggil withdraw() → forward loop drain token milik B juga.
        // Fix: simpan berapa token yang di-withdraw untuk user ini saja,
        // forward hanya angka itu — bukan seluruh contract balance.
        mapping(address => uint256) storage userWithdrawn = parkedFunds[userWallet];

        // ── Aave: tarik proporsi live per asset ──────────────────────────────
        for (uint256 i = 0; i < aaveAssets.length; i++) {
            address asset  = aaveAssets[i];
            uint256 shares = userATokenShares[userWallet][asset];
            if (shares == 0) continue;

            address aToken    = aaveAdapter.pool().getReserveData(asset).aTokenAddress;
            uint256 poolTotal = totalATokenShares[asset];
            uint256 livePool  = IERC20(aToken).balanceOf(address(this));

            uint256 liveUserAmount = (poolTotal > 0)
                ? (livePool * shares) / poolTotal
                : shares;

            totalPrincipal += _normalizeTo18(asset, shares);
            totalWithdrawn += _normalizeTo18(asset, liveUserAmount);

            // CEI: kurangi shares sebelum external call
            _subATokenShares(userWallet, asset, shares);

            IERC20(aToken).approve(address(aaveAdapter), 0);
            IERC20(aToken).approve(address(aaveAdapter), liveUserAmount);

            uint256 w = aaveAdapter.withdraw(userWallet, asset, liveUserAmount, address(this));
            // BUG #2 FIX: akumulasi per-user, bukan seluruh contract balance
            userWithdrawn[asset] += w;
            emit Withdraw(userWallet, asset, w);
        }

        // ── LP: keluar semua ──────────────────────────────────────────────────
        LPPosition[] storage lps = lpPositions[userWallet];
        uint256 lpIdx = 0;
        while (lpIdx < lps.length) {
            uint256 tokenId = lps[lpIdx].tokenId;
            try uniswapAdapter.exitPosition(userWallet, tokenId) {
                emit LPExited(userWallet, tokenId, "WITHDRAW");
                lps[lpIdx] = lps[lps.length - 1];
                lps.pop();
            } catch {
                emit GuardrailTripped(userWallet, "LP_EXIT_FAILED_ON_WITHDRAW");
                lpIdx++;
            }
        }

        // ── Performance fee ───────────────────────────────────────────────────
        // BUG #1 FIX: fee dihitung dalam 18-dec, tapi token balance dalam native dec
        // (USDC=6dec, USDT=6dec). Bug lama membandingkan 6-dec balance vs 18-dec fee
        // → chunk selalu = seluruh balance → semua USDC/USDT di-drain ke treasury.
        //
        // Fix: konversi feeRemaining ke native decimals token sebelum membandingkan
        // dan mentransfer. Track feeRemaining tetap dalam 18-dec agar cross-asset
        // akumulasi tetap presisi.
        uint256 feeTaken = 0;
        if (totalWithdrawn > totalPrincipal && aaveAssets.length > 0 && treasury != address(0)) {
            uint256 yieldAmount  = totalWithdrawn - totalPrincipal;
            uint256 totalFee18   = (yieldAmount * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
            uint256 feeRemaining18 = totalFee18;

            for (uint256 j = 0; j < aaveAssets.length && feeRemaining18 > 0; j++) {
                address asset = aaveAssets[j];
                // BUG #2 FIX: gunakan userWithdrawn, bukan balanceOf(this)
                uint256 bal = userWithdrawn[asset];
                if (bal == 0) continue;

                // BUG #1 FIX: konversi fee ke native decimals token untuk transfer
                uint256 feeNative = _denormalizeTo(asset, feeRemaining18);
                uint256 chunk     = bal >= feeNative ? feeNative : bal;

                userWithdrawn[asset] -= chunk;
                IERC20(asset).safeTransfer(treasury, chunk);
                // Kurangi feeRemaining18 proporsional dengan apa yang sudah di-transfer
                feeRemaining18 -= _normalizeTo18(asset, chunk);
            }
            feeTaken = totalFee18 - feeRemaining18;
        }

        // ── Forward sisa ke user ──────────────────────────────────────────────
        // BUG #2 FIX: forward hanya userWithdrawn[asset], bukan balanceOf(this).
        // Ini memastikan parkedFunds user lain tidak ikut ter-drain.
        for (uint256 j = 0; j < aaveAssets.length; j++) {
            address asset = aaveAssets[j];
            uint256 bal   = userWithdrawn[asset];
            if (bal == 0) continue;

            // Reset slot sebelum transfer (CEI)
            userWithdrawn[asset] = 0;

            if (asset == usdm || usdm == address(0)) {
                IERC20(asset).safeTransfer(userWallet, bal);
            } else {
                uint256 minOut = bal - (bal / 200);
                IERC20(asset).approve(address(mentoAdapter), 0);
                IERC20(asset).approve(address(mentoAdapter), bal);
                try mentoAdapter.swap(userWallet, asset, usdm, bal, minOut) {
                    // amountOut langsung ke userWallet
                } catch {
                    IERC20(asset).approve(address(mentoAdapter), 0);
                    IERC20(asset).safeTransfer(userWallet, bal);
                    emit WithdrawFallback(userWallet, asset, bal, "mento_swap_failed");
                }
            }
        }

        // ── Full cleanup ──────────────────────────────────────────────────────
        // Note: parkedFunds[userWallet] sudah di-drain di atas melalui userWithdrawn
        // (yang adalah alias ke parkedFunds[userWallet]), jadi tidak perlu loop terpisah.
        delete positions[userWallet];
        delete allocations[userWallet];
        delete allowanceExpiry[userWallet];

        emit GoalCompleted(userWallet, totalWithdrawn - feeTaken, feeTaken);
    }

    // ─────────────────────────────────────────────
    // Agent: Emergency Withdraw (only when paused)
    // ─────────────────────────────────────────────

    /**
     * FIX #10 — emit actual totalAmount, bukan hardcoded 0.
     * FIX #15 — drain parkedFunds sebelum delete positions (sama seperti withdraw()).
     */
    function emergencyWithdraw(
        address userWallet,
        address[] calldata aaveAssets
    ) external nonReentrant onlyAgent {
        if (!paused) revert NotPaused();

        Position storage pos = positions[userWallet];
        if (pos.principalDeposited == 0) revert NoPosition();

        uint256 totalEmergencyWithdrawn = 0;

        for (uint256 i = 0; i < aaveAssets.length; i++) {
            address asset  = aaveAssets[i];
            uint256 shares = userATokenShares[userWallet][asset];
            if (shares == 0) continue;

            address aToken    = aaveAdapter.pool().getReserveData(asset).aTokenAddress;
            uint256 poolTotal = totalATokenShares[asset];
            uint256 livePool  = IERC20(aToken).balanceOf(address(this));

            uint256 liveUserAmount = (poolTotal > 0)
                ? (livePool * shares) / poolTotal
                : shares;

            _subATokenShares(userWallet, asset, shares);

            IERC20(aToken).approve(address(aaveAdapter), 0);
            IERC20(aToken).approve(address(aaveAdapter), liveUserAmount);

            uint256 w = aaveAdapter.withdraw(userWallet, asset, liveUserAmount, userWallet);
            // FIX: normalize to 18-dec before accumulating across mixed-decimal assets
            totalEmergencyWithdrawn += _normalizeTo18(asset, w);
            emit Withdraw(userWallet, asset, w);
        }

        LPPosition[] storage lps = lpPositions[userWallet];
        uint256 j = 0;
        while (j < lps.length) {
            uint256 tokenId = lps[j].tokenId;
            try uniswapAdapter.exitPosition(userWallet, tokenId) {
                emit LPExited(userWallet, tokenId, "EMERGENCY_WITHDRAW");
                lps[j] = lps[lps.length - 1];
                lps.pop();
            } catch {
                emit GuardrailTripped(userWallet, "LP_EXIT_FAILED_ON_EMERGENCY");
                j++;
            }
        }

        // FIX #15: drain parkedFunds sebelum delete positions
        for (uint256 k = 0; k < aaveAssets.length; k++) {
            address asset  = aaveAssets[k];
            uint256 parked = parkedFunds[userWallet][asset];
            if (parked == 0) continue;
            parkedFunds[userWallet][asset] = 0;
            IERC20(asset).safeTransfer(userWallet, parked);
            // Normalize to 18-dec sebelum akumulasi (konsisten dengan Aave portion di atas)
            totalEmergencyWithdrawn += _normalizeTo18(asset, parked);
            emit FundsForwarded(userWallet, asset, parked);
        }

        delete positions[userWallet];
        delete allocations[userWallet];
        delete allowanceExpiry[userWallet];

        // FIX #10: emit actual amount, bukan hardcoded 0
        emit EmergencyWithdraw(
            userWallet,
            aaveAssets.length > 0 ? aaveAssets[0] : address(0),
            totalEmergencyWithdrawn
        );
    }

    // ─────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────

    function _checkAndUpdateSpend(address user, uint256 amount) internal {
        if (!isAllowanceValid(user)) revert AllowanceExpired();
        Position storage pos = positions[user];
        uint256 spent     = pos.cumulativeSpent;
        uint256 limit     = pos.spendLimit;
        uint256 remaining = spent >= limit ? 0 : limit - spent;
        if (amount > remaining) revert SpendLimitExceeded(amount, remaining);
        pos.cumulativeSpent += amount;
    }

    function _totalLPValue(address user) internal view returns (uint256 total) {
        LPPosition[] storage lps = lpPositions[user];
        for (uint256 i = 0; i < lps.length; i++) {
            total += lps[i].entryValueUSD;
        }
    }

    function _addATokenShares(address user, address asset, uint256 amount) internal {
        userATokenShares[user][asset] += amount;
        totalATokenShares[asset]      += amount;
    }

    function _subATokenShares(address user, address asset, uint256 amount) internal {
        require(userATokenShares[user][asset] >= amount, "SentinelExecutor: insufficient aToken balance");
        userATokenShares[user][asset] -= amount;
        totalATokenShares[asset]      -= amount;
    }

    function _isVolatile(address asset) internal view returns (bool) {
        return asset == wETH;
    }

    function _normalizeTo18(address asset, uint256 amount) internal view returns (uint256) {
        uint8 dec = assetDecimals[asset];
        if (dec == 0 || dec == 18) return amount;
        if (dec < 18) return amount * (10 ** uint256(18 - dec));
        return amount / (10 ** uint256(dec - 18));
    }

    /// @dev BUG #1 FIX: kebalikan _normalizeTo18.
    ///      Konversi angka 18-dec kembali ke native decimals token.
    ///      Digunakan saat menghitung fee yang akan di-transfer (dalam native dec).
    function _denormalizeTo(address asset, uint256 amount18) internal view returns (uint256) {
        uint8 dec = assetDecimals[asset];
        if (dec == 0 || dec == 18) return amount18;
        if (dec < 18) return amount18 / (10 ** uint256(18 - dec));
        return amount18 * (10 ** uint256(dec - 18));
    }

    function _toUSD(address asset, uint256 amount) internal view returns (uint256) {
        if (priceOracle == address(0)) return amount;
        try IPriceOracle(priceOracle).getPrice(asset) returns (uint256 price) {
            if (price > 0) {
                // FIX #3 — Divisor seragam 1e8 untuk semua asset.
                // Bug lama: WETH pakai 1e20, hasilnya ~6-dec bukan 18-dec.
                // Contoh: 1 WETH (1e18) × $2000 (2e8) / 1e20 = 2_000_000
                // → maxVolatile check: 2_000_000 > 40e18? → FALSE → guardrail tidak pernah trip.
                // Fix: 1 WETH (1e18) × $2000 (2e8) / 1e8 = 2_000e18 → konsisten 18-dec.
                return (amount * price) / 1e8;
            }
        } catch {}
        return amount;
    }
}
