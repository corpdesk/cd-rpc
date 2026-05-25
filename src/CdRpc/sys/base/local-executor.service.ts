import { BaseService } from './base.service';
import { CdFxReturn, ICdRequest, ICdWireExecutor, ICdWireOptions } from './i-base';

export class LocalExecutor implements ICdWireExecutor {
  readonly name = 'LocalExecutor';

  readonly mode = 'local';

  constructor(protected baseService: BaseService<any>) {}

  async execute<T = any>(request: ICdRequest, options?: ICdWireOptions): Promise<CdFxReturn<T>> {
    return this.baseService.invokeCdRequest(request, options);
  }
}
