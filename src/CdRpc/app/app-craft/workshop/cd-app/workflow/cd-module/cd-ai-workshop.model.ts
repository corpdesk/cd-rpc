import { DevModeAction, getCreateRegistry, getRegistry, IDevModeInstructionDescriptor } from "../../../../../../sys/dev-mode/index.js";
import { AppType, envCdApi, envCdApiApp, envCdApiSys, envTestBed, envWorkshop, VersionControlDescriptor } from "../../../../../../sys/dev-descriptor/index.js";
import { CdFxReturn } from "../../../../../../sys/base/i-base";

export const cdAiVersionControl: VersionControlDescriptor = {
  name: 'CdAi',
  repository: {
    name: 'cd-ai',
    url: 'https://github.com/corpdesk/cd-ai.git',
    type: 'git',
    enabled: true,
    isPrivate: false,
    credentials: {
      repoHost: 'corpdesk', // Organization or user hosting the repository
      // password: "your-password", // Uncomment if needed
      // accessToken: "your-access-token", // Uncomment if needed
    },
    directories: [
      /**
       * This is the workshop output directory associated with this particular version controller descriptor.
       * It is used to scafold the module for the cd-ai.
       */
      {
        name: 'workshopModuleOutput',
        environment: envWorkshop,
        path: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai',
        purpose: 'Auto-generated source files',
        isDefault: true,
      },
      /**
       * This is the test-bed for this scafold module.
       * The module is first generated in the workshop output directory,
       * then synced with the git repository.
       * It is then used for integration and live testing.
       * The test-bed is used to test the module in a live environment.
       */
      {
        name: 'moduleTestBed',
        environment: envTestBed,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app/cd-ai',
        purpose: 'Integration and live testing',
      },
      /**
       * This is the app directory for the test-bed, cd-api.
       */
      {
        name: 'testBedApiApp',
        environment: envCdApiApp,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app',
        purpose: 'cd-api apps directory',
      },
      /**
       * This is the sys directory for the test-bed, cd-api.
       */
      {
        name: 'testBedApiSys',
        environment: envCdApiSys,
        path: '/home/emp-12/cd-projects/cd-api/src/CdApi/sys',
        purpose: 'cd-api system directory',
      },
      /**
       * This is the root directory for the test-bed, cd-api.
       * It is used to derive the app descriptor path for the cd-api.
       */
      {
        name: 'testBedApiRoot',
        environment: envCdApi,
        path: '/home/emp-12/cd-projects/cd-api',
        purpose: 'cd-api root directory',
      },
      /**
       * This is the app descriptor for this particular version controller descriptor.
       * In this case it is the cd-api root directory.
       * It is used to derive the app descriptor path for the cd-api.
       */
      {
        name: 'CdAppDescriptor',
        environment: envCdApi,
        path: '/home/emp-12/cd-projects/cd-api/.cd/cd-app.descriptor.json',
        purpose: 'cd-api root directory',
      },
    ],
  },
};

// export function getItemRegistry(action:DevModeAction, moduleName:string): IDevModeInstructionDescriptor[] {
//   return getRegistry(action,moduleName,AppType.CdApi)
// }

export function getItemRegistry(
  action: DevModeAction,
  moduleName: string,
  appType: AppType,
  actionTargetName: string,
): CdFxReturn<IDevModeInstructionDescriptor[]> {
  return getRegistry(action, moduleName, appType, actionTargetName);
}