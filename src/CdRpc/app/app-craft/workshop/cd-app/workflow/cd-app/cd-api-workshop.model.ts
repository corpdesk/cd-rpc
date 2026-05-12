import { DevModeAction, getCreateRegistry, getRegistry, IDevModeInstructionDescriptor } from "../../../../../../sys/dev-mode/index.js";
import { AppType, envCdApi, envCdApiApp, envCdApiSys, envTestBed, envWorkshop, VersionControlDescriptor } from "../../../../../../sys/dev-descriptor/index.js";
import { CdFxReturn } from "../../../../../../sys/base/i-base.js";

export const cdApiVersionControl: VersionControlDescriptor = {
  name: 'CdApi',
  repository: {
    name: 'cd-api',
    url: 'https://github.com/corpdesk/cd-api.git',
    type: 'git',
    enabled: true,
    isPrivate: false,
    credentials: {
      repoHost: 'corpdesk', // Organization or user hosting the repository
    },
    directories: [
      {
        environment: envWorkshop,
        path: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-api/output/cd-api',
        purpose: 'Auto-generated source files',
        isDefault: true,
      },
      {
        environment: envTestBed,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app/cd-api',
        purpose: 'Integration and live testing',
      },
      {
        environment: envCdApiApp,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app',
        purpose: 'cd-api apps directory',
      },
      {
        environment: envCdApiSys,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/sys',
        purpose: 'cd-api system directory',
      },
      {
        environment: envCdApi,
        path: '/home/emp-12/cd-projects/cd-api',
        purpose: 'cd-api root directory',
      },
    ],
  },
};

// export function getItemRegistry(action:DevModeAction, moduleName:string): IDevModeInstructionDescriptor[] {
//   return getRegistry(action,moduleName,AppType.CdApi)
// }

// export function getItemRegistry(
//   action: DevModeAction,
//   moduleName: string,
//   appType: AppType,
//   actionTargetName: string,
// ): CdFxReturn<IDevModeInstructionDescriptor[]> {
//   return getRegistry(action, moduleName, appType);
// }

export function getItemRegistry(
  action: DevModeAction,
  moduleName: string,
  appType: AppType,
  actionTargetName: string,
): CdFxReturn<IDevModeInstructionDescriptor[]> {
  return getRegistry(action, moduleName, appType, actionTargetName);
}