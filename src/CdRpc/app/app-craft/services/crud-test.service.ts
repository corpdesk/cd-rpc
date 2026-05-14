import {
  CdControllerDescriptor,
  CdModelDescriptor,
  CdModuleDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import {
  CdFxReturn,
  CdFxStateLevel,
  ICdRequest,
  ICdResponse,
  IQuery,
  MANAGED_FIELDS,
} from '../../../sys/base/i-base';
import { DevModeAction } from '../../../sys/dev-mode/index.js';
import { toCamelCase, toPascalCase } from '../../../sys/utils/cd-naming.util.js';
import { BaseService } from '../../../sys/base/base.service';
import { HttpService } from '../../../sys/base/http.service';
import { ITestLog } from '../models/app-craft.model.js';
import { TestDataService } from './test-data.service';
import { SessonController } from '../../../sys/user/index.js';
import { CdCliProfileController } from '../../../sys/cd-cli/index.js';
import config from '../../../../config.js';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { CrudTestConfig, CrudTestResult } from '../models/default.model.js';
import Table from 'cli-table3';
import chalk from 'chalk';

export class CrudTestService {
  b = new BaseService();
  http = new HttpService();
  module!: CdModuleDescriptor;
  cdToken = '';
  private savedLogs: Record<string, ITestLog[]> = {};
  config!: CrudTestConfig;
  results: CrudTestResult[] = [];

  /** Fields managed by backend that must not be supplied by client */
  // private readonly MANAGED_FIELDS = ['Guid', 'docId', 'Enabled'];

  async init(testConfig?: CrudTestConfig) {
    this.config = { ...this.config, ...testConfig };

    const ctlSession = new SessonController();
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state) {
      return null;
    }

    const r = await ctlSession.getSession(config?.cdApiLocal);
    if (r && r.cd_token) {
      this.cdToken = r.cd_token;
      CdLog.info(`CrudTestService: this.cdToken:${this.cdToken}`);
      CdLog.info('cdToken has been set');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  private log(entry: ITestLog) {
    const { controller } = entry;

    if (!this.savedLogs[controller]) {
      this.savedLogs[controller] = [];
    }

    this.savedLogs[controller].push(entry);

    this.b.logWithContext(
      this,
      `CrudTestService:${controller}:${entry.action}`,
      entry,
      entry.category === 'error' ? 'error' : 'debug',
    );
  }

  private appendLog(controller: string, record: CrudTestResult) {
    if (!this.savedLogs[controller]) {
      this.savedLogs[controller] = [];
    }
    const log: ITestLog = {
      timestamp: new Date().toISOString(),
      category: record.result.state === CdFxStateLevel.Success ? 'response' : 'error',
      action: record.action,
      controller: record.controller,
      response: record.result,
      state:
        typeof record.result.state === 'boolean'
          ? record.result.state
            ? CdFxStateLevel.Success
            : CdFxStateLevel.Error
          : record.result.state,
      message: record.result.message ?? undefined,
    };
    this.savedLogs[controller].push(log);
  }

  async runAllTests(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    this.b.logWithContext(this, `runAllTests:start`, {}, 'debug');
    this.module = module;
    const results: CrudTestResult[] = [];

    try {
      for (const c of this.module.controllers) {
        // this.b.logWithContext(this, `runAllTests:controller`, { controller: c.name }, 'debug');
        const actions = [
          DevModeAction.CREATE,
          DevModeAction.GET,
          DevModeAction.GET_PAGED,
          DevModeAction.UPDATE,
          DevModeAction.DELETE,
        ];

        for (const action of actions) {
          try {
            // this.b.logWithContext(this, `runAllTests:action`, { action }, 'debug');
            const result = await this.executeWithRetry(
              () => this.runTest(action, c),
              this.config,
              `${this.module.name}.${c.name}.${DevModeAction[action]}`,
            );

            // this.b.logWithContext(this, `runAllTests:result`, { result }, 'debug');

            const record: CrudTestResult = {
              controller: c.name,
              action: DevModeAction[action],
              result,
            };
            // this.b.logWithContext(this, `runAllTests:record`, { record }, 'debug');
            results.push(record);
            this.results = results;
            this.appendLog(c.name, record);
            // this.b.logWithContext(
            //   this,
            //   `runAllTests:this.result1`,
            //   { results: this.results },
            //   'debug',
            // );
            // this.b.logWithContext(
            //   this,
            //   `runAllTests:this.savedLogs1`,
            //   { logs: this.savedLogs },
            //   'debug',
            // );

            if (this.config.delayBetweenTestsMs > 0) {
              await new Promise((r) => setTimeout(r, this.config.delayBetweenTestsMs));
            }

            if (this.config.stopOnFailure && result.state !== CdFxStateLevel.Success) {
              return {
                state: CdFxStateLevel.Error,
                message: `Stopped due to failure at ${c.name} ${DevModeAction[action]}`,
              };
            }
          } catch (err: any) {
            const failResult: CrudTestResult = {
              controller: c.name,
              action: DevModeAction[action],
              result: {
                state: CdFxStateLevel.Error,
                data: null,
                message: err.message,
              },
            };

            results.push(failResult);
            this.appendLog(c.name, failResult);
            this.results = results;
            // this.b.logWithContext(
            //   this,
            //   `runAllTests:this.result2`,
            //   { results: this.results },
            //   'error',
            // );
            // this.b.logWithContext(
            //   this,
            //   `runAllTests:this.savedLogs2`,
            //   { logs: this.savedLogs },
            //   'error',
            // );

            if (this.config.stopOnFailure) {
              return {
                state: CdFxStateLevel.Error,
                message: `Stopped due to error at ${c.name} ${DevModeAction[action]}: ${err.message}`,
              };
            }
          }
        }
      }

      // ✅ print summary + logs at the end
      // this.b.logWithContext(this, `runAllTests:this.result3`, { results: this.results }, 'debug');
      // this.b.logWithContext(this, `runAllTests:this.savedLogs3`, { logs: this.savedLogs }, 'error');
      await this.printTestSummary();

      return {
        state: CdFxStateLevel.Success,
        message: `All tests executed for module '${this.module.name}'`,
      };
    } catch (e: any) {
      return {
        state: CdFxStateLevel.SystemError,
        message: `runAllTests failed: ${e.message || e}`,
      };
    }
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: CrudTestConfig,
    label: string,
  ): Promise<T> {
    let attempt = 0;
    let delay = config.retryDelayMs;

    while (true) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

        const result = await fn();
        clearTimeout(timeout);
        return result;
      } catch (e: any) {
        attempt++;
        if (attempt > config.maxRetries) {
          throw new Error(`[${label}] failed after ${attempt} attempts: ${e.message || e}`);
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }

  async runTest(action: DevModeAction, c: CdControllerDescriptor): Promise<CdFxReturn<null>> {
    try {
      let request: ICdRequest;
      switch (action) {
        case DevModeAction.CREATE:
          request = this.createRequest(c);
          break;
        case DevModeAction.GET:
          request = this.getRequest(c);
          break;
        case DevModeAction.GET_PAGED:
          request = this.getPagedRequest(c);
          break;
        case DevModeAction.UPDATE:
          request = this.updateRequest(c);
          break;
        case DevModeAction.DELETE:
          request = this.deleteRequest(c);
          break;
        default:
          throw new Error('Invalid action');
      }

      this.log({
        timestamp: new Date().toISOString(),
        category: 'request',
        action: DevModeAction[action],
        controller: c.name,
        request,
      });

      const resp = await this.handleRequest(request);

      this.log({
        timestamp: new Date().toISOString(),
        category: resp.state === CdFxStateLevel.Success ? 'response' : 'error',
        action: DevModeAction[action],
        controller: c.name,
        response: resp,
        state:
          typeof resp.state === 'boolean'
            ? resp.state
              ? CdFxStateLevel.Success
              : CdFxStateLevel.Error
            : resp.state,
        message: resp.message ?? undefined,
      });

      return resp;
    } catch (e: any) {
      const msg = `runTest failed: ${e.message || e}`;
      this.log({
        timestamp: new Date().toISOString(),
        category: 'system',
        action: DevModeAction[action],
        controller: c.name,
        message: msg,
        state: CdFxStateLevel.SystemError,
      });
      return {
        state: CdFxStateLevel.SystemError,
        data: null,
        message: msg,
      };
    }
  }

  /** ---------------------- REQUEST HELPERS ---------------------- **/

  private buildBaseRequest(
    c: CdControllerDescriptor,
    action: string,
    dat: any,
    args: any = {},
  ): ICdRequest {
    this.b.logWithContext(
      this,
      `getRequest:cdRequest/start`,
      {},
      'debug',
    );
    const cdRequest = {
      ctx: toPascalCase(this.module.ctx),
      m: this.module.name,
      c: toPascalCase(c.name),
      a: action,
      dat: { f_vals: [dat], token: this.cdToken },
      args,
    };
    this.b.logWithContext(
      this,
      `getRequest:cdRequest`,
      { cdRequest: JSON.stringify(cdRequest) },
      'debug',
    );
    return cdRequest;
  }

  createRequest(c: CdControllerDescriptor): ICdRequest {
    this.b.logWithContext(
      this,
      'createRequest:start',
      { controller: c.name, models: this.module.models.map((m) => m.name) },
      'debug',
    );

    const model = this.module.models?.find(
      (m) => m.parentController === c.name || m.name === c.name,
    );

    this.b.logWithContext(this, 'createRequest:model', { model }, 'debug');

    const factory = new TestDataService(this.module.name);

    if (!model) {
      throw new Error(`Model not found for controller: ${c.name}`);
    }

    let data = factory.buildCreateData(c, model);

    // 🔹 Strip managed fields before sending
    data = this.stripManagedFields(data);

    this.b.logWithContext(this, 'createRequest:data', data, 'debug');

    const req = this.buildBaseRequest(c, 'Create', { data }, null);

    this.b.logWithContext(this, `createRequest:req`, req, 'debug');

    return req;
  }

  getRequest(c: CdControllerDescriptor): ICdRequest {
    this.b.logWithContext(this, `getRequest:c.name`, { cName: c.name }, 'debug');
    const model = this.module.models?.[c.name];
    const pk = model?.primaryKey ?? `${toCamelCase(c.name)}Id`;
    const query: IQuery = { where: { [pk]: 1 } };
    this.b.logWithContext(this, `getRequest:query`, { query }, 'debug');
    return this.buildBaseRequest(c, `Get`, { query }, null);
  }

  getPagedRequest(c: CdControllerDescriptor): ICdRequest {
    this.b.logWithContext(this, `getPagedRequest:c.name`, { cName: c.name }, 'debug');
    const idField = `${toCamelCase(c.name)}Id`;
    const guidField = `${toCamelCase(c.name)}Guid`;

    const query: IQuery = {
      select: [idField, guidField],
      where: {[`${toCamelCase(c.name)}Id`]: 1},
      take: 5,
      skip: 1,
    };
    this.b.logWithContext(this, `getPagedRequest:query`, { query }, 'debug');
    return this.buildBaseRequest(c, 'GetPaged', { query }, null);
  }

  updateRequest(c: CdControllerDescriptor): ICdRequest {
    const model = this.module.models?.[c.name];
    const pk = model?.primaryKey ?? `${toCamelCase(c.name)}Id`;

    const query: IQuery = {
      update: { [`${toCamelCase(c.name)}Name`]: 'Updated Value' },
      where: { [pk]: 1 },
    };

    return this.buildBaseRequest(c, 'Update', { query }, {});
  }

  deleteRequest(c: CdControllerDescriptor): ICdRequest {
    const model = this.module.models?.[c.name];
    const pk = model?.primaryKey ?? `${toCamelCase(c.name)}Id`;

    const query: IQuery = { where: { [pk]: 1 } };

    return this.buildBaseRequest(c, 'Delete', { query }, null);
  }

  /** ---------------------- SUPPORT ---------------------- **/

  private stripManagedFields(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (MANAGED_FIELDS.some((mf) => key.endsWith(mf) || key === mf)) {
        this.b.logWithContext(this, 'stripManagedFields:removed', { key, value }, 'debug');
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  }

  async handleRequest(request: ICdRequest): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        'handleRequest:start',
        { request: JSON.stringify(request) },
        'debug',
      );
      const response = await this.http.proc(request, 'cdApiLocal');
      if (!response.state || !response.data) {
        const msg = `Failed to contact cd-api for module '${request.m}'.`;
        return {
          state: CdFxStateLevel.NetworkError,
          data: null,
          message: msg,
        };
      }

      const cdResp: ICdResponse = response.data;
      if (!cdResp.app_state.success) {
        return {
          state: CdFxStateLevel.Error,
          data: null,
          message: cdResp.app_state.info?.app_msg || 'Unknown app error',
        };
      }

      return {
        state: CdFxStateLevel.Success,
        data: null,
        message: `Module '${request.m}' ${request.a} succeeded`,
      };
    } catch (e: any) {
      return {
        state: CdFxStateLevel.SystemError,
        data: null,
        message: `handleRequest exception: ${e.message || e}`,
      };
    }
  }

  /**
   * Print results
   */
  printTestSummary() {
    this.b.logWithContext(this, `CrudTestservice::logWithContext()/start`);
    // --- Results Table ---
    const resultsTable = new Table({
      head: ['Controller', 'Action', 'Status', 'Message'],
      colWidths: [30, 20, 15, 60],
      wordWrap: true,
    });

    let successCount = 0;
    let failCount = 0;
    let warnCount = 0;

    this.results.forEach((r) => {
      let status = '';
      if (r.result.state === CdFxStateLevel.Success) {
        status = chalk.green('✅ Success');
        successCount++;
      } else if (r.result.state === CdFxStateLevel.Error) {
        status = chalk.red('❌ Failed');
        failCount++;
      } else {
        status = chalk.yellow('⚠ Other');
        warnCount++;
      }

      resultsTable.push([r.controller, r.action, status, r.result.message || '']);
    });

    console.log('\n' + chalk.bold.underline('CRUD Test Results'));
    console.log(resultsTable.toString());
    console.log(
      chalk.bold(`\nSummary:`) +
        chalk.green(` ${successCount} succeeded`) +
        ', ' +
        chalk.red(`${failCount} failed`) +
        ', ' +
        chalk.yellow(`${warnCount} warnings/other`) +
        chalk.cyan(`, ${this.results.length} total\n`),
    );

    // --- Detailed Logs ---
    console.log(chalk.bold.underline('\nDetailed Logs'));

    for (const [key, logs] of Object.entries(this.savedLogs)) {
      console.log(chalk.cyan(`\n# ${key}`)); // controller.action
      const logTable = new Table({
        head: ['Step', 'Direction', 'Payload'],
        colWidths: [15, 15, 80],
        wordWrap: true,
      });

      // logs.forEach((log, idx) => {
      //   logTable.push([
      //     `${idx + 1}. ${log.label || log.type}`,
      //     log.type === 'request'
      //       ? chalk.yellow('➡ request')
      //       : log.type === 'response'
      //         ? chalk.green('⬅ response')
      //         : chalk.red('💥 error'),
      //     typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2),
      //   ]);
      // });
      logs.forEach((rawLog, idx) => {
        const log = this.normalizeLog(rawLog);

        logTable.push([
          `${idx + 1}. ${log.label}`,
          log.type === 'request'
            ? chalk.yellow('➡ request')
            : log.type === 'response'
              ? chalk.green('⬅ response')
              : log.type === 'error'
                ? chalk.red('💥 error')
                : chalk.cyan(log.type),
          typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2),
        ]);
      });

      console.log(logTable.toString());
    }

    return {
      successCount,
      failCount,
      warnCount,
      total: this.results.length,
    };
  }

  private normalizeLog(log: ITestLog): {
    label: string;
    type: 'request' | 'response' | 'error' | 'system' | 'info' | 'debug';
    payload: any;
  } {
    return {
      label: `${log.controller}.${log.action}`,
      type: log.category,
      payload: log.request ?? log.response ?? log.message ?? { state: log.state },
    };
  }
}
