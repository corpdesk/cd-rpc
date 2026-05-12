export interface CdAppDescriptor {
  $schema?: string; // Optional schema URL for future use. For now versioning will be managed by the host package.json of cd-cli
  name: string; // Name of the application
  typeName: AppType | AppType[];
  projectGuid?: string;
  parentProjectGuid: string;
  modules: CdModuleDescriptor[]; // Array of module descriptors
  developmentEnvironment?: DevelopmentEnvironmentDescriptor; // Development environment settings
  runtimeEnvironment?: RuntimeEnvironmentDescriptor; // Runtime environment settings
  cdCi?: CiCdDescriptor; // Coninous Integration / Continous Delivery // getCiCd(names: string[],cIcDs: CiCdDescriptor[],)
}

export enum AppType {
  Frontend = 'frontend', // User-facing web or app interfaces
  Api = 'api', // Backend APIs
  PushServer = 'push-server', // Services for push notifications
  Cli = 'cli', // Command-line interfaces
  Pwa = 'pwa', // Progressive Web Apps
  DesktopPwa = 'desktop-pwa', // PWAs optimized for desktop
  Mobile = 'mobile', // General mobile apps
  MobileHybrid = 'mobile-hybrid', // Hybrid apps using shared codebases
  MobileNative = 'mobile-native', // Fully native mobile apps
  Desktop = 'desktop', // Desktop applications
  Iot = 'iot', // Internet of Things services/devices
  Game = 'game', // Game applications
  Embedded = 'embedded', // Embedded systems or firmware
  Robotics = 'robotics', // Robotics and mechatronics
  Plugin = 'plugin', // Plugins or extensions
  Microservice = 'microservice', // Small, modular backend services
}

export interface CdModuleDescriptor {
  name: string;
  description: string;
  projectGuid: string;
  parentProjectGuid?: string;
  language: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  license: LicenseDescriptor; // License details // getLicenseByName(name: string,licenses: LicenseDescriptor[],)
  contributors: ContributorDescriptor; // Vendors, developers, and communities // getContributorsByNames(names: string[],contributors: ContributorDescriptor,)
  controllers: CdControllerDescriptor[]; // List of controllers
  models: CdModelDescriptor[]; // List of models
  services: CdServiceDescriptor[]; // List of services
  developmentEnvironment?: DevelopmentEnvironmentDescriptor; // Development environment settings
  runtimeEnvironment?: RuntimeEnvironmentDescriptor; // Runtime environment settings
  cdCi?: CiCdDescriptor; // Continuous Integration/Continuous Delivery
  versionControl?: VersionControlDescriptor; // Version control details
}

export interface CiCdDescriptor {
  pipeline: {
    name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
    type: 'integration' | 'delivery' | 'deployment'; // Type of pipeline
    stages: {
      name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
      description?: string; // Description of the stage
      tasks: {
        name: string; // Name of the task (e.g., "Run Unit Tests", "Install Dependencies")
        type: 'build' | 'test' | 'deploy' | 'notification' | 'custom'; // Type of task
        executor: 'script' | 'docker' | 'runner' | 'custom'; // Task executor
        status?: 'pending' | 'running' | 'success' | 'failed'; // Current status of the task
        duration?: string; // Duration of the task (e.g., "2m 30s")
        logs?: string[]; // Logs generated during the task
      }[];
    }[];
  };

  triggers: {
    type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'other'; // Trigger type
    schedule?: string; // Cron-like schedule (e.g., "0 0 * * *")
    branchFilters?: string[]; // Branches that trigger the pipeline
    conditions?: {
      includeTags: boolean; // Whether to include tags in triggers
      excludeBranches?: string[]; // Branches to exclude
    };
  };

  environment: {
    name: string; // Name of the environment (e.g., "staging", "production")
    url: string; // Environment URL
    type: 'staging' | 'production' | 'testing' | 'custom'; // Environment type
    deploymentStrategy: 'blue-green' | 'canary' | 'rolling' | 'recreate'; // Deployment strategy
  };

  notifications?: {
    channels: {
      name: string; // Name of the channel (e.g., "Slack", "Email")
      type: 'slack' | 'email' | 'webhook' | 'custom'; // Notification channel type
      recipients?: string[]; // List of recipients
      messageFormat?: 'text' | 'json'; // Format of the message
    }[];
    onEvents: ('success' | 'failure' | 'start' | 'end')[]; // Events that trigger notifications
  };

  metadata?: {
    createdBy?: string; // Person or team who created the pipeline
    lastModified?: string; // Last modification date
    version?: string; // Version of the pipeline configuration
    repository?: string; // Associated repository
  };
}

