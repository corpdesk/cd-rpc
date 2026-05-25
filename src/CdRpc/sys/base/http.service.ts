/**
 * 
 * Usage Guide
 * ***********************************************
//  1. Using Preset Profile (cdApiLocal)
const httpService = new HttpService(true); // Enable debugMode
const postData: ICdRequest;
const result = await httpService.proc(
  postData,
  "cd-api-local", // Optional since it's the default
);

if (result.state) {
  console.log('✅ Modules:', result.data);
} else {
  console.error('❌ Error:', result.message);
}

***************************************************

// 2. Using profile:
const httpService = new HttpService(true); // With debug logs
// Optionally initialize the profile (skipped automatically if `request()` or `proc()` is called)
await httpService.init('deepseek');

const profileName = 'deepseek';

const config: AxiosRequestConfig = {
  method: 'POST',
  url: '/chat/completions',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer #apiKey', // Will be decrypted automatically
  },
  data: {
    model: 'deepseek-chat',
    messages: [
      { role: 'user', content: 'What is the capital of Kenya?' },
    ],
  },
};

// Make the request (profile must exist in your cd-cli profile list)
const response = await httpService.request(config, profileName);

if (response.state) {
  console.log('✅ Response from Deepseek:', response.data);
} else {
  console.error('❌ Error calling Deepseek:', response.message);
}

*************************************************************************
3.

const profileDetails = profile.cdCliProfileData.details;
const result = await httpService.request(profileDetails.httpConfig, 'deepseek');

*******************************************************************************

4. Typical profile with httpConfig

{
  "cdCliProfileName": "deepseek",
  "cdCliProfileData": {
    "details": {
      "apiKey": {
        "name": "apiKey",
        "description": "Encrypted Deepseek API key",
        "value": null,
        "encryptedValue": "<long-encrypted-string>",
        "isEncrypted": true,
        "encryptionMeta": {
          "name": "default",
          "algorithm": "aes-256-cbc",
          "encoding": "hex",
          "ivLength": 16,
          "iv": "<iv-hex>",
          "encryptedAt": "2025-05-25T10:24:35.527Z"
        }
      },
      "baseUrl": "https://api.deepseek.com/v1",
      "defaultModel": "deepseek-chat",
      "cryptFields": ["apiKey"],
      "httpConfig": {
        "method": "POST",
        "url": "/chat/completions",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer #apiKey"
        },
        "data": null
      },
      "encrypted": true
    }
  }
}




 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as https from "https";
import { CdCliProfileController } from "../cd-cli/controllers/cd-cli-profile.cointroller";
import CdLog from "../comm/controllers/cd-logger.controller";
import type { CdFxReturn, ICdRequest, ICdResponse } from "./i-base";
import { IProfileDetails } from "../cd-cli/models/cd-cli-profile.model";
import config from "../../../config";
import CdCliVaultController from "../cd-cli/controllers/cd-cli-vault.controller";
import { inspect } from "util";

export class HttpService {
  private instances: Map<string, AxiosInstance> = new Map();
  ctlCdCliProfile = new CdCliProfileController();
  cdApiAxiosConfig?: AxiosRequestConfig;
  cdToken = "";

  /**
   * Runtime override endpoint.
   *
   * This is typically injected by transport executors
   * such as RpcExecutor, HttpExecutor, QueueExecutor etc.
   *
   * Highest priority endpoint.
   */
  private runtimeEndpoint?: string;

  /**
   * Runtime profile override.
   *
   * Useful for transport executors that may want
   * to dynamically switch transport profiles.
   */
  private runtimeProfileName?: string;

  constructor(private debugMode = false) {
    this.presetConfigs();
  }

  presetConfigs() {
    this.cdApiAxiosConfig = {
      method: "POST",
      url: config.cdApi.endpoint,
      data: null,
    };

    const defaultInstance = axios.create({
      baseURL: config.cdApi.endpoint,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    this.instances.set("cd-api-local", defaultInstance);
    CdLog.info(`Preset Axios instance for profile: cdApiLocal`);
  }

  // async init(profileName = "cd-api-local", endpoint?: string): Promise<boolean> {
  //   const resolvedEndpoint =
  //     endpoint || (await this.resolveEndpointFromProfile(profileName));
  //   if (!resolvedEndpoint) {
  //     CdLog.error(
  //       `HttpService::init()/Preset Axios instance for profile: cdApiLocal`,
  //     );
  //     return false;
  //   }

  //   const axiosInstance = axios.create({
  //     baseURL: resolvedEndpoint,
  //     httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  //   });

  //   this.instances.set(profileName, axiosInstance);
  //   CdLog.info(
  //     `Initialized Axios for profile: ${profileName} (${resolvedEndpoint})`,
  //   );
  //   return true;
  // }
  async init(profileName = "cd-api-local", endpoint?: string): Promise<boolean> {
    /**
     * Runtime endpoint has highest priority.
     */
    const resolvedEndpoint =
      this.runtimeEndpoint ||
      endpoint ||
      (await this.resolveEndpointFromProfile(profileName));

    CdLog.debug(
      `[HttpService][init()] resolvedEndpoint:${inspect(resolvedEndpoint)}`,
    );

    if (!resolvedEndpoint) {
      CdLog.error(`HttpService::init()/Unable to resolve endpoint.`);

      return false;
    }

    const axiosInstance = axios.create({
      baseURL: resolvedEndpoint,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this.instances.set(profileName, axiosInstance);

    CdLog.info(
      `Initialized Axios for profile: ${profileName} (${resolvedEndpoint})`,
    );

    return true;
  }

  /**
   * Dynamically overrides the endpoint used by HttpService.
   *
   * This is primarily intended for transport executors
   * (RpcExecutor, HttpExecutor, QueueExecutor, etc.)
   * which determine the final operational endpoint.
   *
   * Resolution priority:
   *
   * 1. runtime endpoint (this method)
   * 2. explicit init() endpoint
   * 3. profile endpoint
   * 4. preset/default endpoint
   */
  setEndPoint(endpoint: string, profileName = "runtime"): void {
    CdLog.debug(`[HttpService][setEndPoint()] endpoint:${inspect(endpoint)}`);

    this.runtimeEndpoint = endpoint;
    this.runtimeProfileName = profileName;

    const axiosInstance = axios.create({
      baseURL: endpoint,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this.instances.set(profileName, axiosInstance);

    CdLog.info(
      `[HttpService][setEndPoint()] Runtime endpoint registered for profile:${profileName}`,
    );
  }

  /**
   * Clears runtime endpoint override.
   */
  clearEndPoint(): void {
    CdLog.debug("[HttpService][clearEndPoint()]");

    if (this.runtimeProfileName) {
      this.instances.delete(this.runtimeProfileName);
    }

    this.runtimeEndpoint = undefined;
    this.runtimeProfileName = undefined;
  }

  async resolveEndpointFromProfile(
    profileName: string,
  ): Promise<string | null> {
    const result = await this.ctlCdCliProfile.loadProfiles();
    // CdLog.debug(
    //   `HttpService::resolveEndpointFromProfile()/profile:${inspect(result, {
    //     depth: 3,
    //   })}`,
    // );
    if (!result.state || !result.data) {
      CdLog.error(
        `HttpService::resolveEndpointFromProfile()/Unable to load profiles.`,
      );
      return null;
    }

    const profile = result.data.items.find(
      (item: any) => item.cdCliProfileName === profileName,
    );

    CdLog.debug(
      `HttpService::resolveEndpointFromProfile()/profileName:${profileName}`,
    );

    // CdLog.debug(
    //   `HttpService::resolveEndpointFromProfile()/profile:${inspect(profile, {
    //     depth: 2,
    //   })}`,
    // );

    const details: IProfileDetails = profile?.cdCliProfileData?.details || {};
    const endpoint = details.endpoint || details.cdEndpoint;

    CdLog.debug(
      `HttpService::resolveEndpointFromProfile()/details:${inspect(details, {
        depth: 2,
      })}`,
    );

    if (!endpoint) {
      CdLog.error(
        `HttpService::resolveEndpointFromProfile()/Profile '${profileName}' is missing a valid endpoint.`,
      );
      return null;
    }

    return endpoint;
  }

  resolveEndpointFromDetails(details: IProfileDetails): string {
    if (!details.endpoint) {
      throw new Error(
        "HttpService::resolveEndpointFromDetails()/Missing required 'endpoint' in profile details.",
      );
    }
    return details.endpoint;
  }

  async getCdApiUrl(profileName = "cd-api-local"): Promise<string | null> {
    CdLog.debug("HttpService::getCdApiUrl():01");
    const result = await this.ctlCdCliProfile.loadProfiles();
    CdLog.debug("HttpService::getCdApiUrl():02");

    if (!result.state || !result.data) {
      CdLog.error(`HttpService::getCdApiUrl()/Unable to load profiles.`);
      return null;
    }
    CdLog.debug("HttpService::getCdApiUrl():03");
    const profile = result.data.items.find(
      (item: any) => item.cdCliProfileName === profileName,
    );

    const endpoint = profile?.cdCliProfileData?.details?.cdEndpoint;
    if (!endpoint) {
      CdLog.error(
        `HttpService::getCdApiUrl()/Profile '${profileName}' is missing a cdEndpoint.`,
      );
      return null;
    }
    CdLog.debug("HttpService::getCdApiUrl():04");
    return endpoint;
  }

  /**
   * Resolves the operational profile name.
   *
   * If runtime endpoint exists, runtime profile wins.
   */
  private resolveOperationalProfile(profileName?: string): string {
    if (this.runtimeProfileName) {
      return this.runtimeProfileName;
    }

    return profileName || "cd-api-local";
  }

  /**
   * Generic HTTP request
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    profileName = "cd-api-local",
  ): Promise<CdFxReturn<T>> {
    const instance = this.instances.get(profileName);
    if (!instance) {
      return {
        state: false,
        data: null,
        message: `Axios instance for '${profileName}' not initialized.`,
      };
    }

    try {
      if (this.debugMode) {
        CdLog.debug(`HttpService::request()`, config);
      }

      const response = await instance.request<T>(config);

      if (this.debugMode) {
        CdLog.debug("HttpService::response()", {
          status: response.status,
          data: response.data,
        });
      }

      return {
        state: true,
        data: response.data,
        message: "Request succeeded.",
      };
    } catch (e: any) {
      const message =
        e.response?.data?.app_state?.info?.app_msg ||
        e.response?.data ||
        e.message;

      CdLog.error("HttpService::request()/Error", message);

      return {
        state: false,
        data: null,
        message: `HTTP Request Failed: ${inspect(message, { depth: 3 })}`,
      };
    }
  }

  // /**
  //  * Profile-aware proc wrapper with support for httpConfig from profile.details
  //  */

  // async proc(
  //   params: ICdRequest,
  //   profileName = "cd-api-local",
  // ): Promise<CdFxReturn<ICdResponse>> {
  //   if (!this.instances.has(profileName)) {
  //     const initialized = await this.init(profileName);
  //     if (!initialized) {
  //       throw new Error(`Profile '${profileName}' could not be initialized.`);
  //     }
  //   }

  //   const result = await this.ctlCdCliProfile.loadProfiles();

  //   if (!result.state || !result.data) {
  //     throw new Error("Unable to load profiles.");
  //   }

  //   const profile = result.data.items.find(
  //     (item: any) => item.cdCliProfileName === profileName,
  //   );

  //   const details: IProfileDetails = profile?.cdCliProfileData?.details || {};
  //   let config: AxiosRequestConfig;

  //   CdLog.debug(`HttpService::proc()/profileName:${profileName}`);
  //   CdLog.debug(
  //     `HttpService::proc()/profileDetails:${inspect(details, {
  //       depth: 3,
  //     })}`,
  //   );

  //   // 🔐 Decrypt crypt fields (e.g. apiKey) before using them
  //   const decryptedFields = await this.decryptProfileFields(details);

  //   CdLog.debug(
  //     `HttpService::proc()/decryptedFields:${inspect(decryptedFields, {
  //       depth: 3,
  //     })}`,
  //   );

  //   const createCdCliProfile = new CdCliProfileController();
  //   // const ctlSession = new SessonController();
  //   const sidRet =
  //     (await createCdCliProfile.getSessionData()) as CdFxReturn<string>;
  //   this.cdToken = sidRet.data as string;
  //   params.dat.token = this.cdToken;

  //   if (details.httpConfig) {
  //     config = JSON.parse(JSON.stringify(details.httpConfig));
  //     config.data = params;

  //     // 🔁 Replace placeholders like #apiKey in all headers
  //     if (config.headers && typeof config.headers === "object") {
  //       for (const [key, val] of Object.entries(config.headers)) {
  //         if (typeof val === "string") {
  //           config.headers[key] = val.replace(
  //             /#(\w+)/g,
  //             (_, token) => decryptedFields[token] || "",
  //           );
  //         }
  //       }
  //     }
  //   } else {
  //     if (!this.cdApiAxiosConfig) {
  //       throw new Error("cdApiAxiosConfig is not initialized.");
  //     }
  //     config = { ...this.cdApiAxiosConfig, data: params };
  //   }

  //   CdLog.debug(`HttpService::proc()/params:${inspect(params, { depth: 5 })}`);
  //   return this.request<ICdResponse>(config, profileName);
  // }
  /**
   * Profile-aware proc wrapper with support for:
   *
   * 1. Runtime executor endpoint injection via setEndPoint()
   * 2. Profile-based endpoint resolution
   * 3. httpConfig usage from profile.details
   * 4. Dynamic token injection
   * 5. Crypt field decryption
   * 6. Backward compatibility with existing cd-api-local usage
   *
   * Resolution Priority:
   *
   * 1. Runtime endpoint (setEndPoint())
   * 2. Profile endpoint
   * 3. Preset/default endpoint
   *
   * Notes:
   * ------
   * - Runtime endpoint mode is primarily used by transport executors
   *   such as RpcExecutor, HttpExecutor, QueueExecutor, etc.
   *
   * - In runtime endpoint mode:
   *    - profile loading becomes optional
   *    - endpoint already exists
   *    - request executes directly using injected transport endpoint
   *
   * - In profile mode:
   *    - profiles are loaded
   *    - endpoint/config resolved dynamically
   *    - crypt fields decrypted
   */
  async proc(
    params: ICdRequest,
    profileName = "cd-api-local",
  ): Promise<CdFxReturn<ICdResponse>> {
    CdLog.debug("[HttpService][proc()] 01");

    /**
     * -------------------------------------------------------
     * Resolve operational profile
     * -------------------------------------------------------
     *
     * If runtime endpoint exists, runtime profile wins.
     */
    profileName = this.resolveOperationalProfile(profileName);

    CdLog.debug(`[HttpService][proc()] operationalProfile:${profileName}`);

    /**
     * -------------------------------------------------------
     * Ensure Axios instance exists
     * -------------------------------------------------------
     */
    if (!this.instances.has(profileName)) {
      CdLog.debug(
        `[HttpService][proc()] Axios instance missing. Initializing profile:${profileName}`,
      );

      const initialized = await this.init(profileName);

      if (!initialized) {
        CdLog.error(
          `[HttpService][proc()] Failed to initialize profile:${profileName}`,
        );

        throw new Error(`Profile '${profileName}' could not be initialized.`);
      }
    }

    /**
     * -------------------------------------------------------
     * Runtime endpoint mode detection
     * -------------------------------------------------------
     *
     * If runtime endpoint exists:
     * - skip profile loading
     * - skip endpoint resolution
     *
     * Executor already determined transport destination.
     */
    const isRuntimeMode = !!this.runtimeEndpoint;

    CdLog.debug(`[HttpService][proc()] isRuntimeMode:${isRuntimeMode}`);

    /**
     * -------------------------------------------------------
     * Profile details container
     * -------------------------------------------------------
     */
    let details: IProfileDetails = {};

    /**
     * -------------------------------------------------------
     * Load profile only when NOT in runtime mode
     * -------------------------------------------------------
     */
    if (!isRuntimeMode) {
      CdLog.debug("[HttpService][proc()] Loading profile details...");

      const result = await this.ctlCdCliProfile.loadProfiles();

      if (!result.state || !result.data) {
        CdLog.error("[HttpService][proc()] Unable to load profiles.");

        throw new Error("Unable to load profiles.");
      }

      const profile = result.data.items.find(
        (item: any) => item.cdCliProfileName === profileName,
      );

      if (!profile) {
        CdLog.error(`[HttpService][proc()] Profile not found:${profileName}`);

        throw new Error(`Profile '${profileName}' not found.`);
      }

      details = profile?.cdCliProfileData?.details || {};

      CdLog.debug(
        `[HttpService][proc()] profileDetails:${inspect(details, {
          depth: 5,
        })}`,
      );
    } else {
      /**
       * Runtime mode:
       * endpoint already injected by executor.
       */

      CdLog.debug(`[HttpService][proc()] Runtime endpoint mode enabled.`);

      CdLog.debug(
        `[HttpService][proc()] runtimeEndpoint:${inspect(this.runtimeEndpoint)}`,
      );
    }

    /**
     * -------------------------------------------------------
     * Decrypt profile fields
     * -------------------------------------------------------
     *
     * Runtime mode may not have encrypted fields.
     */
    const decryptedFields = await this.decryptProfileFields(details);

    CdLog.debug(
      `[HttpService][proc()] decryptedFields:${inspect(decryptedFields, {
        depth: 3,
      })}`,
    );

    /**
     * -------------------------------------------------------
     * Resolve session token
     * -------------------------------------------------------
     */
    try {
      CdLog.debug("[HttpService][proc()] Resolving session token...");

      const createCdCliProfile = new CdCliProfileController();

      const sidRet = await createCdCliProfile.getSessionData();

      this.cdToken = sidRet.data as string;

      /**
       * Ensure dat exists before token injection.
       */
      if (!params.dat) {
        params.dat = {} as any;
      }

      params.dat.token = this.cdToken;

      CdLog.debug(`[HttpService][proc()] token injected.`);
    } catch (e) {
      CdLog.error(
        `[HttpService][proc()] Failed to resolve session token:${(e as Error).message}`,
      );
    }

    /**
     * -------------------------------------------------------
     * Build Axios request config
     * -------------------------------------------------------
     */
    let axiosConfig: AxiosRequestConfig;

    /**
     * -------------------------------------------------------
     * Use profile-defined httpConfig when available
     * -------------------------------------------------------
     */
    if (details.httpConfig) {
      CdLog.debug("[HttpService][proc()] Using profile httpConfig.");

      if(isRuntimeMode) {
        CdLog.warning(
          `[HttpService][proc()] Profile httpConfig is being used in runtime endpoint mode. Ensure this is intentional.`,
        );
        details.httpConfig.url = this.runtimeEndpoint || details.httpConfig.url;
      }

      /**
       * Deep clone to avoid mutating source profile.
       */
      axiosConfig = JSON.parse(JSON.stringify(details.httpConfig));

      /**
       * Inject request payload.
       */
      axiosConfig.data = params;

      /**
       * ---------------------------------------------------
       * Replace encrypted placeholders
       * ---------------------------------------------------
       *
       * Example:
       * Authorization: Bearer #apiKey
       */
      if (axiosConfig.headers && typeof axiosConfig.headers === "object") {
        for (const [key, val] of Object.entries(axiosConfig.headers)) {
          if (typeof val === "string") {
            axiosConfig.headers[key] = val.replace(
              /#(\w+)/g,
              (_, token) => decryptedFields[token] || "",
            );
          }
        }
      }
    } else {
      /**
       * ---------------------------------------------------
       * Fallback to preset config
       * ---------------------------------------------------
       */

      CdLog.debug("[HttpService][proc()] Using preset cdApiAxiosConfig.");

      if (!this.cdApiAxiosConfig) {
        CdLog.error("[HttpService][proc()] cdApiAxiosConfig missing.");

        throw new Error("cdApiAxiosConfig is not initialized.");
      }

      axiosConfig = {
        ...this.cdApiAxiosConfig,
        data: params,
      };
    }

    /**
     * -------------------------------------------------------
     * Debug outgoing request
     * -------------------------------------------------------
     */
    CdLog.debug(
      `[HttpService][proc()] finalAxiosConfig:${inspect(axiosConfig, {
        depth: 5,
      })}`,
    );

    CdLog.debug(
      `[HttpService][proc()] finalParams:${inspect(params, {
        depth: 5,
      })}`,
    );

    /**
     * -------------------------------------------------------
     * Execute request
     * -------------------------------------------------------
     */
    const response = await this.request<ICdResponse>(axiosConfig, profileName);

    /**
     * -------------------------------------------------------
     * Final response debug
     * -------------------------------------------------------
     */
    CdLog.debug(
      `[HttpService][proc()] response:${inspect(response, {
        depth: 5,
      })}`,
    );

    return response;
  }

  private async decryptProfileFields(
    details: IProfileDetails,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    if (!details.cryptFields || !Array.isArray(details.cryptFields)) {
      return result;
    }

    for (const fieldName of details.cryptFields) {
      const field = details[fieldName];

      if (field?.isEncrypted && field.encryptedValue && field.encryptionMeta) {
        try {
          const decryptedValue = await CdCliVaultController.decrypt(
            field.encryptionMeta,
            field.encryptedValue,
          );
          result[fieldName] = decryptedValue ?? "";
        } catch (e) {
          CdLog.error(
            `Failed to decrypt field '${fieldName}':${(e as Error).message}`,
          );
          result[fieldName] = ""; // Fail silently with empty string
        }
      } else if (typeof field?.value === "string") {
        result[fieldName] = field.value;
      }
    }

    return result;
  }

  // private resolveVaultPlaceholders(obj: any, vault: Record<string, string>): any {
  //   if (!obj || typeof obj !== 'object') return obj;

  //   const clone = JSON.parse(JSON.stringify(obj));

  //   const resolve = (value: any): any => {
  //     if (typeof value === 'string') {
  //       return value.replace(/#cdVault\['(.+?)'\]/g, (_, key) => {
  //         return vault[key] ?? '';
  //       });
  //     }

  //     if (Array.isArray(value)) {
  //       return value.map(resolve);
  //     }

  //     if (typeof value === 'object' && value !== null) {
  //       Object.keys(value).forEach((k) => {
  //         value[k] = resolve(value[k]);
  //       });
  //     }

  //     return value;
  //   };

  //   return resolve(clone);
  // }
}
