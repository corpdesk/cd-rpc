import { BaseService } from "../../../../../sys/base/base.service";
import {
  CdCtx,
  CdModuleDescriptor,
} from "../../../../../sys/dev-descriptor/models/cd-module-descriptor.model";
import { ComponentType } from "../../../../../sys/dev-descriptor/models/component-descriptor.model";

export class CdAiModel {
  getCustomModuleItems(): CdModuleDescriptor {
    const b = new BaseService();
    return {
      ctx: CdCtx.App, // Provide appropriate context if needed
      name: "cd-ai",
      cdModuleType: { typeName: "cd-api" }, // Use the appropriate module type
      description:
        "module for processing ai auto development of corpdesk module at the backend",
      controllers: [
        {
          name: "cd-ai",
          type: ComponentType.Controller,
          methods: [
            {
              name: "PromptQuery",
              isDefault: true,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "Promise<void>",
                description: "Processes an AI prompt and returns a response",
              },
              parameters: [
                { name: "req", type: "Request" },
                { name: "res", type: "Response" },
              ],
              behavior: { isAsync: true, isPure: false, returnsPromise: true },
            },
            {
              name: "CheckTokenBalance",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "Promise<void>",
                description: "Returns the remaining token balance for the user",
              },
              parameters: [
                { name: "req", type: "Request" },
                { name: "res", type: "Response" },
              ],
              behavior: { isAsync: true, isPure: false, returnsPromise: true },
            },
            {
              name: "GetUserProfile",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "Promise<void>",
                description: "Fetches AI user profile details",
              },
              parameters: [
                { name: "req", type: "Request" },
                { name: "res", type: "Response" },
              ],
              behavior: { isAsync: true, isPure: false, returnsPromise: true },
            },
          ],
        },
        {
          name: "cd-ai-usage-logs",
          type: ComponentType.Controller,
          methods: [
            {
              name: "LogUsage",
              isDefault: true,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "Promise<void>",
                description: "Logs an AI request/response usage entry",
              },
              parameters: [
                { name: "req", type: "Request" },
                { name: "res", type: "Response" },
              ],
              behavior: { isAsync: true, isPure: false, returnsPromise: true },
            },
            {
              name: "GetUsageSummary",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "Promise<void>",
                description: "Returns summarized AI usage logs",
              },
              parameters: [
                { name: "req", type: "Request" },
                { name: "res", type: "Response" },
              ],
              behavior: { isAsync: true, isPure: false, returnsPromise: true },
            },
          ],
        },
      ],
      services: [
        {
          name: "cd-ai",
          type: ComponentType.Service,
          methods: [
            {
              name: "promptQuery",
              isDefault: true,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "CdFxReturn<AiResponse>",
                description:
                  "Executes an AI query and returns structured result",
              },
            },
            {
              name: "checkTokenBalance",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "CdFxReturn<TokenStatus>",
                description: "Returns user's token usage status",
              },
            },
            {
              name: "getUserProfile",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "CdFxReturn<UserProfile>",
                description: "Retrieves AI-specific user profile",
              },
            },
          ],
        },
        {
          name: "cd-ai-usage-logs",
          type: ComponentType.Service,
          methods: [
            {
              name: "LogUsage",
              isDefault: true,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "CdFxReturn<null>",
                description: "Records a usage log entry in the database",
              },
            },
            {
              name: "GetUsageSummary",
              isDefault: false,
              scope: { visibility: "public", static: false },
              output: {
                returnType: "CdFxReturn<UsageStats[]>",
                description:
                  "Returns AI usage statistics grouped by time or user",
              },
            },
          ],
        },
      ],
      models: [
        { name: "cd-ai",type: ComponentType.Model, fields: [] },
        { name: "cd-ai-usage-logs", type: ComponentType.Model,fields: [] },
      ],
      projectGuid: b.getGuid(), // Generate or assign a GUID if required
      // contributors: {
      //   vendor: {
      //     name: "emp services ltd",
      //   },
      //   developers: [{ name: "g.oremo", contact: "george.oremo@gmail.com" }],
      // },
    };
  }

  /**
   * Merges the default model with custom models.
   * This method retrieves the default model for a given module and merges it with any custom models defined in the application.
   * @param moduleCtx - The context of the module (e.g., CdCtx.App).
   * @param moduleName - The name of the module to merge.
   * @param moduleType - The type descriptor of the module (e.g., CdModuleTypeDescriptor).
   * @param controllerName - The name of the controller to merge.
   * @returns A promise that resolves to a merged CdModuleDescriptor.
   */
  // async mergedModule(
  //   customModuleData: CdModuleDescriptor
  // ): Promise<CdFxReturn<CdModuleDescriptor>> {
  //   const svCdModuleDescriptor = new CdModuleDescriptorService();
  //   return svCdModuleDescriptor.cdApiModuleData(
  //     moduleName, moduleType, cdToken
  //   );
  // }
}
