// import { IAppState, ICdRequest, ISessResp } from "../../base";
// import { SessionModel } from "../../user";
import { Request, Response } from "express";

import {
  IAppState,
  ICdRequest,
  ICdResponse,
  ISessResp,
} from "../../base/i-base";

export interface RuntimeDescriptor {
  /**
   * Execution strategy inside the host system
   */
  mode: "sync" | "async" | "deferred" | "stream" | "unknown";

  /**
   * Concurrency model for execution
   */
  concurrency?: {
    type: "single" | "multi" | "parallel" | "worker-pool" | "event-loop";
    limit?: number;
  };

  /**
   * Isolation boundary
   * - useful for AI agents, sandboxed execution, plugins
   */
  isolation?: {
    level: "none" | "process" | "thread" | "container" | "vm" | "sandbox";
  };

  /**
   * Execution priority within runtime scheduler
   */
  priority?: "low" | "normal" | "high" | "critical";

  /**
   * Lifecycle behavior of execution
   */
  lifecycle?: {
    ephemeral?: boolean; // destroyed after execution
    persistent?: boolean; // long-running context
    reusable?: boolean; // cached execution context
  };
}

// export interface ICdExecutionContext {
//   requestId: string;

//   transport: 'cli' | 'rpc' | 'http';

//   payload: ICdRequest;

//   sess?: ISessResp;

//   appState?: IAppState;

//   runtime?: {
//     workflow?: any;
//     descriptor?: any;
//     cache?: Map<string, any>;
//   };
// }

// export interface ICdExecutionContext {
//   requestId: string;

//   /**
//    * Origin transport
//    */
//   transport: "cli" | "rpc" | "http" | "grpc";

//   /**
//    * Incoming request payload
//    */
//   request: ICdRequest;

//   /**
//    * Unified mutable response state
//    */
//   response: ICdResponse;

//   /**
//    * Runtime execution metadata
//    */
//   runtime: {
//     mode: RuntimeDescriptor["mode"];

//     workflow?: any;

//     descriptor?: any;

//     cache?: Map<string, any>;

//     startedAt?: number;

//     completedAt?: number;

//     durationMs?: number;
//   };

//   /**
//    * Execution diagnostics
//    */
//   diagnostics?: {
//     logs?: string[];
//     warnings?: string[];
//     errors?: string[];
//   };

//   /**
//    * Transport-native objects
//    */
//   native?: {
//     req?: any;
//     res?: any;
//     grpcCall?: any;
//     grpcCallback?: any;
//     cliArgs?: string[];
//   };
// }

// export interface ICdExecutionContext {
//   requestId: string;

//   transport: 'cli' | 'rpc' | 'http' | 'grpc';

//   request: ICdRequest;

//   response?: ICdResponse;

//   req?: Request;

//   res?: Response;

//   runtime?: {
//     workflow?: any;
//     descriptor?: any;
//     cache?: Map<string, any>;
//     startedAt?: number;
//   };

//   meta?: {
//     controller?: string;
//     action?: string;
//     module?: string;
//     userId?: number;
//   };
// }

export interface ICdExecutionContext {
  ///////////////////////////////////////////////////////////
  // Identity
  ///////////////////////////////////////////////////////////

  requestId: string;

  transport: "cli" | "rpc" | "http" | "grpc";

  ///////////////////////////////////////////////////////////
  // Canonical Corpdesk Request/Response
  ///////////////////////////////////////////////////////////

  request: ICdRequest;

  response?: ICdResponse;

  ///////////////////////////////////////////////////////////
  // Runtime state
  ///////////////////////////////////////////////////////////

  runtime?: {
    workflow?: any;
    descriptor?: any;
    cache?: Map<string, any>;
    startedAt?: number;
    completedAt?: number;
    duration?: number;
  };

  ///////////////////////////////////////////////////////////
  // Execution state
  ///////////////////////////////////////////////////////////

  state?: {
    status?: "created" | "running" | "completed" | "failed";

    errors?: string[];
  };

  ///////////////////////////////////////////////////////////
  // Metadata
  ///////////////////////////////////////////////////////////

  meta?: {
    controller?: string;

    action?: string;

    module?: string;

    userId?: number;

    traceId?: string;
  };
}
