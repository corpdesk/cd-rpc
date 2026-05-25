import { DevModeAction, SHARED_OPTIONS } from '../../models/dev-mode.model';
import { DevModeService } from '../../services/dev-mode.service';
import { handleCommandResponse } from '../utils/post-execution.utils';

export const deriveCommand = {
  name: 'derive',
  description: 'Derive descriptors from existing environments, apps, modules, controllers, or models dynamically.',
  options: SHARED_OPTIONS,
  action: {
    execute: async (options: any) => {
      const svDevMode = new DevModeService();
      const result = await svDevMode.executeCrudCommand(DevModeAction.DERIVE, options);
      handleCommandResponse(result);
    },
  },
};
