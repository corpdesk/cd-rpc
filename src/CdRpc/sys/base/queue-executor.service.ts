import CdLog from '../comm/controllers/cd-logger.controller';
import { CdFxReturn, ICdRequest, ICdWireExecutor, ICdWireOptions } from './i-base';

export class QueueExecutor implements ICdWireExecutor {

  readonly name = 'QueueExecutor';

  readonly mode = 'queue';

  async execute<T = any>(
    request: ICdRequest,
    options?: ICdWireOptions
  ): Promise<CdFxReturn<T>> {

    CdLog.debug(
      `[QueueExecutor] queueing request`
    );

    /**
     * future:
     *  - redis queue
     *  - rabbitmq
     *  - kafka
     *  - workflow orchestration
     */

    return {
      state: true,
      message: 'Queue execution simulated.',
      data: null as T,
    };
  }
}