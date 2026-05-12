// src/CdCli/app/app-craft/workshop/cd-app/workflow/test-bed/cd-shell-workshop.model.ts
import { DevModeAction, getCreateRegistry, getRegistry, IDevModeInstructionDescriptor } from "../../../../../../sys/dev-mode/index.js";
import { AppType, envCdShell, envCdShellApp, envCdShellSys, envTestBed, envWorkshop, VersionControlDescriptor } from "../../../../../../sys/dev-descriptor/index.js";
import { CdFxReturn } from "../../../../../../sys/base/i-base.js";

export const cdApiVersionControl: VersionControlDescriptor = {
  name: 'CdShell',
  repository: {
    name: 'cd-shell',
    url: 'https://github.com/corpdesk/cd-shell.git',
    type: 'git',
    enabled: true,
    isPrivate: false,
    credentials: {
      repoHost: 'corpdesk', // Organization or user hosting the repository
    },
    directories: [
      {
        environment: envWorkshop,
        path: '/home/emp-12/cd-shell/dist/CdShell/app/app-craft/workshop/cd-shell/output/cd-shell',
        purpose: 'Auto-generated source files',
        isDefault: true,
      },
      {
        environment: envTestBed,
        path: '/home/emp-12/cd-shell/src/CdShell/app/cd-shell',
        purpose: 'Integration and live testing',
      },
      {
        environment: envCdShellApp,
        path: '/home/emp-12/cd-shell/src/CdShell/app',
        purpose: 'cd-shell apps directory',
      },
      {
        environment: envCdShellSys,
        path: '/home/emp-12/cd-shell/src/CdShell/sys',
        purpose: 'cd-shell system directory',
      },
      {
        environment: envCdShell,
        path: '/home/emp-12/cd-shell',
        purpose: 'cd-shell root directory',
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