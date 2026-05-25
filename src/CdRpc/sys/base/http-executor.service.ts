import CdLog from '../comm/controllers/cd-logger.controller';
import { CdFxReturn, ICdRequest, ICdWireExecutor, ICdWireOptions } from './i-base.js';

export class HttpExecutor implements ICdWireExecutor {
  readonly name = 'HttpExecutor';

  readonly mode = 'remote';

  async execute<T = any>(request: ICdRequest, options?: ICdWireOptions): Promise<CdFxReturn<T>> {
    const endpoint = options?.transport?.endpoint;

    CdLog.debug(`[HttpExecutor] sending request to: ${endpoint}`);

    /**
     * future:
     *  - fetch()
     *  - auth headers
     *  - tracing propagation
     *  - retry middleware
     */

    return {
      state: true,
      message: 'HTTP execution simulated.',
      data: null as T,
    };
  }
}
