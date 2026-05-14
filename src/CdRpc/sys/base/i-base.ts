/**
 * This is the core source for Corpdesk
 */
import { Observable } from "rxjs";
import { NextFunction, Request, Response } from "express";
import { AclModuleViewModel } from "../moduleman/models/acl-module-view.model";
import { MenuViewModel } from "../moduleman/models/menu-view.model";
import { IUserProfile, UserModel } from "../user/models/user.model";
import { SessionModel } from "../user/models/session.model";
import { ConsumerModel } from "../moduleman/models/consumer.model";
import { CompanyModel } from "../moduleman/models/company.model";
import {
  DataSource,
  DeleteResult,
  FindOptionsWhere,
  ObjectLiteral,
  UpdateResult,
} from "typeorm";
// import { UiSystemDescriptor } from "../dev-descriptor/models/ui-system-descriptor.model";
import { LogLevel } from "./winston.log";

export const SYS_CTX = 'Sys';
export const DEFAULT_DAT: EnvelopDat = {
  f_vals: [
    {
      query: null,
      data: null,
    },
  ],
  token: null,
};

export const DEFAULT_ARGS = {};

export const DEFAULT_ENVELOPE_CREATE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Create',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Get',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_PAGED: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'GetCount',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_TYPE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'GetCount',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_UPDATE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Update',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_DELETE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Delete',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export interface CdResponse {
  app_state: IAppState;
  data: any[];
}

////////////////////

// export const DEFAULT_CD_RESPONSE: ICdResponse = {
//   app_state: {
//     success: false,
//     info: {
//       messages: [],
//       code: '',
//       app_msg: '',
//     },
//     sess: {
//       cd_token: '',
//       jwt: null,
//       ttl: 600,
//     },
//     cache: {},
//   },
//   data: [],
// };

// export const DEFAULT_CD_REQUEST: ICdRequest = {
//   ctx: 'Sys',
//   m: '',
//   c: '',
//   a: '',
//   dat: DEFAULT_DAT,
//   args: DEFAULT_ARGS,
// };

export interface IAppState {
  success: boolean;
  info: IRespInfo | null;
  sess: ISessResp | null;
  cache: object | null;
  sConfig?: IServerConfig;
}

export interface BaseServiceInterface<T> {
  create: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ) => Promise<CdFxReturn<T> | T | ICdResponse | void >;
  read: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ) => Promise<CdFxReturn<T[]> | T[] | ICdResponse>;
  update: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ) => Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse>;
  delete: (
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ) => Promise<CdFxReturn<DeleteResult> | DeleteResult | ICdResponse>;
}

