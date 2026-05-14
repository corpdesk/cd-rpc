
// src/CdCli/sys/dev-mode/dev-mode-commands/subcommands/scan.command.ts

import { printTaskSummary } from '../../../../sys/utils/taks.utils.js';
import { CiCdService } from '../../../../sys/dev-descriptor/index.js';
import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { inspect } from 'util';
import { handleCommandResponse } from '../utils/post-execution.utils.js';



export const scanCommand = {
  name: 'scan',
  description: 'Scan and analyze existing structures.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      console.log(`scan.command::execute()/starting`);
      const result = await svDevMode.executeCrudCommand(DevModeAction.SCAN, options);
      console.log(`scan.command::execute()/ending`);
      console.log(`scan.command::execute()/result:${inspect(result, { depth: 4 })}`);
      handleCommandResponse(result)
    },
  },
};
