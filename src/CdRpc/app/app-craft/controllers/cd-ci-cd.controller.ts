import { CdFxReturn, IQuery } from '../../../sys/base/i-base.js';
import { CiCdDescriptor } from '../../../sys/dev-descriptor/models/cicd-descriptor.model.js';
import { CdCiCdService } from '../services/cd-ci-cd.service.js';

export class CdCiCdCiCd {
  svCdCiCd;
  constructor() {
    this.svCdCiCd = new CdCiCdService();
  }

  /**
   * Create a new application
   * CdApi:
   * - setup development environment
   *    - npm
   *    - mysql
   *    - redis
   *    - ssl
   * - migration files
   * - clone corpdesk if not yet done
   * - create repository for new model
   * - sync workstation to repository
   * - sync db data
   *
   * @param modelDescriptor
   * @returns
   */
  // async create(d: CiCdDescriptor): Promise<CdFxReturn<null>> {
  //   return this.svCdCiCd.create(d);
  // }

  // async read(q?: IQuery): Promise<CdFxReturn<CiCdDescriptor[]>> {
  //   return this.svCdCiCd.read(q);
  // }

  // async update(q: IQuery): Promise<CdFxReturn<null>> {
  //   return this.svCdCiCd.update(q);
  // }

  // async delete(q: IQuery): Promise<CdFxReturn<null>> {
  //   return this.svCdCiCd.delete(q);
  // }

  // // Get all applications
  // async getAllApps(): Promise<CdFxReturn<CiCdDescriptor[]>> {
  //   return this.svCdCiCd.getAllApps();
  // }

  // // Get a single model by name
  // async getCiCdByName(name: string): Promise<CdFxReturn<CiCdDescriptor[]>> {
  //   return this.svCdCiCd.getCiCdByName(name);
  // }
}