export interface VersionControlDescriptor {
  repository: {
    name: string; // Name of the repository (e.g., "cd-api")
    url: string; // URL of the repository
    type: 'git' | 'svn' | 'mercurial' | 'other'; // Type of version control system
    remote?: string; // Default remote name (e.g., "origin")
    description?: string; // Brief description of the repository
  };

  branch: {
    name: string; // Name of the branch (e.g., "main", "develop")
    type: 'main' | 'feature' | 'hotfix' | 'release' | 'custom'; // Type of branch
    lastCommit?: {
      hash: string; // Commit hash (e.g., "abc123")
      author: string; // Author of the commit
      date: string; // Date of the commit
      message: string; // Commit message
    };
    protection?: {
      isProtected: boolean; // Whether the branch is protected
      rules?: string[]; // Protection rules (e.g., "require pull request")
    };
  };

  workflow: {
    strategy: 'trunk-based' | 'gitflow' | 'forking' | 'other'; // Version control workflow strategy
    mergeMethod: 'merge' | 'rebase' | 'squash'; // Preferred merge method
    policies?: {
      reviewRequired: boolean; // Whether reviews are mandatory for merging
      ciChecksRequired: boolean; // Whether CI checks are required
    };
  };

  contributors?: {
    name: string; // Contributor's name
    email: string; // Contributor's email
    role: 'owner' | 'maintainer' | 'contributor' | 'reviewer'; // Role in the repository
  }[];

  tags?: {
    name: string; // Tag name (e.g., "v1.0.0")
    commitHash: string; // Hash of the commit the tag points to
    description?: string; // Description of the tag
    date?: string; // Date of tagging
  }[];

  metadata?: {
    creationDate?: string; // Date the repository was created
    lastUpdated?: string; // Date of the last update
    license?: string; // License of the repository (e.g., "MIT")
    repositorySize?: string; // Human-readable size of the repository (e.g., "20 MB")
    language?: string; // Primary programming language of the repository
  };
}

export interface RepoDescriptor {
  url: string; // Repository URL
  defaultBranch: string; // Branch name
  enabled: boolean; // could be an array. Some could be enabled or disabled. Auto development will syc the enabled ones
  isPrivate: boolean;
  service: ServiceDescriptor;
}

export interface WorkstationDescriptor {
  id: string; // Unique identifier for the workstation
  name: string; // Descriptive name of the workstation
  type: 'local' | 'remote'; // Indicates if the workstation is local or remote
  os: OperatingSystemDescriptor; // Details of the operating system
  path: string;
  timezone: string;
  enabled?: boolean;
  requiredSoftware: DependencyDescriptor[]; // List of installed software
  network: {
    hostname: string; // Hostname of the workstation
    ipAddresses: string[]; // List of IP addresses
  };
  hardware: {
    cpu: {
      model: string; // CPU model (e.g., "Intel Core i7-12700K")
      cores: number; // Number of CPU cores
      threads: number; // Number of CPU threads
    };
    memory: {
      total: number; // Total memory in MB
      used?: number; // Optional: Memory currently in use in MB
    };
    storage: {
      total: number; // Total storage in MB
      used?: number; // Optional: Storage currently in use in MB
    };
    gpu?: {
      model: string; // Optional: GPU model (e.g., "NVIDIA RTX 3080")
      memory: number; // GPU memory in MB
    };
  };

  sshCredentials?: {
    username: string; // SSH username (for remote workstations)
    host: string; // SSH host address (e.g., "192.168.1.100")
    port: number; // SSH port (default: 22)
    privateKey?: string; // Optional: Path or content of the SSH private key
    password?: string; // Optional: Password for SSH authentication
  };

  capabilities: {
    canBuild: boolean; // Indicates if the workstation can build software
    canTest: boolean; // Indicates if the workstation can run tests
    canDeploy: boolean; // Indicates if the workstation can deploy software
  };

  lastActive?: Date; // Optional: Timestamp of the last activity
  isOnline: boolean; // Indicates if the workstation is currently online
  //     accessControl?: {
  //       roles?: {
  //         name: string; // Role
  //         permissions: string[]; // Permissions
  //       }[];
  //     };
  //     fileReferences?: FileReference[];
  //   };
  //   environmentVariables?: Record<string, string>; // Runtime environment variables
  //   logging?: {
  //     level: 'debug' | 'info' | 'warn' | 'error'; // Logging level
  //     format?: 'json' | 'text'; // Log format
  //     destination?: string; // Log destination (e.g., "CloudWatch")
  //   };
}

export interface LanguageDescriptor {
  name: string; // Name of the language
  version: string; // Current version
  releaseDate?: string; // Release date of the current or first version
  type: 'interpreted' | 'compiled' | 'hybrid'; // Type of language

