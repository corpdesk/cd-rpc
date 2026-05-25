import { Request, Response } from 'express';
import { inspect } from 'util';
import { BaseService } from '../../base/base.service';
import { CdFxReturn, CdFxStateLevel, ICdRequest } from '../../base/i-base';
import CdLog from '../../comm/controllers/cd-logger.controller';
import { AppType, CdEnvName, repoRegistry } from '../../dev-descriptor/index';
// import { SessionService } from '../../user/index';
import {
  actionTargets,
  CdOutputEnvModel,
  DevModeAction,
  DevModeModel,
  getRegistry,
  IDevModeInstructionDescriptor,
} from '../models/dev-mode.model';
import { cdFx } from '../../base/cd-fx-return.util';
import { VersionService } from '../../dev-descriptor/services/version.service';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/models/app-craft.model';
import { join } from 'path';
// import { CdWire } from '../../base/cd-wire.service';
import { LocalExecutor } from '../../base/local-executor.service';
import { RpcExecutor } from '../../base/rpc-executor.service';
import { HttpExecutor } from '../../base/http-executor.service';
import { QueueExecutor } from '../../base/queue-executor.service';
import {
  TransportExecutionMode,
  TransportProtocol,
} from '../../dev-descriptor/models/network-descriptor.model';
import { SessionService } from '../../user/services/session.service';
import { CdWire } from '../../base/cd-wire.service';
import { ICdExecutionContext } from '../../dev-descriptor/models/runtime-descriptor.model';

export class DevModeService {
  private validEnvNames = Object.values(CdEnvName);

  validateOutputEnv(env: string): CdFxReturn<CdOutputEnvModel | null> {
    if (!env) {
      return cdFx(CdFxStateLevel.Error, 'Missing required --o-env argument', null);
    }

    if (!this.validEnvNames.includes(env as CdEnvName)) {
      return cdFx(
        CdFxStateLevel.NotFound,
        `Invalid output environment '${env}'. Expected one of: ${this.validEnvNames.join(', ')}`,
        null,
      );
    }

    const model: CdOutputEnvModel = {
      name: env as CdEnvName,
      label: this.labelize(env),
      context: this.resolveContext(env as CdEnvName),
    };

    return cdFx(
      CdFxStateLevel.Success,
      `Output environment '${env}' validated successfully.`,
      model,
    );
  }

  private labelize(env: string): string {
    return env
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }

  private resolveContext(env: CdEnvName): CdOutputEnvModel['context'] {
    if (env.startsWith('local')) return 'local';
    if (env === CdEnvName.PRODUCTION) return 'production';
    if (env === CdEnvName.TEST_BED || env === CdEnvName.SANDBOX) return 'testing';
    return 'custom';
  }

  validateProject(repo: string): CdFxReturn<string | null> {
    if (!repo) {
      return cdFx(CdFxStateLevel.Error, 'Missing required --repo argument', null);
    }

    // Add further validation logic here if needed (e.g. matching known repo)

    return cdFx(CdFxStateLevel.Success, `Project '${repo}' validated successfully.`, repo);
  }

