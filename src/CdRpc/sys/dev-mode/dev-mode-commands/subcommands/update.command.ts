import { DevModeAction, SHARED_OPTIONS, UPDATE_EXTRA_OPTIONS } from '../../models/dev-mode.model.js';
import { DevModeService } from '../../services/dev-mode.service.js';
import { handleCommandResponse } from '../utils/post-execution.utils.js';

const UPDATE_OPTIONS = [...SHARED_OPTIONS, ...UPDATE_EXTRA_OPTIONS];

export const updateCommand = {
  name: 'update',
  description: 'Update environments, modules, controllers, or models.',
  options: UPDATE_OPTIONS,
  action: {
    execute: async (options: any) => {
      console.log(`update.command::execute()/starting`);
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.UPDATE, options);
      handleCommandResponse(result);
    },
  },
};