  ecosystem: {
    defaultPackageManager?: string; // Primary package manager
    frameworks?: string[]; // List of popular frameworks/libraries
    community?: {
      size?: number; // Estimated community size
      forums?: string[]; // URLs to forums or resources
    };
  };

  paradigms: {
    supportsOOP: boolean; // Supports Object-Oriented Programming
    supportsFunctional: boolean; // Supports Functional Programming
    supportsProcedural: boolean; // Supports Procedural Programming
  };

  tooling: {
    buildTools?: string[]; // Common build tools
    testingFrameworks?: string[]; // Testing frameworks
    linters?: string[]; // Linters for code quality
    debuggers?: string[]; // Debugging tools
  };

  features: {
    staticTyping: boolean; // Static typing support
    dynamicTyping: boolean; // Dynamic typing support
    memoryManagement: 'garbageCollection' | 'manual' | 'other'; // Memory management type
    platformSupport: string[]; // Supported platforms (e.g., server, mobile, etc.)
    interoperability?: string[]; // Supported languages/runtimes for interop
  };

  miscellaneous: {
    documentationStyle?: string; // Preferred documentation tool or style
    fileExtensions?: string[]; // File extensions associated with the language
    useCases?: string[]; // Typical use cases for the language
  };
}

export interface CdModuleTypeDescriptor {
  typeName:
    | 'frontend'
    | 'api'
    | 'push-server'
    | 'cli'
    | 'pwa'
    | 'mobile'
    | 'mechatronic';
}

export interface CdControllerDescriptor {
  name: string; // The name of the controller
  module: string; // The module to which this controller belongs
  description?: string; // Brief explanation of the controller's purpose
  parent?: string; // Parent controller (if part of a hierarchical structure)
  dependencies?: DependencyDescriptor[]; // Other controllers or services this controller depends on
  actions: FunctionDescriptor[]; // Array of actions represented as FunctionDescriptors
}

export interface FunctionDescriptor {
  name: string; // Name of the function/method
  type: 'function' | 'method' | 'constructor' | 'getter' | 'setter'; // Type of the function
  description?: string; // Brief description of the function
  scope: {
    visibility: 'public' | 'private' | 'protected' | 'package-private'; // Access level
    static: boolean; // Indicates if the function is static
  };

  parameters?: {
    name: string; // Parameter name
    type: string; // Data type of the parameter
    optional?: boolean; // Indicates if the parameter is optional
    defaultValue?: any; // Default value of the parameter if applicable
  }[];

  output?: {
    returnType: string; // Data type of the return value
    description?: string; // Explanation of the return value
  };

  typeInfo?: {
    genericTypes?: string[]; // List of generic types, if any
  };

  behavior?: {
    isPure: boolean; // If the function is pure
    isAsync: boolean; // If the function is asynchronous
    throws?: string[]; // List of exceptions or errors the function might throw
  };

  annotations?: string[]; // Metadata or decorators, such as HTTP method or route for API controllers

  apiInfo?: {
    route?: string; // API route or URL path for this function
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // HTTP method for API controllers
    callsService?: string; // Name of the service method this action calls
  };

  documentation?: {
    examples?: string[]; // Usage examples
    notes?: string; // Additional notes or caveats
  };

  miscellaneous?: {
    overload?: FunctionDescriptor[]; // List of alternative function signatures
    tags?: string[]; // Tags or categories
  };
}

export interface CdServiceDescriptor {
  name: string; // The name of the service
  module: string; // The module to which this service belongs
  description?: string; // Brief explanation of the service's purpose
  parent?: string; // Parent service (if part of a hierarchical structure)
  dependencies?: DependencyDescriptor[]; // Other services or external systems this service depends on

  methods: {
    name: string; // Name of the method
    parameters?: {
      name: string; // Parameter name
      type: string; // Data type of the parameter
      optional?: boolean; // Indicates if the parameter is optional
      defaultValue?: any; // Default value for the parameter
    }[];
    returnType?: string; // Return type of the method
    callsModel?: string; // Name of the model method this service method interacts with
    description?: string; // Additional details about the method
  }[];
}

