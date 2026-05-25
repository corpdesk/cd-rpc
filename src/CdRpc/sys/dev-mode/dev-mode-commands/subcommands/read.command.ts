import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model';
import { DevModeService } from '../../services/dev-mode.service';
import { handleCommandResponse } from '../utils/post-execution.utils';

export const readCommand = {
  name: 'read',
  description: 'Read environments, modules, controllers, or models.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.READ, options);
      handleCommandResponse(result);
    },
  },
};
