export declare const toWei: (n: string | number) => bigint;
export declare const fromWei: (n: bigint, dp?: number) => string;
export declare const calcApprovalAmount: (goal: bigint, bufferPct?: number) => bigint;
export declare const calcMinAmountOut: (expected: bigint, slippagePct?: number) => bigint;
export declare const sleep: (ms: number) => Promise<void>;
export declare const generateCode: (len?: number) => string;
export declare const logger: {
    info: (msg: string, meta?: unknown) => void;
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
    debug: (msg: string, meta?: unknown) => void;
};
//# sourceMappingURL=index.d.ts.map