  async executeCrudCommand(action: DevModeAction, options: any): Promise<CdFxReturn<null>> {
    const { name, ['o-env']: oEnv, repo } = options;

    CdLog.debug(
      `DevModeService::executeCrudCommand() action=${DevModeAction[action]}, name=${name}, o-env=${oEnv}, options=${inspect(options, { depth: 2 })}`,
    );

    // Validate repo
    const projResult = this.validateProject(repo);
    if (projResult.state !== CdFxStateLevel.Success) {
      console.error(`[repo Error] ${projResult.message}`);
      process.exit(1);
    }

    CdLog.debug(
      `DevModeService::executeCrudCommand()/projResult:${inspect(projResult, { depth: 2 })}`,
    );

    // Validate output environment
    const resultValidEnv = this.validateOutputEnv(oEnv);
    CdLog.debug(
      `DevModeService::executeCrudCommand()/resultValidEnv:${inspect(resultValidEnv, { depth: 2 })}`,
    );
    if (resultValidEnv.state !== CdFxStateLevel.Success) {
      console.error(`[o-env Error] ${resultValidEnv.message}`);
      process.exit(1);
    }

    ////////////////////////////////////////

    if (!name || !oEnv) {
      return {
        state: false,
        data: null,
        message: '❌ Missing --name or --o-env.',
      };
    }

    CdLog.debug(`DevModeService::executeCrudCommand()/name:${name}`);
    CdLog.debug(`DevModeService::executeCrudCommand()/oEnv:${oEnv}`);

    const selectedTarget = actionTargets.find((t) => options[t.cdObjTypeName]);
    if (!selectedTarget) {
      return {
        state: false,
        data: null,
        message: '❌ No valid object type (e.g., --cd-module, --model) specified.',
      };
    }

    CdLog.debug(
      `DevModeService::executeCrudCommand()/selectedTarget:${inspect(selectedTarget, { depth: 2 })})`,
    );

    const actionTargetName = selectedTarget.cdObjTypeName;
    CdLog.debug(`DevModeService::executeCrudCommand()/actionTargetName:${actionTargetName}`);

    let registryResult: CdFxReturn<IDevModeInstructionDescriptor[]>;
    try {
      registryResult = await this.getRegistryForCdObj(null, action, actionTargetName, oEnv, name, repo);
      // CdLog.debug(
      //   `DevModeService::executeCrudCommand()/registryResult:${inspect(registryResult, { depth: 2 })}`,
      // );
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ ${err.message}`,
      };
    }

    if (!registryResult.state || !registryResult.data) {
      return {
        state: false,
        data: null,
        message: registryResult.message || '❌ Invalid registry.',
      };
    }

    const registry = registryResult.data;
    CdLog.debug(`DevModeService::executeCrudCommand()/registryCount:${registry.length}`);
    const selectedItem = registry.find((item) => options[item.flag]);

    if (!selectedItem) {
      return {
        state: false,
        data: null,
        message: `❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`,
      };
    }

    const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
    if (missing.length > 0) {
      return {
        state: false,
        data: null,
        message: `❌ Missing required options: ${missing.join(', ')}`,
      };
    }

    try {
      const sessionService = new SessionService();
      const cdToken = await sessionService.sessData.cdToken;

      CdLog.debug(
        `DevModeService::executeCrudCommand()/{ actionTargetName, name, oEnv, repo },:${inspect({ actionTargetName, name, oEnv, repo }, { depth: 2 })}`,
      );
      CdLog.debug(`DevModeService::executeCrudCommand()/options:${inspect(options, { depth: 2 })}`);
      CdLog.debug(
        `DevModeService::executeCrudCommand()/selectedItem:${inspect(selectedItem, { depth: 2 })}`,
      );
      const args = this.buildCdRequestArgs(
        { actionTargetName, name, oEnv, repo },
        options,
        selectedItem,
      );
      CdLog.debug(`DevModeService::executeCrudCommand()/args:${inspect(args, { depth: 2 })}`);

      const request: ICdRequest = {
        ...selectedItem.cdRequest,
        dat: {
          ...selectedItem.cdRequest.dat,
          token: cdToken,
        },
        args,
      };

      CdLog.debug(`DevModeService::executeCrudCommand()/request:${inspect(request, { depth: 3 })}`);

      ///////////////////////////////////////////////
      /**
       * Using CdWire abstraction to execute the request allows for flexible transport options
       * (local, RPC, remote HTTP, queue) without changing the core logic here.
       * The actual execution will depend on the configuration of the selectedItem's
       * cdRequest and any overrides provided in the CLI options.
       */
      const b = new BaseService<any>();
      const cdWire = new CdWire(
        b,
        new LocalExecutor(b),
        new RpcExecutor(),
        new HttpExecutor(),
        new QueueExecutor(),
      );

      const responseCdRequest = await cdWire.execute<null>(request, {
        transport: {
          mode: TransportExecutionMode.LOCAL,
        },
      });

      // const responseCdRequest = await cdWire.execute<null>(request, {
      //   transport: {
      //     mode: TransportExecutionMode.RPC,
      //     protocol: TransportProtocol.HTTP,
      //     // endpoint: 'http://localhost:3000/rpc', // This could be made dynamic based on config or CLI options
      //   },
      // });

      //////////////////////////////////////////////

      // const b = new BaseService();
      // const responseCdRequest = await b.invokeCdRequest(request);
      return responseCdRequest;
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`,
      };
    }
  }

  buildCdRequestArgs(
    baseOptions: Record<string, any>,
    cliOptions: Record<string, any>,
    selectedItem: IDevModeInstructionDescriptor,
  ): Record<string, any> {
    const args: Record<string, any> = {
      actionTargetName: baseOptions.actionTargetName,
      name: baseOptions.name,
      oEnv: baseOptions.oEnv,
      ...(cliOptions.method && { method: cliOptions.method }),
    };

    const knownKeys = new Set<string>([
      'cdObjTypeName',
      'name',
      'o-env',
      'method',
      ...(selectedItem.requiredOptions ?? []),
      ...(selectedItem.optionalOptions ?? []),
    ]);

    for (const [key, value] of Object.entries(cliOptions)) {
      if (key === '_') continue;
      if (value === true && !knownKeys.has(key)) continue;

      // Convert known kebab-case keys to camelCase
      if (key === 'o-env') {
        args.oEnv ??= value; // Only assign if not already defined
        continue;
      }

      args[key] = value;
    }

    return args;
  }

  // getRegistryForCdObj(action, actionTargetName, oEnv, name, repo)
  async getRegistryForCdObj(
    cdCtx: ICdExecutionContext | null,
    action: DevModeAction,
    actionTargetName: string,
    oEnv: string, // replaced former cdObjType
    cdObjName: string,
    repoName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    CdLog.debug(`DevModeService::getRegistryForCdObj()/01`);
    CdLog.debug(`DevModeService::getRegistryForCdObj()/repoName:${repoName}`);
    /**
     * use repo name to get app type based on registered repos
     */
    const svVersion = new VersionService();

    const appType = svVersion.getAppTypeFromRepoName(cdCtx, repoName, repoRegistry);
    CdLog.debug(`DevModeService::getRegistryForCdObj()/appType: ${appType}`);
    let aType = '';
    if (actionTargetName === 'cd-app') {
      aType = 'cd-app';
    } else {
      aType = appType ?? '';
    }
    const filePath = join(
      MOD_CRAFT_WORKSHOP_DIR,
      aType,
      'workflow',
      oEnv,
      `${cdObjName}-workshop.model`,
    );

    CdLog.debug(`DevModeService::getRegistryForCdObj()/filePath: ${filePath}`);
    try {
      CdLog.debug(`DevModeService::getRegistryForCdObj()/02`);
      const module = await import(filePath);
      CdLog.debug(`DevModeService::getRegistryForCdObj()/03`);
      if (!module.getItemRegistry) {
        CdLog.debug(`DevModeService::getRegistryForCdObj()/04`);
        return {
          state: false,
          data: null,
          message: `❌ Missing getItemRegistry export in ${filePath}`,
        };
      }
      CdLog.debug(`DevModeService::getRegistryForCdObj()/05`);
      const resultItemRegistry: CdFxReturn<IDevModeInstructionDescriptor[]> =
        module.getItemRegistry(action, cdObjName, appType, actionTargetName);
      CdLog.debug(`DevModeService::getRegistryForCdObj()/06`);
      CdLog.debug(`DevModeService::getRegistryForCdObj()/resultItemRegistry:${resultItemRegistry}`);

      if (!resultItemRegistry?.state) {
        CdLog.debug(`DevModeService::getRegistryForCdObj()/07`);
        return {
          state: false,
          data: null,
          message: resultItemRegistry.message || '❌ Failed to generate registry instructions.',
        };
      }
      CdLog.debug(`DevModeService::getRegistryForCdObj()/07`);

      return resultItemRegistry;
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to load registry for module "${cdObjName}" of type "${appType}": ${err.message}`,
      };
    }
  }

  async getCreateRegistryForCdObj(
    cdCtx: ICdExecutionContext | null,
    actionTargetName: string,
    cdObjType: string,
    cdObjName: string,
    repoName: string,
  ) {
    return this.getRegistryForCdObj(
      cdCtx,
      DevModeAction.CREATE,
      actionTargetName,
      cdObjType,
      cdObjName,
      repoName,
    );
  }

  async getRegistryByAction(
    action: DevModeAction,
    cdObjType: AppType,
    cdObjName: string,
    actionTargetName: string,
  ) {
    return getRegistry(action, cdObjName, cdObjType, actionTargetName);
  }
}
