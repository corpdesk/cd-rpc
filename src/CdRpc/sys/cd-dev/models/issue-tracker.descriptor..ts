import type {
  CdAppDescriptor,
  DependencyDescriptor,
} from "./cd-dev-descriptor.model";
import { AppType } from "./cd-dev-descriptor.model";
import { dependencies, getDependencyByName } from "./dependancy.model";
import { defaultOs, getOsByName, operatingSystems } from "./oses.model";
import {
  defaultWorkstation,
  getWorkstationByName,
  workstations,
} from "./workstations.model";

// export const issueTrackingAppDescriptor: CdAppDescriptor = {
//   $schema: "https://example.com/schemas/issue-tracking-index.json", // Optional schema for future use
//   name: "IssueTracker",
//   typeName: [AppType.Frontend, AppType.Api, AppType.Cli], // Corpdesk is a hybrid of these types
//   developmentEnvironment: {
//     workstation:
//       getWorkstationByName("emp-12", workstations) || defaultWorkstation,
//     dependencies: getDependencyByName([], []), // npm, pnpm, package.json reference
//     services: getServiceByName(), // mysql, push-services, repo
//   },
//   runtimeEnvironment: {
//     // language: getLanguageByName('javascript', languages),
//     os: getOsByName("ubuntu.22.04", operatingSystems) || defaultOs,
//     dependencies: getDependencyByName(
//       ["express", "angular", "npm"],
//       dependencies
//     ),
//     services: getServiceByName([""]),
//   },
//   modules: [
//     {
//       name: "UserManagement",
//       description: "Handles user accounts, roles, and permissions.",
//       // dependencies: [{ type: 'module', name: 'Authentication' }],
//       controllers: [
//         {
//           name: "UserController",
//           module: "UserManagement",
//           actions: [
//             {
//               name: "createUser",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/users",
//                 method: "POST",
//               },
//               parameters: [{ name: "userData", type: "UserDto" }],
//               output: {
//                 returnType: "User",
//               },
//             },
//             {
//               name: "getUser",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/users/:id",
//                 method: "GET",
//               },
//               parameters: [{ name: "id", type: "string" }],
//               output: {
//                 returnType: "User",
//               },
//             },
//           ],
//         },
//       ],
//       language: {},
//       models: [],
//       services: [],
//     },
//     {
//       name: "ProjectManagement",
//       description: "Manages projects and their settings.",
//       controllers: [
//         {
//           name: "ProjectController",
//           module: "ProjectManagement",
//           actions: [
//             {
//               name: "createProject",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/projects",
//                 method: "POST",
//               },
//               parameters: [{ name: "projectData", type: "ProjectDto" }],
//               output: {
//                 returnType: "Project",
//               },
//             },
//             {
//               name: "listProjects",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/projects",
//                 method: "GET",
//               },
//               output: {
//                 returnType: "Project[]",
//               },
//             },
//           ],
//         },
//       ],
//       language: {},
//       models: [],
//       services: [],
//     },
//     {
//       name: "IssueTracking",
//       description: "Handles the creation and management of issues.",
//       controllers: [
//         {
//           name: "IssueController",
//           module: "IssueTracking",
//           actions: [
//             {
//               name: "createIssue",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/issues",
//                 method: "POST",
//               },
//               parameters: [{ name: "issueData", type: "IssueDto" }],
//               output: {
//                 returnType: "Issue",
//               },
//             },
//             {
//               name: "getIssue",
//               type: "method",
//               scope: { visibility: "public", static: false },
//               apiInfo: {
//                 route: "/issues/:id",
//                 method: "GET",
//               },
//               parameters: [{ name: "id", type: "string" }],
//               output: {
//                 returnType: "Issue",
//               },
//             },
//           ],
//         },
//       ],
//       language: {},
//       models: [],
//       services: [],
//     },
//   ],
// };

// export function parseDependencies(
//   packageJsonPath: string,
//   context: string = "node.js"
// ): DependencyDescriptor[] {
//   // Read the package.json file
//   const rawData = fs.readFileSync(packageJsonPath, "utf8");
//   const packageJson = JSON.parse(rawData);

//   // Helper to map dependencies into DependencyDescriptor format
//   const mapDependencies = (
//     dependencies: Record<string, string> | undefined,
//     type: "runtime" | "development" | "peer" | "optional"
//   ): DependencyDescriptor[] => {
//     if (!dependencies) return [];

//     return Object.entries(dependencies).map(([name, version]) => ({
//       name,
//       version,
//       category: "library", // Default to 'library', can be modified based on more detailed logic
//       type,
//       source: "npm", // Default for Node.js projects
//       scope: "module", // Default for Node.js projects
//       resolution: {
//         method: "import", // Default to 'import' for JavaScript/TypeScript
//       },
//       usage: {
//         context: context === "node.js" ? "service" : "other", // Adjust based on environment
//       },
//       platformCompatibility: {
//         languages: [context], // Assume context (e.g., "node.js") as the language
//       },
//       lifecycle: {
//         loadTime: "startup",
//         updates: "manual",
//       },
//       security: {
//         isTrusted: true, // Assume trusted as default
//       },
//       metadata: {
//         license: packageJson.license,
//       },
//     }));
//   };

//   // Extract dependencies and map them
//   const runtimeDependencies = mapDependencies(
//     packageJson.dependencies,
//     "runtime"
//   );
//   const devDependencies = mapDependencies(
//     packageJson.devDependencies,
//     "development"
//   );

//   // Combine all descriptors
//   return [...runtimeDependencies, ...devDependencies];
// }
// import type { ServiceDescriptor } from "./cd-dev-descriptor.model";

// function getServiceByName(names: string[] = []): ServiceDescriptor[] {
//   // Return an empty array or implement logic to fetch services by name
//   return [];
// }