export interface CdModelDescriptor {
  name: string; // The name of the model
  module: string; // The module to which this model belongs
  description?: string; // Brief explanation of the model's purpose
  parent?: string; // Parent model (if part of a hierarchical structure)
  dependencies?: DependencyDescriptor[]; // Other models this model is related to
  relationships?: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'; // Relationship type
    relatedModel: string; // Name of the related model
    foreignKey?: string; // Key used for the relationship
  }[];

  fields: {
    name: string; // Field name
    type: string; // Data type of the field
    required: boolean; // Indicates if the field is mandatory
    defaultValue?: any; // Default value for the field
    unique?: boolean; // Indicates if the field value must be unique
    validation?: {
      pattern?: string; // Regex pattern for validation
      maxLength?: number; // Maximum length of the field
      minLength?: number; // Minimum length of the field
      custom?: string; // Custom validation logic or reference
    };
  }[];

  ormMapping?: {
    tableName: string; // Physical table or collection name in the database
    primaryKey: string; // Primary key field
    indexes?: string[]; // List of indexed fields
    uniqueConstraints?: string[]; // List of fields with unique constraints
    ormOptions?: {
      cascade?: boolean; // Enable cascading operations
      eagerLoading?: boolean; // Enable eager loading of relationships
      discriminatorColumn?: string; // Column used for inheritance in the table
    };
  };
}

export interface DependencyDescriptor {
  name: string; // Name of the dependency (e.g., "express", "gorm", "stdio.h")
  version?: string; // Version or range (e.g., "^4.17.1", "1.0.0", or "default for headers")
  category: 'library' | 'tool' | 'framework' | 'header' | 'core' | 'custom'; // Categorization of the dependency
  type: 'runtime' | 'development' | 'peer' | 'optional'; // Usage type of the dependency
  source:
    | 'npm'
    | 'cdn'
    | 'local'
    | 'custom'
    | 'external'
    | 'system'
    | 'repository'; // Source or origin of the dependency
  scope: 'global' | 'module' | 'local'; // Scope of usage

  resolution?: {
    method:
      | 'import'
      | 'require'
      | 'include'
      | 'header'
      | 'new'
      | 'DI'
      | 'cli'
      | 'other'; // How the dependency is resolved
    path?: string; // Path to the dependency, if applicable
    alias?: string; // Alias name for the dependency (e.g., "import express as e")
  };
  usage?: {
    context?:
      | 'service'
      | 'controller'
      | 'model'
      | 'utility'
      | 'api'
      | 'cli'
      | 'test'
      | 'editor'
      | 'core'
      | 'other'; // Context where the dependency is used
    functionsUsed?: string[]; // Specific functions used from the dependency
    classesUsed?: string[]; // Specific classes instantiated from the dependency
    modulesUsed?: string[]; // For modular environments (e.g., Go or Python modules)
  };

  configuration?: {
    environmentVariables?: Record<string, string>; // Environment variables required
    customSettings?: Record<string, any>; // Custom configuration settings
  };

  platformCompatibility?: {
    languages?: string[]; // Languages supported (e.g., ["Node.js", "Go", "C++"])
    os?: string[]; // Compatible operating systems (e.g., ["Linux", "Windows", "macOS"])
    architectures?: string[]; // Supported architectures (e.g., ["x86_64", "arm64"])
  };

  lifecycle?: {
    loadTime: 'startup' | 'lazy' | 'manual'; // When the dependency is loaded
    updates: 'manual' | 'automatic'; // How updates to the dependency are managed
  };

  conflicts?: {
    with: string[]; // List of other dependencies that may conflict
    resolutionStrategy?: 'override' | 'merge' | 'exclude'; // Strategy to resolve conflicts
  };

  security?: {
    isTrusted: boolean; // Whether the dependency is from a trusted source
    vulnerabilities?: string[]; // Known vulnerabilities or advisories
  };

  metadata?: {
    description?: string; // Description of the dependency
    repository?: string; // URL to the repository or source code
    license?: string; // Licensing information
    documentationUrl?: string; // URL to the official documentation
  };

  fileReferences?: FileReference[]; // Associated files for configuration or setup
}

export interface UtilityConfig {
  loadBalancer?: {
    enabled: boolean; // Whether load balancer is enabled
    type?: string; // Load balancer type (e.g., nginx)
  };
  dataStore?: DataStoreDescriptor[];
  fileStore?: FileStoreDescriptor[];
  webService?: WebServiceDescriptor;
  containerManager?: {
    type: string; // Container manager type (e.g., docker)
    composeFile?: string; // Path to the compose file
  };
  cloudVisualizer?: {
    enabled: boolean; // Whether cloud visualizer is enabled
    tool?: string; // Visualizer tool name (e.g., Cloud-Brix)
  };
  diagnosticTool?: {
    enabled: boolean; // Whether diagnostic tools are enabled
    commands?: string[]; // List of diagnostic commands
  };
}

export interface DataStoreDescriptor {
  name: string; // Unique identifier for the data store
  type:
    | 'relational'
    | 'nosql'
    | 'object-storage'
    | 'file-system'
    | 'in-memory'
    | 'distributed'; // Type of data store
  version?: string; // Version of the data store system (e.g., "PostgreSQL 14.1", "Redis 6.2")

  developmentEnvironment?: DevelopmentEnvironmentDescriptor;
  runtimeEnvironment?: RuntimeEnvironmentDescriptor;