export abstract class AbstractBaseService<T> implements BaseServiceInterface<T> {
  abstract create(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<T> | T | ICdResponse | void>;
  abstract read(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<T[]> | T[] | ICdResponse>;
  abstract update(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse>;
  abstract delete(
    req: Request | null,
    res: Response | null,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<DeleteResult> | DeleteResult | ICdResponse>;
}

/**
 * -------------------------------------------------------------------------------------------------------------------------
 * interface ICdRequest:
 * -------------------------------------------------------------------------------------------------------------------------
 * This is the interface for network request.
 * The request can target an Corpdesk API, cd-api, 
 * or sent via Corpdesk Websocket server, cd-sio to target another
 * frontend corpdesk module. When used in cd-sio, it can have multiple targets.
 * A given request can also nest another request as per developer requrements.
 * 
 * "Sys" as a value for ICdRequest.ctx implies the target module resides in the system directory of the target api.
 * System directory hosts modules that are meant to offer common services to general applications.
 * Corpdesk system directory can be visualised as the operating system packages shipped with Corpdesk to support "Apps".
 * There are also "Apps" developed by corpdesk developers but resides in "app" directory. 
 * These application are the types that are not core to operation of any Corpdesk application. 
 * For example accounts package or any application for business operation
 * "App" as a value for ICdRequest.ctx implies the target module resides in the application directory of the target api.
 * Applications are general applications that can be developed by 3rd party developers.
 * 
 * Case convention:
 * ctx: camel case with first character being capital.
 * m: camel case with first character being capital.
 * c: camel case with first character being capital.
 * a: camel case with first character being capital.
 * 
 * TODO:
 * It must be said that these solutions are constantly being tested and refined. 
 * There are several finer points which were implemented much earlier but later refinment of policy makes them anti-pattern. Changing them can break existing application.
 * Such modifications will requre careful planning
 * Below are some identified areas for change:
 * token name: Session token key name needs to be standardised. During corpdesk development it has aquired a number of references.
 * Eg "token", "cdToken", "cd-token", "sid". 
 * There is need to standardise how it gets refered and identified by consistent name
 * 
 * Example:
 * In the example below, the request is targeting "User" module, "User" controller and the action is "Login"
 * The data input is based on the IUserModule at the api. In this case what is requred is userName, password
 * The way it has been used here is an anti-pattern.
 * consumerGuid is part of IConsumer interface.
 * If you examine the interface EnvelopFValItem, which form part of ICdRequest, there is the option of extData
 * So the base place for consumerGuid is extData.
 * The object below is how it was coded before refinement of interface policy.
 * This correction will have to be made at a later date.
 * 
 * {
    "ctx": "Sys",
    "m": "User",
    "c": "User",
    "a": "Login",
    "dat": {
        "f_vals": [
        {
            "data": {
            "userName": "karl",
            "password": "secret",
            "consumerGuid": "B0B3DA99-1859-A499-90F6-1E3F69575DCD"
            }
        }
        ],
        "token": null
    },
    "args": null
    }
 */
export interface ICdRequest {
  ctx: string; // can be either "Sys" or "App"
  m: string; // target module name. Note that at the source codes, the full name has "Module" word following the given name here.
  c: string; // target controler name. Note that at the source codes, the full name has "Controller" word following the given name here.
  a: string; // target action name
  dat: EnvelopDat; // payload data
  args: any | null; // for future or forseable extension. Was set at design time but has not been used so far. Recommended to be kept as is
}

export interface EnvelopDat {
  f_vals: EnvelopFValItem[]; // settings for the command. The array dimension was meant to have capacity for sending multiple commands in the future
  token: string | null; // session token.
}

export interface EnvelopFValItem {
  query?: IQuery; // see  IQuery notes
  data?: any; // set according to the interface of a given Corpdesk controller interface. This is synonimous with model of a given entity targeting a database table or similar
  extData?: any; // for use in scenario where extra data is used to complete the command. For example when the target action need pre or post process. The details are set by develper at the controller action
  /**
   * Developer-specific objects (like cdObj, userObj, etc.)
   * Any additional property is allowed here.
   */
  [key: string]: any;
}

/**
 * for setting up query akin to sql query but can also be used against non-sql queries.
 * At its best the syntx should not be dependent on target data store type.
 */
// export interface IQuery {
//   select?: string[];
//   update?: object;
//   where: IQueryWhere;
//   jsonUpdate?: JSDPInstruction[]; // This was developed for JSON columns. Its use can be found in the implementation of UserProfile and how CoopMemberProfile has extended UserProfile
//   distinct?: boolean;
//   take?: number;
//   skip?: number;
//   jFilters?: IJFilter[];
//   order?: any;
//   class?: string;
// }

// export interface IQueryWhere {
//   // new AND/OR logic
//   andWhere?: Array<{ [field: string]: string }>;
//   orWhere?: Array<{ [field: string]: string }>;

//   // legacy-compatible structures
//   [field: string]: any; // for flat objects or keys not matching and/or
// }
export interface IQuery {
  select?: string[];
  update?: object;
  where?: IQueryWhere;
  jsonUpdate?: JSDPInstruction[]; // This was developed for JSON columns. Its use can be found in the implementation of UserProfile and how CoopMemberProfile has extended UserProfile
  distinct?: boolean;
  take?: number;
  skip?: number;
  jFilters?: IJFilter[];
  order?: any;
  class?: string;
  extData?: any; // any extra data
}

// Recursive support for nested 'andWhere' and 'orWhere'
export interface IQueryWhere {
  andWhere?: Array<IQueryWhere | { [field: string]: any }>;
  orWhere?: Array<IQueryWhere | { [field: string]: any }>;

  // legacy-compatible flat conditions
  [field: string]: any;
}

// custom json update
// export interface JSDPInstruction {
//   modelField?: string; // name of the json column. Capacity to update multiple json columns in a given row
//   path: any; // path to a target item in JSON data
//   value: any; // value to apply to a tarteg item
//   action: string; // CRUD option
// }

// json field filter
export interface IJFilter {
  jField: string;
  jPath: string;
  pathValue: any;
}

// query builder input
// export interface IQbInput {
//   select?: string[];
//   update?: object;
//   where: IQbFilter[];
//   distinct?: boolean;
//   take?: number;
//   skip?: number;
// }
export interface IQbInput<T> {
  select?: string[];
  update?: object;
  where: FindOptionsWhere<T>; // Change from IQbFilter[] to FindOptionsWhere<T>
  distinct?: boolean;
  take?: number;
  skip?: number;
}

// export type FindOptionsWhere<Entity> = {
//     [P in keyof Entity]?: P extends "toString" ? unknown : FindOptionsWhereProperty<NonNullable<Entity[P]>>;
// };

/**
 * constraining the update attribute to specific models in different services.
 * By using Array<keyof T> for the select attribute, you constrain the select array to valid fields of the model type T.
 * This approach improves type safety and ensures that you don't accidentally select invalid fields.
 * This type-safe approach helps prevent errors at compile-time, making your code more reliable and maintainable.
 */
export interface QueryInput {
  select?: string[];
  where?: any; // Already exists, but we'll use it for dynamic WHERE conditions
  update?: Record<string, any>; // New property to specify which fields to update
  take?: number;
  skip?: number;
}

// query builder filter
export interface IQbFilter {
  field: string;
  operator: string;
  val: string;
  conjType?: string;
  dataType: string;
  jPath?: string;
}

/**
 * -------------------------------------------------------------------------------------------------------------------------
 * interface ICdResponse
 * -------------------------------------------------------------------------------------------------------------------------
 * This is the interface for response data
 * It has two sections.
 * 1. app_state
 * 2. data
 *
 */
export interface ICdResponse {
  app_state: {
    success: boolean; // tels whether the process was successfull or not
    info: IRespInfo; // status messages including error details if any or standard message of success
    sess: ISessResp; // session status data
    cache: object;
    sConfig?: IServerConfig;
  };
  data: object;
}

// export interface IRespInfo {
//   messages: string[]; // array of errors encountered
//   code: string; // error code. Corpdesk use this to code the exact spot of error by controller and action
//   app_msg: any; // general response message (can be set with string, or null)
// }
export interface IRespInfo {
  messages: string[]; // array of errors encountered
  code: string; // error code. Corpdesk uses this to code the exact spot of error by controller and action
  app_msg: any; // general response message (can be set with string, or null)

  // Merged state into a single property `respState`
  respState?: {
    cdLevel: CdResponseState; // -1 for error, 0 for success, 1 for warning, etc.
    cdDescription?: string; // Custom description for Corpdesk-specific state

    httpCode: HttpState; // HTTP status code (e.g., 200, 400, etc.)
    httpDescription?: string; // HTTP status description (e.g., "OK", "Bad Request")
  };
}

export enum CdResponseState {
  SUCCESS = 0, // Represents a successful operation
  WARNING = 1, // Represents a non-critical warning (e.g., partial success)
  ERROR = -1, // Represents a failure or error
  INFO = 2, // Represents informational messages (e.g., processing steps)
  PARTIAL_ERROR = -2, // Represents a partial error (e.g., part of the operation failed)
  UNDEFINED = -99, // Represents an undefined or unknown state
}

export enum HttpState {
  OK = 200, // OK: The request has succeeded.
  CREATED = 201, // CREATED: The request has been fulfilled and resulted in a new resource being created.
  ACCEPTED = 202, // ACCEPTED: The request has been accepted for processing, but the processing has not been completed.
  NO_CONTENT = 204, // NO_CONTENT: The server has successfully processed the request, but is not returning any content.

  BAD_REQUEST = 400, // BAD_REQUEST: The server could not understand the request due to invalid syntax.
  UNAUTHORIZED = 401, // UNAUTHORIZED: The client must authenticate itself to get the requested response.
  FORBIDDEN = 403, // FORBIDDEN: The client does not have access rights to the content.
  NOT_FOUND = 404, // NOT_FOUND: The server can not find the requested resource.

  INTERNAL_SERVER_ERROR = 500, // INTERNAL_SERVER_ERROR: The server has encountered a situation it doesn't know how to handle.
  NOT_IMPLEMENTED = 501, // NOT_IMPLEMENTED: The request method is not supported by the server and cannot be handled.
  BAD_GATEWAY = 502, // BAD_GATEWAY: The server, while acting as a gateway or proxy, received an invalid response from the upstream server.
  SERVICE_UNAVAILABLE = 503, // SERVICE_UNAVAILABLE: The server is not ready to handle the request (overloaded or down for maintenance).
  GATEWAY_TIMEOUT = 504, // GATEWAY_TIMEOUT: The server, while acting as a gateway or proxy, did not get a response in time from the upstream server.
}

export interface ISessResp {
  cd_token?: string; // corpdesk token
  userId?: number | null; // current user id
  jwt: {
    jwtToken: string;
    checked: boolean;
    checkTime: number;
    authorized: boolean;
  } | null; // jwt data
  ttl: number; // server settings for session lifetime
  initUuid?: string; // initialization guid of session
  initTime?: string; // when the session started
  clientId?: any; // OPtonal. for diagnosis for server view of the client.
}

export interface ISessionDataExt {
  currentUser: UserModel;
  currentUserProfile: IUserProfile;
  currentSession: SessionModel;
  currentConsumer: ConsumerModel;
  currentCompany: CompanyModel;
}

export interface IServerConfig {
  usePush: boolean;
  usePolling: boolean;
  useCacheStore: boolean;
}

/**
 * 
 * -------------------------------------------------------------------------------------------------------------------------
 * interface IJFilter
 * -------------------------------------------------------------------------------------------------------------------------
 * This interface was meant to integrate with laid procedure for selecting item nesed in JSON field
 * Below is a sample of how request can be made to a test method in InteRact module
 * 
     * {
            "ctx": "Sys",
            "m": "InteRact",
            "c": "InteRactMedia",
            "a": "TestJsonQuery",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select": [
                                "inte_ractPubId",
                                "inte_ractPubName",
                                "inte_ractPubDescription",
                                "inte_ractPubGuid",
                                "docId",
                                "inteRactPubTypeId",
                                "public",
                                "m",
                                "c",
                                "j_val"
                            ],
                            "where": [
                                {
                                    "conjType": "",// options null, or omit the property
                                    "dataType":"json",
                                    "field": "j_val",
                                    "jPath": "'$.domain.group.doc_id'",
                                    "operator": "=",
                                    "val": 11091
                                },
                                {
                                    "field": "doc_id",
                                    "fieldType": "json",
                                    "operator": "=",
                                    "val": 11121,
                                    "conjType": "and" 
                                }
                            ]
                        }
                    }
                ],
                "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
            },
            "args": {}
        }
    
        References:
        file path: cd-api/src/CdApi/sys/inte-ract/controllers/inte-ract-pub.controller.ts
        method: TestJsonQuery
        file: cd-api/src/CdApi/sys/inte-ract/services/inte-ract-media.service.ts
        method: testJsonQuery

     * 
     */

export const CDOBJ_TYPE_USER = 9;
export const CDOBJ_TYPE_GROUP = 10;

/**
 * @path // the path of the controller relative to the BaseService file
 * @clsName // class name
 * @action // class method to invoke
 */
export interface IControllerContext {
  path: string;
  clsName: string;
  action: string;
  dataSource: any;
}

export interface IModelRules {
  create: object;
  update: object;
  remove: object;
}

export const DEFAULT_CD_REQUEST: ICdRequest = {
  ctx: "Sys",
  m: "",
  c: "",
  a: "",
  dat: {
    f_vals: [
      {
        data: {},
      },
    ],
    token: "",
  },
  args: {},
};

export const DEFAULT_CD_RESPONSE: ICdResponse = {
  app_state: {
    success: false,
    info: {
      messages: [],
      code: "",
      app_msg: "",
    },
    sess: {
      cd_token: "",
      jwt: null,
      ttl: 600,
    },
    cache: {},
  },
  data: [],
};

export interface ICdPushEnvelop {
  pushData: {
    appId?: string;
    appSockets?: ISocketItem[];
    pushGuid: string;
    m?: string;
    pushRecepients: ICommConversationSub[];
    triggerEvent: string;
    emittEvent: string;
    token: string;
    commTrack: CommTrack;
    isNotification: boolean | null;
    isAppInit?: boolean | null;
  };
  req: ICdRequest | null;
  resp: ICdResponse | null;
}

export interface ISocketItem {
  socketId: string;
  name: string;
  socketGuid?: string;
}

export interface ICommConversationSub {
  userId: number; // subscriber userId
  subTypeId: number; // type of subscriber
  commconversationId?: number;
  commconversationsubId?: number;
  commconversationsubInvited?: boolean;
  commconversationsubAccepted?: boolean;
  groupId?: number; // can be used to represent chat room in websocket service
  // commTrack: CommTrack;
  cdObjId: CdObjId;
}

/**
 * interface for tracking pushed message
 * push stages:
 * - relayed: message has arrived
 * - pushed: message has been pushed from the server to recepient
 * - delivered: message has reached the recepient
 * - completed: server is notified that message was delivered and sender notified
 */
export interface CommTrack {
  initTime: number | null;
  relayTime: number | null;
  pushed: boolean;
  pushTime: number | null;
  relayed: boolean;
  deliveryTime: number | null;
  delivered: boolean;
  completed: boolean;
  completedTime: number | null;
}

/**
 * triggerEvent: the servier event to handle a given message
 * emittEvent: the event that handles message at the client
 * sFx: server function that handles a given message
 * cFx: client function that handles a given message
 * extDat: extra data
 */
export interface PushEvent {
  triggerEvent: string;
  emittEvent: string;
  sFx?: string;
  cFx?: string;
}

export interface ICommConversationSub {
  userId: number; // subscriber userId
  subTypeId: number; // type of subscriber
  commconversationId?: number;
  commconversationsubId?: number;
  commconversationsubInvited?: boolean;
  commconversationsubAccepted?: boolean;
  groupId?: number; // can be used to represent chat room in websocket service
  // commTrack: CommTrack;
  cdObjId: CdObjId;
}

export interface CommTrack {
  initTime: number | null;
  relayTime: number | null;
  relayed: boolean;
  deliveryTime: number | null;
  deliverd: boolean;
}

export interface IServiceInput<T> {
  primaryKey?: string;
  serviceInstance?: any;
  serviceModel: new () => T; // Ensure serviceModel is a class
  mapping?: any;
  serviceModelInstance?: T;
  docName?: string;
  cmd?: Cmd<T>;
  data?: Partial<T>;
  dSource?: number | DataSource; // Now accepts a TypeORM DataSource instance
  extraInfo?: boolean;
  modelName?: string;
  modelPath?: string;
  fetchInput?: IFetchInput;
}

export interface IFetchInput {
  url: string;
  options?: {
    method?: string;
    body?: string;
    headers?: {
      "Content-Type"?: string;
      "X-Parse-Application-Id"?: string;
      "X-Parse-REST-API-Key"?: string;
    };
  };
}

export interface Cmd<T> {
  action?: string;
  query: IQuery | IQbInput<T>;
}

export interface IDoc {
  doc_id?: number;
  doc_guid?: string;
  doc_name?: string;
  doc_description?: string;
  company_id?: number;
  doc_from: number;
  doc_type_id: number;
  doc_date?: Date;
  attach_guid?: string;
  doc_expire_date?: Date;
}

export type ClassRef = new (...args: any[]) => any;
export type Fn = () => void;

export interface IUser {
  userID: number;
  userGUID: string;
  userName: string;
}
export interface IBase {
  cdToken: string;
  cRules: object;
  uRules: object;
  dRules: object;
}

export interface CdObjId {
  ngModule: string | null;
  resourceName: string | null;
  resourceGuid: string | null;
  jwtToken: string | null;
  socket: any;
  socketId?: string;
  commTrack: CommTrack | null;
}

export interface IAclCtx {
  memberGuid: string;
  moduleGroupGuid: any;
  consumerId: number;
  moduleName: string;
  currentUser: any;
  module: any;
}

export interface IAclRole {
  aclRoleName?: string;
  permissions?: IAclPermission;
}

export interface IAclPermission {
  userPermissions: IPermissionData[];
  groupPermissions: IPermissionData[];
}

/**
 * Improved versin should have just one interface and
 * instead of userId or groupId, cdObjId is applied.
 * This would then allow any object permissions to be set
 * Automation and 'role' concept can then be used to manage permission process
 */
export interface IPermissionData {
  cdObjId: number;
  hidden: boolean;
  field: string;
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ISelectedMenu {
  moduleMenuData?: MenuViewModel[];
  selectedItem: MenuViewModel;
  selectedId?: number;
}

export interface IAllowedModules {
  modules$: Observable<AclModuleViewModel[]>;
  modulesCount: number;
}

export interface IMenuRelations {
  menuParent: MenuViewModel;
  menuChildren: MenuViewModel[];
}

export interface ObjectItem {
  key: string;
  value: any;
}

// Extended Service Input for internal use within services, allowing for additional context and data to be passed alongside the standard service input.
export interface IExtServiceInput<T> {
  serviceInput: IServiceInput<T>;
  entityData: T;
}

export interface CacheData {
  key: string;
  value: string;
  initUuid?: string;
  initTime?: string;
}

export interface JWT {
  jwtToken: string;
  checked: boolean;
  checkTime: number;
  authorized: boolean;
}

/**
 * Usage for interface ValidationRules 
 const rules: ValidationRules = {
  required: ["userId", "coopId"],
  noDuplicate: ["userId", "coopId"],
  allowedValues: {
    coopMemberTypeId: [101, 102, 108],
  },
  minLength: {
    coopMemberProfile: 5,
  },
  regex: {
    userEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};
 */
export interface ValidationRules {
  required?: string[]; // Fields that must be present
  noDuplicate?: string[]; // Fields that must be unique
  allowedValues?: Record<string, any[]>; // Optional: enforce enum-like constraints
  minLength?: Record<string, number>; // Optional: enforce minimum string lengths
  maxLength?: Record<string, number>; // Optional: enforce maximum string lengths
  regex?: Record<string, RegExp>; // Optional: custom format rules
}

/**
 * Rather than have just some standard levels of operation, this is an expressive flagging that can
 * serve in very many cases
 *
 * RunMode defines the operational state of the system.
 * These are ordered by increasing level of verbosity, system availability, and openness.
 * Use these levels for environment-aware logging, diagnostics, and operational control.
 */
export enum RunMode {
  /**
   * System is turned off. No operations should be permitted.
   */
  SYSTEM_SHUTDOWN = 0,

  /**
   * Restricted to maintenance tasks only. No external or user-triggered API access.
   */
  MAINTENANCE_MODE = 1,

  /**
   * Only the most essential functions are operational (e.g., auth, health checks).
   */
  CRITICAL_ONLY = 2,

  /**
   * Enables safe-level debugging and system inspection (non-invasive).
   */
  SAFE_DEBUG_MODE = 3,

  /**
   * Default/standard operating mode.
   */
  NORMAL_OPERATION = 4,

  /**
   * Allows logging of verbose runtime details.
   */
  VERBOSE_MONITORING = 5,

  /**
   * Enables deep diagnostics such as full stack traces, DB query logs, etc.
   */
  DIAGNOSTIC_TRACE = 6,

  /**
   * Enables in-depth audit and profiling for performance or security reviews.
   */
  FULL_AUDIT_AND_PROFILING = 7,

  /**
   * Simulated environment where data persistence is disabled (e.g., for safe testing).
   */
  SANDBOX_SIMULATION = 8,

  /**
   * Uses mocked data sources, often for frontend or integration testing.
   */
  MOCK_DATA_MODE = 9,

  /**
   * Full developer freedom: exposes internals, bypasses restrictions, logs everything.
   */
  UNRESTRICTED_DEVELOPER_MODE = 10,
}

/**
 * This is an effort to standardize corpdesk return by a function or method.
 * All corpdesk functions and methods are expected to implement CdFxReturn (progressively)
 * - Consistency Across All Corpdesk Applications
 * - Safer Type Handling
 * - Improved Error Handling
 * interface as a return type.
 * Proposed: 6th Feb 2025
 * Adoption is meant to be progressive over time.
 * The principle if borrowed from Go's tuple returns
 */
export interface CdFxReturn<T> {
  data: T | null;
  state: boolean | CdFxStateLevel;
  message?: string; // Optional error/success message
}

export enum CdFxStateLevel {
  Error = 0,
  Success = 1,
  PartialSuccess = 2,
  LogicalFailure = 3,
  Warning = 4,
  Recoverable = 5,
  Info = 6,
  Pending = 7,
  Cancelled = 8,
  NotFound = 9,
  NotImplemented = 10,
  SystemError = 11,
  Fatal = 12,
  Unknown = 13,
  NetworkError = 17,
  PermissionDenied = 18,
}

// ─── Assertion Return Type ────────────────────────
export type CdAssertReturn = CdFxReturn<boolean>;

export interface FxStateMeta {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'error' | 'success' | 'warning' | 'info';
}

export interface FxStateSemantics {
  mapping: Record<keyof typeof CdFxStateLevel, FxStateMeta>;
}

export const CD_FX_FAIL = {
  data: null,
  state: false,
  message: "Failed!",
};

export interface EnvConfig {
  /** Unique ID for this client application instance */
  clientAppGuid: string;

  /** Application identifier used by backend */
  appId: string;

  /** Whether this is a production build */
  production: boolean;

  /** REST API endpoint */
  apiEndpoint: string;

  /** Socket.IO endpoint */
  sioEndpoint: string;

  /** WebSocket endpoint */
  wsEndpoint: string;

  /** Mode: 'sio' | 'ws' | 'pusher' */
  wsMode: string;

  /** Realtime (push) configuration */
  pushConfig: PushConfig;

  /** Optional token that identifies the tenant/consumer */
  consumerToken?: string;

  /** Client context: same as Angular version */
  clientContext?: ClientContext;

  /** Public-facing assets for user-related resources */
  USER_RESOURCES: string;

  /** API base host */
  apiHost: string;

  /** Shell base host */
  shellHost: string;

  /** Socket.IO base host */
  sioHost: string;

  /** Port for API when applicable */
  CD_PORT?: number;

  /** Name/ID representing tenant/consumer */
  consumer: string;

  /** Client application ID (legacy) */
  clientAppId: number;

  /** Socket.IO port */
  SOCKET_IO_PORT: number;

  /** Selected auth provider */
  defaultauth?: string;

  /** Path to module federation manifest */
  mfManifestPath?: string;

  /** Additional API options (headers, mode, etc.) */
  apiOptions?: HttpOptions;

  /** Additional Socket.IO options */
  sioOptions?: SocketIOOptions;

  /** Additional WS options */
  wsOptions?: WSOptions;

  /** The initial page after login */
  initialPage?: string;

  /** Firebase configuration (optional) */
  firebaseConfig?: FirebaseConfig;

  /** Logging level */
  logLevel?: LogLevel;
}

export interface PushConfig {
  sio?: { enabled: boolean };
  wss?: { enabled: boolean };
  pusher?: {
    enabled: boolean;
    apiKey: string;
    options: {
      cluster: string;
      forceTLS: boolean;
      userAuthentication?: AuthConfig;
      channelAuthorization?: AuthConfig;
      authEndpoint?: string;
    };
  };
}

export interface AuthConfig {
  endpoint: string;
  transport?: "ajax" | "jsonp";
  params?: Record<string, any>;
  headers?: Record<string, string>;
  includeCredentials?: boolean;
  customHandler?: any;
}

export interface ClientContext {
  entity: string;
  clientAppId: number;
  consumerToken: string;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  mode?: string;
  cache?: string;
  credentials?: string;
}

export interface SocketIOOptions {
  path?: string;
  transports?: string[];
  secure?: boolean;
}

export interface WSOptions {
  protocols?: string[];
  reconnect?: boolean;
}

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// -------------------------------------------------------------
// THEME CONFIG (existing)
// -------------------------------------------------------------

export interface ThemeConfig {
  currentThemePath: string;
  accessibleThemes: string[];
}

export interface ThemeShellConfig {
  /** Path to the currently active theme */
  currentThemePath: string;

  /** List of themes available for selection */
  accessibleThemes: string[];

  /** If true, the end-user may select themes at runtime */
  allowUserSelection?: boolean;

  /** Default theme id, e.g. “dark”, “default”, “contrast” */
  defaultThemeId?: string;

  /**
   * Optional UI-system mapping for advanced UI-system adaptation pipelines.
   * Backward compatible.
   */
  uiSystem?: {
    base: "bootstrap" | "material" | "antd" | "tailwind" | "corpdesk";
    overrideCss?: boolean;
    componentMap?: Record<string, string>;
  };

  /**
   * NEW (Tenant Policy)
   * Tenant may restrict user theme choices.
   */
  lockedThemes?: string[];

  /**
   * NEW (User Personalization)
   * If false, user personalization is disabled even if allowUserSelection = true.
   */
  personalizationEnabled?: boolean;
}

// -------------------------------------------------------------
// UI CONFIG — harmonized with your shellconfig.json
// -------------------------------------------------------------
export interface UiShellConfig {
  // /** e.g. "material-design", "bootstrap-538" */
  // defaultUiSystemId: string;

  // installedUiSystems: UiSystemDescriptor[];

  // /** e.g. "dark" */
  // defaultThemeId: string;

  // /** e.g. "standard", "filled", "outlined" */
  // defaultFormVariant: string;

  // /** Base directory for UI system descriptors */
  // uiSystemBasePath: string;

  // /**
  //  * NEW: tenant locks — restrict which UI systems users may choose.
  //  */
  // lockedUiSystems?: string[];

  // /**
  //  * NEW: user-level personalization control.
  //  */
  // allowUserSelection?: boolean;

  // /**
  //  * NEW: admin-only overrides
  //  */
  // adminOverrideAllowed?: boolean;

  /** e.g. "material-design", "bootstrap-538" */
  defaultUiSystemId?: string;

  /** List of available UI systems for this tenant */
  installedUiSystems: UiSystemDescriptor[];

  /** e.g. "dark" */
  defaultThemeId?: string;

  /** e.g. "standard", "filled", "outlined" */
  defaultFormVariant?: string;

  /** Base directory for UI system descriptors */
  uiSystemBasePath: string;

  /**
   * Tenant locks — restrict which UI systems users may choose.
   */
  lockedUiSystems?: string[];

  /**
   * User-level personalization control.
   * CHANGED: Renamed from allowUserSelection for clarity
   */
  allowUserPersonalization?: boolean;

  /**
   * Admin-only overrides
   */
  adminOverrideAllowed?: boolean;

}

// -------------------------------------------------------------
// FULL SHELL CONFIG — harmonized and non-breaking
// -------------------------------------------------------------
export interface IShellConfig {
  // appName: string;
  // fallbackTitle?: string;
  // appVersion?: string;
  // appDescription?: string;

  // themeConfig?: ThemeShellConfig;

  // /** The default module loaded on startup */
  // defaultModulePath?: string;

  // /** debug | info | warn | error */
  // logLevel?: string;

  // /** UI system preferences */
  // uiConfig?: UiShellConfig;

  // /**
  //  * NEW:
  //  * Marks configs originating from system, consumer, or user level.
  //  */
  // source?: "system" | "consumer" | "user";
  appName: string;
  fallbackTitle?: string;
  appVersion?: string;
  appDescription?: string;

  themeConfig?: ThemeShellConfig;

  /** The default module loaded on startup */
  defaultModulePath?: string;

  /** debug | info | warn | error */
  logLevel?: string;

  /** UI system preferences */
  uiConfig?: UiShellConfig;

  /**
   * NEW: Splash screen configuration
   * ADDED: To match existing data structure in use
   */
  splash?: {
    path?: string;
    enabled?: boolean;
    minDuration?: number;
    [key: string]: any;
  };

  /**
   * NEW: Environment configuration
   * ADDED: To match existing data structure in use
   */
  envConfig?: EnvConfig
  // {
  //   appId?: string;
  //   wsMode?: string;
  //   apiHost?: string;
  //   sioHost?: string;
  //   consumer?: string;
  //   logLevel?: string;
  //   shellHost?: string;
  //   apiOptions?: Record<string, any>;
  //   production?: boolean;
  //   pushConfig?: Record<string, any>;
  //   sioOptions?: Record<string, any>;
  //   wsEndpoint?: string;
  //   apiEndpoint?: string;
  //   clientAppId?: number;
  //   defaultauth?: string;
  //   initialPage?: string;
  //   sioEndpoint?: string;
  //   clientAppGuid?: string;
  //   clientContext?: Record<string, any>;
  //   SOCKET_IO_PORT?: number;
  //   USER_RESOURCES?: string;
  //   mfManifestPath?: string;
  //   [key: string]: any;
  // };
}

export interface IEntityMemberProfile extends IUserProfile {
  entityGuid: string;          // coopGuid, schoolGuid, companyGuid, etc
  entityType: string;          // resolved dynamically by module
  memberMeta?: any;            // module-owned metadata
  roles?: any[];               // module-defined roles
  permissions?: any[];         // optional, module-defined
}

export interface IEntityProfile {
  entityGuid: string;
  entityType: string;
  displayName: string;
  meta?: any;
}

export interface ICdMemberProfile {
  extend(
    req: Request,
    res: Response,
    userProfile: IUserProfile,
    entityGuid: string
  ): Promise<IEntityMemberProfile>;
}

export interface IProfileMutationHandler {
  supports(path: (string | number | string[])[]): boolean;
  handle(
    profile: any,
    update: {
      path: any[];
      value: any;
      action: string;
    }
  ): Promise<any>;
}

export interface IProfileSyncHandler {
  canSync(profile: any): boolean;
  sync(profile: any): any;
}

/**
 * JSON Semantic Delta Protocol (JSDP)
 */

/**
 * JSDP - Semantic Path Query
 * The core of 'Identity-based Pathing'
 */
export interface JPathQuery {
  field: string;         // The unique attribute (e.g., 'consumerName', 'id', 'guid')
  value: any;           // The target value to match
  op?: 'eq' | 'contains'; // Optional: Extensibility for the RFC/Patent
}

export type JPathSegment = string | number | JPathQuery;

/**
 * The JSDP Instruction (The upgrade from JUpdateInstruction)
 */
export interface JSDPInstruction {
  v?: "1.0";              // Protocol versioning for forward-compatibility
  modelField?: string; // name of the json column. Capacity to update multiple json columns in a given row
  path: JPathSegment[];
  value: any;
  action: 'create' | 'update' | 'delete' | 'upsert' | 'read'; 
  conditions?: any;      // Space for 'Logic-gated' updates (R&D focus)
}