export declare const SENTINEL_EXECUTOR_ABI: readonly [{
    readonly type: "function";
    readonly name: "executeAaveSupply";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "executeAaveWithdraw";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "executeMentoSwapAndSupply";
    readonly stateMutability: "nonpayable";
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
    }, {
        readonly name: "minATokens";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly name: "aTokensReceived";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "executeMentoSwap";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "executeUniswapSwap";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "executeUniswapLP";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "checkAndExitLPIfIL";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "currentValues";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "rebalance";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "aaveAssets";
        readonly type: "address[]";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "emergencyWithdraw";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "aaveAssets";
        readonly type: "address[]";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "forwardToUser";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }, {
        readonly name: "assets";
        readonly type: "address[]";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "resetSpendEpoch";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "userWallet";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "userATokenShares";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "positions";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
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
    }];
}, {
    readonly type: "function";
    readonly name: "lpPositions";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "index";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
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
    }];
}, {
    readonly type: "function";
    readonly name: "isAllowanceValid";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "registerGoal";
    readonly stateMutability: "nonpayable";
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
}, {
    readonly type: "function";
    readonly name: "setUserPaused";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "_paused";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setAllowanceExpiry";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "expiresAt";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
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
    readonly type: "error";
    readonly name: "NotOwner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotAgent";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotUser";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ContractPaused";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotPaused";
    readonly inputs: readonly [];
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
}, {
    readonly type: "error";
    readonly name: "ZeroAmount";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NoPosition";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OracleNotSet";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "AllowanceExpired";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "EpochResetTooSoon";
    readonly inputs: readonly [{
        readonly name: "nextAllowed";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "TimelockNotExpired";
    readonly inputs: readonly [{
        readonly name: "executeAt";
        readonly type: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "NoPendingSignerChange";
    readonly inputs: readonly [];
}];
//# sourceMappingURL=abi.d.ts.map