  schema?: {
    database?: string; // Name of the database/schema (for relational databases)
    tableMappings?: Record<string, string>; // Mapping of logical table names to physical table names
    collections?: string[]; // List of collections (for NoSQL databases)
    buckets?: string[]; // List of buckets (for object storage)
  };

  replication?: {
    enabled: boolean; // Whether replication is enabled
    type?: 'master-slave' | 'multi-master' | 'sharded' | 'custom'; // Type of replication
    replicas?: {
      host: string; // Host of the replica
      port?: number; // Port of the replica
    }[];
  };

  backup?: {
    enabled: boolean; // Whether backups are enabled
    schedule?: string; // Cron-like schedule for backups (e.g., "0 3 * * *" for daily at 3 AM)
    retention?: string; // Retention policy for backups (e.g., "30d" for 30 days)
    location?: string; // Path or URL where backups are stored
  };

  storage?: {
    maxSize?: string; // Maximum storage size (e.g., "100GB")
    autoScaling?: boolean; // Whether storage can auto-scale
    storageClass?: 'standard' | 'reduced-redundancy' | 'archive'; // Storage class (for object storage)
  };

  performance?: {
    maxConnections?: number; // Maximum number of connections allowed
    cache?: {
      enabled: boolean; // Whether caching is enabled
      type?: 'in-memory' | 'distributed'; // Type of cache
      size?: string; // Cache size (e.g., "10GB")
    };
    indexing?: {
      enabled: boolean; // Whether indexing is enabled
      fields?: string[]; // List of fields to index
    };
  };

  metadata?: {
    description?: string; // Description of the data store
    owner?: string; // Owner or administrator of the data store
    tags?: string[]; // Tags for categorization
    createdAt?: string; // Creation timestamp
    lastModified?: string; // Last modification timestamp
  };
}

export interface DevelopmentEnvironmentDescriptor {
  workstation: WorkstationDescriptor; // getWorkstationByName('emp-12', workstations)
  dependencies?: DependencyDescriptor[]; // Harmonized type for dependencies // getDependencyByName(['angular', 'npm',],resources: dependencies)
  services?: ServiceDescriptor[]; // , // getServiceByName(['repo', 'mysql', 'push-service'], services)
  environmentVariables?: Record<string, string>; // Key-value pairs of environment variables
  ciCd: CiCdDescriptor[]; // Coninous Integration / Continous Delivery // getCiCd(["CircleCI - Test and Deploy", "Nonexistent Pipeline"], knownCiCds)
  testingFrameworks?: string[]; // Testing frameworks used (e.g., "Jest", "Mocha") // getTestingFramework(["Mocha", "Nonexistent Framework"], knownTestingFrameworks)
  versionControl?: VersionControlDescriptor;
  // scaling?: {
  //     autoScaling?: boolean; // Auto-scaling
  //     maxInstances?: number; // Maximum instances
  //     minInstances?: number; // Minimum instances
  //   };
  // security?: {
  //     encryption?: {
  //       enabled: boolean; // Encryption status
  //       type?: 'at-rest' | 'in-transit' | 'both'; // Encryption type
  //       algorithm?: string; // Encryption algorithm
  //     };
}

export interface RuntimeEnvironmentDescriptor {
  os: OperatingSystemDescriptor; // getOsByName(name: string,osStore: OperatingSystemDescriptor[],)
  dependencies?: DependencyDescriptor[]; // getDependencyByName(names: string[],resources: DependencyDescriptor[],)
  services: ServiceDescriptor[]; // getServiceByName(names: string[],resources: ServiceDescriptor[],)
  sites: WorkstationDescriptor[]; // getWorkstationByName(name: string,ws: WorkstationDescriptor[],)
  //   scaling?: {
  //     autoScaling?: boolean; // Auto-scaling
  //     maxInstances?: number; // Maximum instances
  //     minInstances?: number; // Minimum instances
  //   };
  //   security?: {
  //     encryption?: {
  //       enabled: boolean; // Encryption status
  //       type?: 'at-rest' | 'in-transit' | 'both'; // Encryption type
  //       algorithm?: string; // Encryption algorithm
  //     };
}

export interface FileReference {
  name: string; // Logical name of the file reference (e.g., "packageJson", "dockerCompose")
  filePath: string; // Path to the file (relative or absolute)
  format: 'json' | 'yaml' | 'xml' | 'text'; // Format of the file
  section?: string | string[]; // Optional: Section(s) of the file to extract (e.g., "dependencies" for package.json)
  description?: string; // Description of the purpose of this file reference
}

export interface FileStoreDescriptor {
  name: string; // Unique identifier for the file store
  type:
    | 'local'
    | 'network'
    | 'object-storage'
    | 'distributed'
    | 'container-managed'; // Type of file storage

