import { CdFxReturn } from '../../base/i-base.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { FailureAlertResult } from '../models/cicd-descriptor.model.js';
import { CiCdRunnerService } from '../services/cd-ci-runner.service.js';

export class CiCdRunnerController {
  // This controller is responsible for handling CI/CD runner operations
  // It will include methods to manage the lifecycle of CI/CD runners

  svCiCdRunner = new CiCdRunnerService();

  // Example method to start a CI/CD runner
  async startRunner(runnerId: string): Promise<void> {
    // Logic to start the CI/CD runner
    CdLog.debug(`Starting CI/CD runner with ID: ${runnerId}`);
    // Implementation goes here...
  }

  // Example method to stop a CI/CD runner
  async stopRunner(runnerId: string): Promise<void> {
    // Logic to stop the CI/CD runner
    CdLog.debug(`Stopping CI/CD runner with ID: ${runnerId}`);
    // Implementation goes here...
  }

  // async SendFailureAlert(
  //   message: string,
  // ): Promise<void>  {
  //   CdLog.debug(`Sending failure alert: ${message}`);
  //   // return this.svCiCdRunner.sendFailureAlert(message);
  // }
  async SendFailureAlert(
    message: string,
    failedTask?: any,
  ): Promise<CdFxReturn<FailureAlertResult>> {
    return this.svCiCdRunner.sendFailureAlert(message, {
      contextDump: failedTask,
    });
  }
}
