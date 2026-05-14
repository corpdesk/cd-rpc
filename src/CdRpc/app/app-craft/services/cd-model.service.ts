/* eslint-disable style/brace-style */

// import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model.js';
import { CiCdRunnerService } from '../../../sys/dev-descriptor/services/cd-ci-runner.service';
import { CdObjModel, defaultCdObjEnv } from '../../../sys/moduleman/models/cd-obj.model.js';
import { GenericService } from '../../../sys/base/generic-service';
import { DevDescriptorService } from '../../../sys/dev-descriptor/services/dev-descriptor.service';
import {
  CD_FX_FAIL,
  CdAssertReturn,
  CdFxReturn,
  CdFxStateLevel,
  CdRequest,
  DEFAULT_ENVELOPE_CREATE,
  ICdRequest,
  ICdResponse,
  IQuery,
} from '../../../sys/base/i-base';
import { CdDescriptor } from '../../../sys/dev-descriptor/models/dev-descriptor.model.js';
import { AppType, CdModuleDescriptor } from '../../../sys/dev-descriptor/index.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { inferCdObjType } from '../../../sys/utils/cd-naming.util.js';
import { HttpService } from '../../../sys/base/http.service';
import { defaultCdRfcEnv } from '../models/cd-model.model.js';
// import { CdModuleDescriptor } from '../workshop/cd-api/workflow/default.model.js';

export class CdModelService {
  cdToken;
  private svCiCdRunner!: CiCdRunnerService;
  svDevDescriptors;
  postData: ICdRequest = DEFAULT_ENVELOPE_CREATE;

  constructor() {
    this.svDevDescriptors = new DevDescriptorService();
  }

  init(): this {
    this.svCiCdRunner = new CiCdRunnerService();
    return this;
  }

  /**
   * 
   * @param actionTargetName [2025-07-31 13:12:25] 🛠️ DevModeService::executeCrudCommand()/args:{
      actionTargetName: 'cd-module',
      name: 'cd-ai',
      oEnv: 'workshop',
      'o-env': 'workshop',
      repo: 'cd-ai'
    }
   * @param moduleName 
   * @param oEnv 
   * @param cdToken 
   * @returns 
   */
  async create(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModelService::create()');
    CdLog.debug(`CdModelService::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModelService::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModelService::create()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModelService::create()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModelDescriptorAndWorkflow(
      DevModeAction.CREATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
        oEnv: oEnv,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModelService::create()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  async createFromSql(moduleDescriptor: CdModuleDescriptor, pathToSql: string) {}

  async createFromDescriptor(moduleDescriptor: CdModuleDescriptor, pathToSql: string) {}

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    try {
      /**
       * The q is allowed to be null
       * If null it is substituted by { where: {} }
       * Which would then fetch all the data
       */
      const payload = this.svDevDescriptors.setEnvelope('Read', {
        query: q ?? { where: {} },
      });
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdModel type
  }

  async update(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    srcPath?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModelService::update()');
    CdLog.debug(`CdModelService::update()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModelService::update()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModelService::update()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModelService::update()/repoName: ${repoName}`);
    CdLog.debug(`CdModelService::update()/srcPath: ${srcPath}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModelDescriptorAndWorkflow(
      DevModeAction.UPDATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
        srcPath: srcPath,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModelService::update()/ No valid workflowModel`,
      };
    }
    this.init();
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  async delete(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModelService::delete()');
    CdLog.debug(`CdModelService::delete()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModelService::delete()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModelService::delete()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModelService::delete()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModelDescriptorAndWorkflow(
      DevModeAction.DELETE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModelService::update()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  /**
   * This method sets the entities in the database.
   * It processes the provided developer module data for creating database items.
   * @param developerData
   * @returns
   */
  async setEntities(developerData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      if (!developerData || developerData.models.length === 0) {
        return {
          data: null,
          state: false,
          message: 'No developer data provided.',
        };
      }

      // Process each model item
      for (const model of developerData.models) {
        // Here you would typically save the data to the database
        // For now, we just log it
        console.log('Setting entity:', model);
      }

      return {
        data: null,
        state: true,
        message: 'Entities set successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to set entities: ${(error as Error).message}`,
      };
    }
  }

  async updateRfcData(q: IQuery): Promise<CdFxReturn<ICdResponse | null>> {
    CdLog.debug('Starting CdModelService::updateRfcData()');
    try {
      const svServer = new HttpService();
      this.setEnvelope('UpdateRfcData', { query: q });
      console.log('CdModelService::updateRfcData()/this.postData:', JSON.stringify(this.postData));
      return svServer.proc(this.setEnvelope('UpdateRfcData', { query: q }));
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `updateRfcData failed: ${(error as Error).message}`,
      };
    }
  }

  setEnvelope(action: string, data: any): ICdRequest {
    CdLog.debug('CdAppService::setEnvelope()/starting...');
    // Reset f_vals array to avoid unintended accumulation
    defaultCdRfcEnv.dat.f_vals = [];
    // Update the envelope with new action and data
    defaultCdRfcEnv.a = action;
    defaultCdRfcEnv.dat.f_vals.push(data);
    defaultCdRfcEnv.dat.token = this.cdToken;
    return defaultCdRfcEnv;
  }
}
