import {
  TransportDescriptor,
  TransportExecutionMode,
} from '../dev-descriptor/models/network-descriptor.model';
import { BaseService } from './base.service';
import { HttpExecutor } from './http-executor.service';
import { CdFxReturn, ICdRequest, ICdWireOptions } from './i-base';
import { LocalExecutor } from './local-executor.service';
import { QueueExecutor } from './queue-executor.service';
import { RpcExecutor } from './rpc-executor.service';

export class CdWire {
  constructor(
    private baseService: BaseService<any>,
    private localExecutor: LocalExecutor,
    private rpcExecutor: RpcExecutor,
    private httpExecutor: HttpExecutor,
    private queueExecutor?: QueueExecutor,
  ) {}

  //   async execute<T = any>(
  //     request: ICdRequest,
  //     options?: ICdWireOptions
  //   ): Promise<CdFxReturn<T>> {
  //     return this.baseService.invokeCdRequest(request, options);
  //   }

  async execute<T>(request: ICdRequest, options?: ICdWireOptions): Promise<CdFxReturn<T>> {
    const transport = this.resolveTransport(options?.transport);

    switch (transport.mode) {
      case TransportExecutionMode.LOCAL:
        return this.localExecutor.execute(request, options);

      case TransportExecutionMode.RPC:
        return this.rpcExecutor.execute(request, options);

      case TransportExecutionMode.REMOTE:
        return this.httpExecutor.execute(request, options);

      case TransportExecutionMode.QUEUE:
        return this.queueExecutor!.execute(request, options);

      default:
        throw new Error(`Unsupported transport mode`);
    }
  }

  private resolveTransport(t?: TransportDescriptor) {
    if (!t) {
      return { mode: TransportExecutionMode.LOCAL };
    }
    return t;
  }
}
