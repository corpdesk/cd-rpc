import { inspect } from "util";
import config from "../../../config";
import CdLog from "../comm/controllers/cd-logger.controller";
import { HttpService } from "./http.service";
import {
  CdFxReturn,
  ICdRequest,
  ICdWireExecutor,
  ICdWireOptions,
} from "./i-base.js";

export class RpcExecutor implements ICdWireExecutor {
  readonly name = "RpcExecutor";
  readonly mode = "rpc";

  async execute<T = any>(
    cdRequest: ICdRequest,
    options?: ICdWireOptions,
  ): Promise<CdFxReturn<T>> {
    switch (options?.transport?.protocol) {
      case "grpc":
        return this.executeRpcGrpc(cdRequest);
      case "http":
        return this.executeRpcHttp(cdRequest);
      default:
        return this.executeRpcHttp(cdRequest);
    }
  }

  async executeRpcGrpc<T = any>(cdRequest: ICdRequest): Promise<CdFxReturn<T>> {
    // Implement gRPC client logic here
    // This is a placeholder and would require a gRPC client library and proto definitions
    throw new Error("gRPC execution not implemented yet");
  }

  async executeRpcHttp<T = any>(cdRequest: ICdRequest): Promise<CdFxReturn<T>> {
    CdLog.debug("[CdRpc][RpcExecutor][executeRpcHttp] 01");

    CdLog.debug(
      `[CdRpc][RpcExecutor][executeRpcHttp] Request:${JSON.stringify(cdRequest)}`,
    );

    CdLog.debug(
      `[CdRpc][RpcExecutor][executeRpcHttp] endpoint:${inspect(config.rpc.endpoint)}`,
    );

    /**
     * Centralized HTTP transport service.
     */
    const svServer = new HttpService(true);

    /**
     * Inject runtime endpoint.
     *
     * Executor becomes responsible for
     * operational transport routing.
     */
    svServer.setEndPoint(config.rpc.endpoint);

    console.log("remoteCdRequest()/cdRequest:", JSON.stringify(cdRequest));

    return svServer.proc(cdRequest) as Promise<CdFxReturn<T>>;
  }
}
