

import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model';
import { DevModeService } from '../../services/dev-mode.service';
import { inspect } from 'util';
import { handleCommandResponse } from '../utils/post-execution.utils';



export const createCommand = {
  name: 'create',
  description: 'Setup environments, modules, controllers, or models dynamically.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      console.log(`create.command::execute()/starting`);
      const result = await svDevMode.executeCrudCommand(DevModeAction.CREATE, options);
      console.log(`create.command::execute()/ending`);
      console.log(`create.command::execute()/result:${inspect(result, { depth: 2 })}`);
      handleCommandResponse(result)
    },
  },
};
