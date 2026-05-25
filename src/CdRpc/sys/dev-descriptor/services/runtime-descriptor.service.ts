// import { AsyncLocalStorage } from "node:async_hooks";
// import { CdModuleDescriptor } from "../models/cd-module-descriptor.model";
// import {
//   ICdExecutionContext,
//   RuntimeDescriptor,
// } from "../models/runtime-descriptor.model";
// import { ICdRequest, ICdResponse } from "../../base/i-base";

// export class RuntimeDescriptorService {
//   private static storage = new AsyncLocalStorage<ICdExecutionContext>();

//   static run<T>(ctx: ICdExecutionContext, callback: () => T): T {
//     return this.storage.run(ctx, callback);
//   }

//   static getContext(): ICdExecutionContext {
//     const ctx = this.storage.getStore();

//     if (!ctx) {
//       throw new Error("No active ICdExecutionContext found");
//     }

//     return ctx;
//   }

//   static tryGetContext(): ICdExecutionContext | undefined {
//     return this.storage.getStore();
//   }

//   static getRequest(): ICdRequest | undefined {
//     return this.storage.getStore()?.request;
//   }

//   static getResponse(): ICdResponse | undefined {
//     return this.storage.getStore()?.response;
//   }

//   static updateResponse(updater: (resp: ICdResponse) => void): void {
//     const ctx = this.getContext();

//     updater(ctx.response);
//   }

//   resolveRuntime(
//     module: CdModuleDescriptor,
//     context: ICdExecutionContext,
//   ): RuntimeDescriptor {
//     return {
//       mode: this.inferMode(context),
//       concurrency: this.resolveConcurrency(module),
//       isolation: this.resolveIsolation(module),
//       priority: this.resolvePriority(module),
//       lifecycle: this.resolveLifecycle(module),
//     };
//   }
//   resolveLifecycle(
//     module: CdModuleDescriptor,
//   ):
//     | { ephemeral?: boolean; persistent?: boolean; reusable?: boolean }
//     | undefined {
//     throw new Error("Method not implemented.");
//   }
//   resolvePriority(
//     module: CdModuleDescriptor,
//   ): "low" | "normal" | "high" | "critical" | undefined {
//     throw new Error("Method not implemented.");
//   }
//   resolveIsolation(
//     module: CdModuleDescriptor,
//   ):
//     | { level: "none" | "process" | "thread" | "container" | "vm" | "sandbox" }
//     | undefined {
//     throw new Error("Method not implemented.");
//   }
//   resolveConcurrency(module: CdModuleDescriptor):
//     | {
//         type: "single" | "multi" | "parallel" | "worker-pool" | "event-loop";
//         limit?: number;
//       }
//     | undefined {
//     throw new Error("Method not implemented.");
//   }

//   private inferMode(ctx: any): RuntimeDescriptor["mode"] {
//     if (ctx.stream) return "stream";
//     if (ctx.async) return "async";
//     return "sync";
//   }
// }