  capacity: {
    size: string; // Total storage size (e.g., "500GB", "2TB")
    autoScaling?: boolean; // Whether storage can auto-scale
    quota?: {
      userLimit?: string; // Per-user storage limit (e.g., "10GB")
      groupLimit?: string; // Per-group storage limit
    };
  };

  location: {
    path?: string; // Path for local or network file storage
    bucketName?: string; // Bucket name for object storage
    region?: string; // Region for cloud-based storage (e.g., "us-east-1")
    endpoints?: string[]; // Custom endpoints for distributed or object storage
  };

  access: {
    accessType: 'public' | 'private' | 'restricted'; // Access control type
    permissions?: {
      read: boolean; // Whether read access is allowed
      write: boolean; // Whether write access is allowed
      execute?: boolean; // Whether execute access is allowed (for file systems)
    };
    authentication?: {
      type: 'key-based' | 'token-based' | 'role-based' | 'none'; // Authentication mechanism
      credentials?: {
        apiKey?: string; // API key for access
        token?: string; // Authentication token
        user?: string; // Username
        password?: string; // Password
        roles?: string[]; // Role-based access roles
      };
    };
  };

  redundancy?: {
    enabled: boolean; // Whether redundancy is enabled
    strategy?: 'mirroring' | 'striping' | 'parity'; // Redundancy strategy
    replicas?: number; // Number of replicas for redundancy
  };

  encryption?: {
    enabled: boolean; // Whether encryption is enabled
    atRest?: boolean; // Encrypt files at rest
    inTransit?: boolean; // Encrypt files during transit
    algorithm?: string; // Encryption algorithm (e.g., "AES-256")
  };

  performance?: {
    maxThroughput?: string; // Maximum throughput (e.g., "1Gbps")
    latency?: string; // Expected latency (e.g., "10ms")
    caching?: {
      enabled: boolean; // Whether caching is enabled
      type?: 'local' | 'distributed'; // Type of caching
      size?: string; // Cache size (e.g., "10GB")
    };
  };

  integration?: {
    containerManager?: {
      manager: 'kubernetes' | 'docker'; // Container manager type
      volumeType: 'persistentVolume' | 'configMap' | 'emptyDir'; // Volume type
      mountPath: string; // Mount path inside the container
      accessModes: string[]; // Kubernetes access modes (e.g., "ReadWriteOnce", "ReadOnlyMany")
    };
    cloudProvider?: {
      provider: 'aws-s3' | 'gcp-storage' | 'azure-blob'; // Cloud provider
      sdkVersion?: string; // SDK version for interaction
      customEndpoints?: string[]; // Custom endpoints for interaction
    };
  };

  backup?: {
    enabled: boolean; // Whether backups are enabled
    schedule?: string; // Cron-like schedule for backups (e.g., "0 3 * * *")
    retentionPolicy?: string; // Retention policy (e.g., "30d" for 30 days)
    destination?: string; // Destination for backups (e.g., S3 bucket, NFS path)
  };

  metadata?: {
    description?: string; // Description of the file store
    createdBy?: string; // Creator of the file store
    tags?: string[]; // Tags for categorization
    createdAt?: string; // Creation timestamp
    lastModified?: string; // Last modification timestamp
  };
}

export interface WebServiceDescriptor {
  serviceName: string; // Unique name of the service
  serviceType: 'api' | 'gui-web-app' | 'push-server' | 'static-site' | 'other'; // Type of service

  provider:
    | 'aws'
    | 'google-cloud'
    | 'azure'
    | 'digitalocean'
    | 'custom'
    | WebserviceProvisionDescriptor; // Deployment provider or detailed provision descriptor

  environment: 'development' | 'staging' | 'production'; // Target environment

  webServer: {
    provider: 'nginx' | 'apache' | 'iis' | 'custom'; // Web server type
    config: string; // Path or raw content of server configuration (e.g., nginx.conf)
  };

  ssl: {
    enabled: boolean; // Whether SSL is enabled
    provider: 'letsencrypt' | 'custom'; // SSL provider
    certificatePath?: string; // Path to SSL certificate (if custom)
    privateKeyPath?: string; // Path to private key (if custom)
    autoRenew?: boolean; // Whether SSL should auto-renew
  };

  domains: {
    primaryDomain: string; // Primary domain for the web service
    subdomains?: string[]; // List of subdomains to create
    dnsSettings: {
      provider: 'route53' | 'google-dns' | 'cloudflare' | 'custom'; // DNS provider
      entries: DNSRecord[]; // Array of DNS records
    };
  };

