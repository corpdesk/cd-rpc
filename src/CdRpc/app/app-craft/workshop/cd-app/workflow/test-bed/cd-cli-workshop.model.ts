import { DevModeAction, getCreateRegistry, getRegistry, IDevModeInstructionDescriptor } from "../../../../../../sys/dev-mode/index.js";
import { AppType, envCdCli, envCdCliApp, envCdCliSys, envTestBed, envWorkshop, VersionControlDescriptor } from "../../../../../../sys/dev-descriptor/index.js";
import { CdFxReturn } from "../../../../../../sys/base/i-base";

export const cdApiVersionControl: VersionControlDescriptor = {
  name: 'CdCli',
  repository: {
    name: 'cd-cli',
    url: 'https://github.com/corpdesk/cd-cli.git',
    type: 'git',
    enabled: true,
    isPrivate: false,
    credentials: {
      repoHost: 'corpdesk', // Organization or user hosting the repository
    },
    directories: [
      {
        environment: envWorkshop,
        path: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-cli/output/cd-cli',
        purpose: 'Auto-generated source files',
        isDefault: true,
      },
      {
        environment: envTestBed,
        path: '/home/emp-12/cd-cli/src/CdCli/app/cd-cli',
        purpose: 'Integration and live testing',
      },
      {
        environment: envCdCliApp,
        path: '/home/emp-12/cd-cli/src/CdCli/app',
        purpose: 'cd-cli apps directory',
      },
      {
        environment: envCdCliSys,
        path: '/home/emp-12/cd-cli/src/CdCli/sys',
        purpose: 'cd-cli system directory',
      },
      {
        environment: envCdCli,
        path: '/home/emp-12/cd-cli',
        purpose: 'cd-cli root directory',
      },
    ],
  },
};

export function getItemRegistry(
  action: DevModeAction,
  moduleName: string,
  appType: AppType,
  actionTargetName: string,
): CdFxReturn<IDevModeInstructionDescriptor[]> {
  return getRegistry(action, moduleName, appType, actionTargetName);
}