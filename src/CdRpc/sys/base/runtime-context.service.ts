// // runtime-context.service.ts

// import { AsyncLocalStorage } from "node:async_hooks";
// import { randomUUID } from "node:crypto";
// import { ICdExecutionContext } from "../dev-descriptor/models/runtime-descriptor.model";

// // import { ICdExecutionContext } from "../models/runtime-descriptor.model";

// export class RuntimeContextService {
//   private static als = new AsyncLocalStorage<ICdExecutionContext>();

//   static run<T>(
//     context: ICdExecutionContext,
//     callback: () => Promise<T>,
//   ): Promise<T> {
//     return this.als.run(context, callback);
//   }

//   static get(): ICdExecutionContext {
//     const ctx = this.als.getStore();

//     if (!ctx) {
//       throw new Error(
//         "RuntimeContextService.get(): No active execution context",
//       );
//     }

//     return ctx;
//   }

//   static tryGet(): ICdExecutionContext | undefined {
//     return this.als.getStore();
//   }

//   static update(
//     partial: Partial<ICdExecutionContext>,
//   ): ICdExecutionContext {
//     const ctx = this.get();

//     Object.assign(ctx, partial);

//     return ctx;
//   }

//   static createBaseContext(
//     transport: ICdExecutionContext["transport"],
//     request: any,
//   ): ICdExecutionContext {
//     return {
//       requestId: randomUUID(),
//       transport,
//       request,
//       response: undefined as ICdExecutionContext["response"],
//       runtime: {
//         cache: new Map(),
//         startedAt: Date.now(),
//       },
//     };
//   }
// }

// src/CdRpc/sys/base/runtime-context.service.ts

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import { Request, Response } from "express";

import { ICdExecutionContext } from "../dev-descriptor/models/runtime-descriptor.model";

import { ICdRequest, ICdResponse } from "../base/i-base";

export class RuntimeContextService {
  /**
   * Async execution storage.
   *
   * This allows:
   * - nested async methods
   * - services
   * - workflows
   * - runners
   * - queued executions
   *
   * to access the SAME execution context
   * without manually passing req/res everywhere.
   */
  private static als = new AsyncLocalStorage<ICdExecutionContext>();

  /**
   * Create base runtime context
   */
  static create(
    request: ICdRequest,
    options?: {
      transport?: ICdExecutionContext["transport"];
      req?: Request;
      res?: Response;
    },
  ): ICdExecutionContext {
    const ctx: ICdExecutionContext = {
      requestId: randomUUID(),

      transport: options?.transport || "http",

      request,

      response: undefined,

      runtime: {
        cache: new Map<string, any>(),
        startedAt: Date.now(),
      },

      meta: {
        controller: request.c,
        action: request.a,
        module: request.m,
      },
    };

    return ctx;
  }

  /**
   * Run execution scope
   */
  static run<T>(
    ctx: ICdExecutionContext,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.als.run(ctx, callback);
  }

  /**
   * Get active context
   *
   * Throws if unavailable.
   */
  static get(): ICdExecutionContext {
    const ctx = this.als.getStore();

    if (!ctx) {
      throw new Error(
        "RuntimeContextService.get(): No active execution context",
      );
    }

    return ctx;
  }

  /**
   * Safe getter
   */
  static tryGet(): ICdExecutionContext | undefined {
    return this.als.getStore();
  }

  /**
   * Update context partially
   */
  static update(partial: Partial<ICdExecutionContext>): ICdExecutionContext {
    const ctx = this.get();

    Object.assign(ctx, partial);

    return ctx;
  }

  /**
   * Update response
   */
  static setResponse(response: ICdResponse): void {
    const ctx = this.get();

    ctx.response = response;
  }

  /**
   * Runtime cache setter
   */
  static setCache(key: string, value: any): void {
    const ctx = this.get();

    if (!ctx.runtime) {
      ctx.runtime = {};
    }

    if (!ctx.runtime.cache) {
      ctx.runtime.cache = new Map<string, any>();
    }

    ctx.runtime.cache.set(key, value);
  }

  /**
   * Runtime cache getter
   */
  static getCache<T = any>(key: string): T | undefined {
    const ctx = this.get();

    return ctx.runtime?.cache?.get(key);
  }

  // /**
  //  * Bind express req/res
  //  *
  //  * Maintains backward compatibility.
  //  */
  // static bindExpress(req: Request, res: Response): void {
  //   const ctx = this.get();

  //   ctx.req = req;
  //   ctx.res = res;

  //   /**
  //    * Legacy compatibility
  //    */
  //   (req as any).cdCtx = ctx;
  // }

  /**
   * Legacy compatibility helper
   */
  static fromRequest(req: Request): ICdExecutionContext | undefined {
    return (req as any).cdCtx;
  }

  /**
   * Cleanup metadata
   */
  static complete(): void {
    const ctx = this.tryGet();

    if (!ctx) {
      return;
    }

    if (!ctx.runtime) {
      ctx.runtime = {};
    }

    ctx.runtime.completedAt = Date.now();

    ctx.runtime.duration =
      ctx.runtime.completedAt -
      (ctx.runtime.startedAt || ctx.runtime.completedAt);
  }

  static destroy(): void {
    const ctx = this.tryGet();

    if (!ctx) {
      return;
    }

    /**
     * Finalize runtime metadata
     */
    if (!ctx.runtime) {
      ctx.runtime = {};
    }

    ctx.runtime.completedAt = Date.now();

    ctx.runtime.duration =
      ctx.runtime.completedAt -
      (ctx.runtime.startedAt || ctx.runtime.completedAt);

    /**
     * Clear runtime cache
     */
    ctx.runtime.cache?.clear();

    ctx.runtime.workflow = undefined;
    ctx.runtime.descriptor = undefined;

    /**
     * Optional:
     * clear response if response already flushed
     */
    // ctx.response = undefined;
  }
}