  osHost: {
    osType: 'linux' | 'windows'; // Operating system type
    distribution?: 'ubuntu' | 'centos' | 'debian' | 'windows-server'; // OS distribution
    version?: string; // OS version
    ssh: {
      user: string; // SSH user for access
      keyPath: string; // Path to SSH private key
    };
  };

  directories: {
    applicationRoot: string; // Root directory for the application
    logs: string; // Path to the log directory
    permissions: {
      user: string; // User owning the files
      group: string; // Group owning the files
      mode: string; // Permissions (e.g., "755" or "644")
    };
  };

  network: {
    ports: {
      http: number; // HTTP port
      https?: number; // HTTPS port
      additionalPorts?: number[]; // Additional custom ports
    };
    publicUrl: string; // Public URL of the service
    firewallRules?: FirewallRule[]; // Firewall rules for allowed IPs and protocols
  };

  containerManager?: {
    manager: 'docker' | 'kubernetes'; // Container manager type
    instructions: {
      image: string; // Container image to deploy
      tag: string; // Image tag
      environmentVariables: Record<string, string>; // Environment variables
      volumes: VolumeMapping[]; // Volume mappings
      ports: PortMapping[]; // Port mappings
    };
  };

  security: {
    htaccess?: string; // Content of .htaccess or equivalent security file
    headers?: Record<string, string>; // HTTP security headers
    firewall?: {
      enabled: boolean; // Whether to enable firewall
      rules: FirewallRule[]; // Firewall rules
    };
    accessControl?: {
      allowedIps?: string[]; // List of allowed IPs
      blockedIps?: string[]; // List of blocked IPs
    };
  };

  metadata?: {
    description?: string; // Description of the service
    createdBy?: string; // Creator of the service
    createdAt?: string; // Creation timestamp
  };
}

// Supporting Interfaces

interface DNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'SRV'; // DNS record type
  name: string; // Record name (e.g., "www" or "@")
  value: string; // Record value (e.g., IP address or domain name)
  ttl: number; // Time-to-live in seconds
}

interface FirewallRule {
  protocol: 'tcp' | 'udp' | 'icmp'; // Protocol type
  portRange: string; // Port range (e.g., "80" or "3000-4000")
  source: string; // Allowed source IP or CIDR block
}

interface VolumeMapping {
  hostPath: string; // Host machine path
  containerPath: string; // Container path
}

interface PortMapping {
  hostPort: number; // Host machine port
  containerPort: number; // Container port
}

export interface CloudConfig {
  provider: string; // Cloud provider name (e.g., AWS, Azure, Google)
  deployment?: {
    region: string; // Deployment region (e.g., us-east-1)
    strategy?: string; // Deployment strategy (e.g., rolling)
  };
}

export interface WebserviceProvisionDescriptor extends WebServiceDescriptor {
  accountAccess: {
    method: 'api-key' | 'oauth' | 'ssh-key' | 'username-password'; // Authentication method
    credentials: AccountCredentials; // Encapsulated account credentials
  };

  provisioningTools: {
    tool:
      | 'terraform'
      | 'ansible'
      | 'cloudformation'
      | 'pulumi'
      | 'custom-script'; // Tool for provisioning
    version?: string; // Version of the tool (optional)
    configuration: string; // Path or inline configuration for the tool
  }[];

  scriptingSupport?: {
    enabled: boolean; // Whether custom scripting is allowed
    language: 'bash' | 'python' | 'typescript' | 'other'; // Scripting language
    scripts: ScriptDescriptor[]; // List of available or custom scripts
  };

  migration: {
    enabled: boolean; // Whether migration is supported
    sourceProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'; // Current provider
    targetProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'; // Target provider
    steps: MigrationStep[]; // Steps to facilitate migration
    rollback?: boolean; // Whether rollback options are provided
  };

  providerSpecificInstructions?: Record<string, ProviderInstruction>; // Instructions for specific providers
}

// Supporting Interfaces

export interface AccountCredentials {
  apiKey?: string; // API Key for authentication
  oauthToken?: string; // OAuth token
  sshKeyPath?: string; // Path to SSH key for authentication
  username?: string; // Username for access
  password?: string; // Password for access
}

export interface ScriptDescriptor {
  name: string; // Name of the script
  description: string; // Description of what the script does
  script: string; // Inline script content or path to the script file
}

export interface MigrationStep {
  description: string; // Description of the migration step
  command: string; // Command or action to perform during migration
  tools?: string[]; // Tools required to perform the step (optional)
}

export interface ProviderInstruction {
  description: string; // Description of the provider-specific instruction
  configPath: string; // Path to the configuration file or script
  additionalDetails?: Record<string, any>; // Additional details or metadata
}

