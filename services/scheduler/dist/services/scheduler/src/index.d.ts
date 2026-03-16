/**
 * Piggy Sentinel — Scheduler
 *
 * One job per active goal, running every 6 hours.
 * Replaces the old separate fx-check + progress jobs with a unified cycle.
 */
import { Queue } from "bullmq";
export declare const agentQueue: Queue<any, any, string, any, any, string>;
//# sourceMappingURL=index.d.ts.map