export declare const AGENT_WALLET_ABI: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_owner";
        readonly type: "address";
    }, {
        readonly name: "_executor";
        readonly type: "address";
    }, {
        readonly name: "_spendLimit";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "authorizedExecutor";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "spendLimit";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "cumulativeSpent";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "setAuthorizedExecutor";
    readonly inputs: readonly [{
        readonly name: "_executor";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setPaused";
    readonly inputs: readonly [{
        readonly name: "_paused";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setSpendLimit";
    readonly inputs: readonly [{
        readonly name: "_limit";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "resetEpoch";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "rescueTokens";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "PausedStateChanged";
    readonly inputs: readonly [{
        readonly name: "paused";
        readonly type: "bool";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "ExecutorUpdated";
    readonly inputs: readonly [{
        readonly name: "oldExecutor";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "newExecutor";
        readonly type: "address";
        readonly indexed: false;
    }];
}, {
    readonly type: "error";
    readonly name: "NotOwner";
}, {
    readonly type: "error";
    readonly name: "NotExecutor";
}, {
    readonly type: "error";
    readonly name: "AgentPaused";
}];
export declare const SENTINEL_EXECUTOR_ABI: readonly [{
    readonly type: "function";
    readonly name: "pause";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "unpause";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "resetSpendEpoch";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setAgentSigner";
    readonly inputs: readonly [{
        readonly name: "_agentSigner";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setTreasury";
    readonly inputs: readonly [{
        readonly name: "_treasury";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setPriceOracle";
    readonly inputs: readonly [{
        readonly name: "oracle";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setWhitelistedAsset";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "status";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setVolatileAssets";
    readonly inputs: readonly [{
        readonly name: "_wETH";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setDefaultAllocation";
    readonly inputs: readonly [{
        readonly name: "stableBps";
        readonly type: "uint256";
    }, {
        readonly name: "lpBps";
        readonly type: "uint256";
    }, {
        readonly name: "wethBps";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "agentSigner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "treasury";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "whitelistedAssets";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "lpPositions";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "index";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "pool";
        readonly type: "address";
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
    }, {
        readonly name: "entryValueUSD";
        readonly type: "uint256";
    }, {
        readonly name: "entryTimestamp";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "registerGoal";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "goalTarget";
        readonly type: "uint256";
    }, {
        readonly name: "goalDeadline";
        readonly type: "uint256";
    }, {
        readonly name: "spendLimit";
        readonly type: "uint256";
    }, {
        readonly name: "epochDuration";
        readonly type: "uint256";
    }, {
        readonly name: "stableBps";
        readonly type: "uint256";
    }, {
        readonly name: "lpBps";
        readonly type: "uint256";
    }, {
        readonly name: "wethBps";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setUserPaused";
    readonly inputs: readonly [{
        readonly name: "_paused";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "executeAaveWithdraw";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "withdrawn";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "executeAaveSupply";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "minOut";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "aTokensReceived";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "executeUniswapLP";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "token0";
        readonly type: "address";
    }, {
        readonly name: "token1";
        readonly type: "address";
    }, {
        readonly name: "amount0";
        readonly type: "uint256";
    }, {
        readonly name: "amount1";
        readonly type: "uint256";
    }, {
        readonly name: "amount0Min";
        readonly type: "uint256";
    }, {
        readonly name: "amount1Min";
        readonly type: "uint256";
    }, {
        readonly name: "totalValueUSD";
        readonly type: "uint256";
    }, {
        readonly name: "totalPortfolioUSD";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "executeUniswapSwap";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "fromAsset";
        readonly type: "address";
    }, {
        readonly name: "toAsset";
        readonly type: "address";
    }, {
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "minAmountOut";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "checkAndExitLPIfIL";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "currentValues";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "rebalance";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "executeMentoSwap";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "fromAsset";
        readonly type: "address";
    }, {
        readonly name: "toAsset";
        readonly type: "address";
    }, {
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "minAmountOut";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly inputs: readonly [{
        readonly name: "aaveAssets";
        readonly type: "address[]";
    }, {
        readonly name: "aaveAmounts";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "emergencyWithdraw";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "aaveAssets";
        readonly type: "address[]";
    }, {
        readonly name: "aaveAmounts";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "positions";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "principalDeposited";
        readonly type: "uint256";
    }, {
        readonly name: "lastRebalancedAt";
        readonly type: "uint256";
    }, {
        readonly name: "userPaused";
        readonly type: "bool";
    }, {
        readonly name: "goalTarget";
        readonly type: "uint256";
    }, {
        readonly name: "goalDeadline";
        readonly type: "uint256";
    }, {
        readonly name: "spendLimit";
        readonly type: "uint256";
    }, {
        readonly name: "cumulativeSpent";
        readonly type: "uint256";
    }, {
        readonly name: "epochStart";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "event";
    readonly name: "Paused";
    readonly inputs: readonly [{
        readonly name: "by";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "Unpaused";
    readonly inputs: readonly [{
        readonly name: "by";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "AgentSignerUpdated";
    readonly inputs: readonly [{
        readonly name: "oldSigner";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "newSigner";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "GoalRegistered";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "asset";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "Withdraw";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "asset";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "GoalCompleted";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalReturned";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "feeTaken";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "EmergencyWithdraw";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "asset";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "StrategyExecuted";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "asset";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "protocol";
        readonly type: "string";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "Rebalanced";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "LPEntered";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "valueUSD";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "LPExited";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "reason";
        readonly type: "string";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "AllocationSet";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "stableBps";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "lpBps";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "wethBps";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "AssetWhitelisted";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "status";
        readonly type: "bool";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "GuardrailTripped";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "reason";
        readonly type: "string";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "OracleUpdated";
    readonly inputs: readonly [{
        readonly name: "oracle";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "error";
    readonly name: "NotOwner";
}, {
    readonly type: "error";
    readonly name: "NotAgent";
}, {
    readonly type: "error";
    readonly name: "NotUser";
}, {
    readonly type: "error";
    readonly name: "ContractPaused";
}, {
    readonly type: "error";
    readonly name: "NotPaused";
}, {
    readonly type: "error";
    readonly name: "ZeroAmount";
}, {
    readonly type: "error";
    readonly name: "NoPosition";
}, {
    readonly type: "error";
    readonly name: "OracleNotSet";
}, {
    readonly type: "error";
    readonly name: "AssetNotWhitelisted";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "UserPositionPaused";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "RebalanceTooSoon";
    readonly inputs: readonly [{
        readonly name: "nextAllowed";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "LPAllocationExceeded";
    readonly inputs: readonly [{
        readonly name: "requested";
        readonly type: "uint256";
    }, {
        readonly name: "max";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "VolatileAllocationExceeded";
    readonly inputs: readonly [{
        readonly name: "requested";
        readonly type: "uint256";
    }, {
        readonly name: "max";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "AllocationSumInvalid";
    readonly inputs: readonly [{
        readonly name: "sum";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "SlippageExceeded";
    readonly inputs: readonly [{
        readonly name: "actual";
        readonly type: "uint256";
    }, {
        readonly name: "max";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "SpendLimitExceeded";
    readonly inputs: readonly [{
        readonly name: "requested";
        readonly type: "uint256";
    }, {
        readonly name: "remaining";
        readonly type: "uint256";
    }];
}];
export declare const ERC20_ABI: readonly [{
    readonly type: "function";
    readonly name: "approve";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "allowance";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "transfer";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "transferFrom";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}];
//# sourceMappingURL=index.d.ts.map