export interface OperatingSystemDescriptor {
  name: string; // Name of the operating system (e.g., Windows, Linux, macOS)
  version: string; // Version of the operating system (e.g., "10.0.19044", "Ubuntu 22.04")
  architecture: 'x86' | 'x64' | 'ARM' | 'ARM64'; // CPU architecture supported by the OS
  kernelVersion?: string; // Optional: Specific kernel version (e.g., "5.15.0-79-generic")
  distribution?: string; // Optional: For Linux distros (e.g., "Ubuntu", "Fedora")
  buildNumber?: string; // Optional: Build number for the OS (e.g., Windows-specific)
  environmentVariables?: { [key: string]: string }; // Optional: Key-value pairs of environment variables
  timezone: string; // Timezone of the environment (e.g., "UTC", "America/New_York")
  hostname: string; // Hostname of the system
  ipAddresses: string[]; // List of IP addresses associated with the environment
  uptime?: number; // Optional: System uptime in seconds
  isVirtualized: boolean; // Whether the environment is running on a virtual machine
  virtualMachineType?: string; // Optional: Type of virtualization (e.g., "VMware", "KVM")
}

export interface ServiceProviderDescriptor {
  providerName: string; // Name of the service provider (e.g., AWS, Google Cloud, Azure)
  accountId?: string; // Identifier for the user's account with the provider
  credentials: AccountCredentials; // Global credentials for the service provider
  servicesInUse: ServiceDescriptor[]; // Array of services being utilized
  dataCenterLocation?: DataCenterLocation; // Information about the provider's data center
  metadata?: ProviderMetadata; // Additional metadata for extensibility
}

export interface AccountCredentials {
  type: 'apiKey' | 'usernamePassword' | 'oauth' | 'custom'; // Type of authentication
  apiKey?: string; // API key, if applicable
  username?: string; // Username, if applicable
  password?: string; // Password, if applicable
  token?: string; // OAuth token or custom token, if applicable
  customAuthConfig?: Record<string, any>; // Custom configurations for provider-specific credentials
}

export interface ServiceDescriptor {
  serviceName: string; // Name of the service (e.g., S3, Compute Engine, Blob Storage)
  serviceType:
    | 'storage'
    | 'compute'
    | 'push-services'
    | 'database'
    | 'networking'
    | 'repository'
    | 'other'; // Type of service
  credentials?: AccountCredentials; // Specific credentials to access this service
  usageMetrics?: UsageMetrics; // Metrics like quota, consumption, or performance
  configuration?: Record<string, any>; // Service-specific configuration details
  availabilityZones?: string[]; // Regions or zones where the service is available
  serviceProvider?: ServiceProviderDescriptor;
}

export interface DataCenterLocation {
  region: string; // Region of the data center (e.g., us-east-1, europe-west1)
  country: string; // Country where the data center is located
  complianceStandards?: string[]; // Compliance standards met (e.g., GDPR, HIPAA)
}

export interface UsageMetrics {
  currentUsage?: MetricsQuantity; // Current usage (e.g., GB, hours, API calls)
  quota?: MetricsQuantity; // Quota limit
  utilizationPercentage?: MetricsQuantity; // Utilization as a percentage
  billingCost?: MetricsQuantity; // Current cost for this service
}

export interface MetricsQuantity {
  units: string;
  value: number;
}

export interface ProviderMetadata {
  description?: string; // Description of the service provider
  website?: string; // URL to the provider's website
  supportContact?: string; // Contact information for support
  integrationNotes?: string; // Notes about integration with the provider
}

export interface LicenseDescriptor {
  type: 'openSource' | 'commercial' | 'custom';
  licenseName?: string; // For standard licenses (e.g., 'MIT', 'GPL-3.0', 'Apache-2.0')
  licenseLink?: string; // URL to the license text (for commercial or open source)
  terms?: string; // For custom licenses or additional terms
  cost?: {
    type: 'free' | 'paid';
    amount?: number; // Specify cost if 'paid'
    currency?: string; // Currency type if 'paid'
  };
}

export interface VendorDescriptor {
  name: string; // Name of the vendor or organization
  contact?: string; // Email or contact link
  website?: string; // Website URL
}

export interface DeveloperDescriptor {
  name: string; // Developer or group name
  role?: string; // Role in the project (e.g., 'Lead Developer', 'Contributor')
  contact?: string; // Email or contact link
  profileLink?: string; // Link to personal or group profile (e.g., GitHub)
}

export interface CommunityDescriptor {
  name: string; // Community name
  type: 'forum' | 'github' | 'mailingList' | 'other';
  link: string; // URL to the community
}

export interface ContributorDescriptor {
  vendors?: VendorDescriptor[];
  developers?: DeveloperDescriptor[];
  communities?: CommunityDescriptor[];
}
