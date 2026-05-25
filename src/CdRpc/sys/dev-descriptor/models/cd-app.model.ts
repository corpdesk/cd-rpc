// src/CdCli/sys/dev-descriptor/models/cd-app.model.ts
// import type { CdRequest, ICdRequest } from '../../base/i-base';
import type { BaseDescriptor } from './base-descriptor.model';
import type { CdModuleDescriptor } from './cd-module-descriptor.model';
import type { CiCdDescriptor } from './cicd-descriptor.model';
import type { EnvironmentDescriptor } from './environment.model';
import CdLog from '../../comm/controllers/cd-logger.controller';
import { LanguageDescriptor } from './language.model';
import { LicenseDescriptor } from './license.model';
import {
  CdControllerDescriptor,
  CdModelDescriptor,
  CdServiceDescriptor,
  ContributorDescriptor,
  VersionControlDescriptor,
} from '../index';

export interface CdAppDescriptor extends BaseDescriptor {
  $schema?: string;
  name: string;
  type: AppType;
  projectGuid?: string;
  parentProjectGuid: string | null;
  modules: CdModuleDescriptor[];
  cdCi?: CiCdDescriptor;
  description?: string;
  language?: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  environments?: EnvironmentDescriptor[]; // Development environment settings
  versionControl?: VersionControlDescriptor; // Version control details
  directorySignature?: DirectorySignatureDescriptor;
}

export enum AppType {
  Frontend = 'frontend', // User-facing web or app interfaces
  Api = 'api', // Backend APIs
  CdApi = 'cd-api', // Corpdesk backend APIs
  CdApiModule = 'cd-module',
  PushServer = 'push-server', // Services for push notifications
  Cli = 'cli', // Command-line interfaces
  CdCli = 'cd-cli', // Corpdesk command-line interfaces
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
  SDN = 'sdn', // Software-Defined Networking applications
  CbO = 'cbo', // CloudBrix Orchestrator
}

export interface DirectorySignatureDescriptor extends BaseDescriptor {
  /** The root label of this signature (e.g., 'cd-api-v1-standard') */
  signatureName: string;
  /** The root node of the tree */
  root: DirectoryNode;
  /** Global variables used across the signature (e.g., Namespace, Scope) */
  variables?: Record<string, string>;

  // 🔥 NEW — Graph edges
  edges?: CdGraphEdge[];
}

export interface DirectoryNode extends BaseDescriptor {
  /** The segment name. Can be a literal 'src' or a variable '${slug}' */
  name: string;
  /** corpdesk cd-obj-guid used for unique id */
  cdObjGuid: string;
  /** As per corpdesk database. Represents the architectural role (S, A, U, Leaf, Genome, etc.) */
  cdObjRoleName?: string;
  /** As per corpdesk database. Represents the architectural role (S, A, U, Leaf, Genome, etc.) */
  cdObjRoleGuid?: string;
  /** As per corpdesk database. Represents the parent object */
  parentObj?: string;
  /** Weighting for the Auditor/Scanner logic */
  weight?: number;
  /** If true, this node is a file; otherwise, it is a directory */
  isFile?: boolean;
  /** Optional: Template reference for file content generation */
  templateRef?: string;
  /** Recursive children (for directories) */
  children?: DirectoryNode[];

  // 🔥 NEW — Audit Classification
  classification?: 'expected' | 'omega-valid' | 'omega-invalid';

  classificationReason?: string;

  /**
   * lastUpdated can be used for:
   * Incremental scanning
   * scan only nodes where lastUpdated changed
   * ✅ Selective AI execution
   * apply fix only to selected branch
   * ✅ Version-aware evolution
   * compare snapshots over time
   */
  lastUpdated?: number; // ISO timestamp of last update

  isSelected?: boolean;

  // ✅ CD compliance system
  isCdCompliant?: boolean;
  isCdForeign?: boolean;

  // 🔥 recommended (future-safe)
  cdState?: 'compliant' | 'foreign' | 'unknown';
  origin?: 'generated' | 'scanned' | 'external';
}

export interface ScanNode {
  path: string;
  name: string;
  isFile: boolean;
  extension?: string;

  role?: string;
  module?: string;

  lastModified: number;

  children?: ScanNode[];

  // 🔥 NEW: compliance tracking
  isCdCompliant?: boolean;
  isCdForeign?: boolean;
  cdState: 'compliant' | 'foreign' | 'unknown';
}

export interface ComplianceMetrics {
  CR: number;
  infectionRatio: number;

  totalNodes: number;
  expectedNodes: number;
  unknownNodes: number;
}

/**
 * Add capacity for:
 * cross-module references
 * dependency mapping
 * future AI reasoning
 */
export interface CdGraphEdge {
  from: string; // cdObjGuid
  to: string; // cdObjGuid
  type: 'hierarchy' | 'dependency' | 'reference';
}

export interface AppFrontendDescriptor extends BaseDescriptor {
  backendApp: { name: string; networkAddress: string }; // Defines the backend it connects to
  authenticationMethod?: string; // OAuth, JWT, SSO, etc.
  userInterface?: { framework: string; designSystem?: string }; // UI-related settings
}

export interface AppApiDescriptor extends BaseDescriptor {
  requestProcessing: { protocol: string; rateLimit?: number }; // CdWire, REST, GraphQL, gRPC etc.
  security?: { authentication: string; authorization?: string }; // e.g., JWT, OAuth
  dataSources: { database?: string; cache?: string; messageQueue?: string[] }; // Dependencies
  externalServices?: string[]; // APIs the backend depends on
}

export interface AppPushServerDescriptor extends CdAppDescriptor {
  pushProvider: string; // Firebase, OneSignal, etc.
  supportedPlatforms: string[]; // iOS, Android, Web
  messageFormat?: string; // FCM, APNs, MQTT
  retryMechanism?: boolean; // Whether it retries on failure
}

export interface AppCliDescriptor extends CdAppDescriptor {
  commands: string[]; // List of CLI commands
  inputHandling?: 'interactive' | 'scripted'; // Mode of operation
  outputFormat?: 'json' | 'yaml' | 'text'; // Output format support
}

export interface AppPwaDescriptor extends CdAppDescriptor {
  offlineSupport?: boolean; // Service worker usage
  storageMechanism?: string; // IndexedDB, LocalStorage
  installability?: boolean; // Whether it supports installation
}

export interface AppDesktopPwaDescriptor extends AppPwaDescriptor {
  systemIntegration?: string[]; // File system, Notifications, etc.
  autoUpdateSupport?: boolean; // Whether it can update automatically
}

export interface AppMobileDescriptor extends CdAppDescriptor {
  appStore: { platform: string; storeName?: string }; // Google Play, App Store
  notificationService?: string; // FCM, APNs, OneSignal
}

export interface AppMobileHybridDescriptor extends AppMobileDescriptor {
  hybridFramework?: string; // Ionic, Flutter, React Native
  webViewSupport?: boolean; // Whether it uses WebView for rendering
}

export interface AppMobileNativeDescriptor extends AppMobileDescriptor {
  nativeSdk?: string; // Swift, Kotlin, Objective-C
  deviceCapabilities?: string[]; // GPS, Camera, NFC, etc.
}

export interface AppDesktopDescriptor extends CdAppDescriptor {
  osSupport: string[]; // Windows, macOS, Linux
  nativeFeatures?: string[]; // File system, Bluetooth, USB, etc.
  distributionMethod?: string; // App Store, Standalone Installer
}

export interface AppIotDescriptor extends CdAppDescriptor {
  connectivity: string[]; // MQTT, LoRa, Bluetooth, etc.
  hardwareSupport: { board: string; chip: string }; // e.g., Raspberry Pi, ESP32
  powerSource?: 'battery' | 'mains' | 'solar'; // Power constraints
}

export interface AppGameDescriptor extends CdAppDescriptor {
  gameEngine: string; // Unity, Unreal, Godot
  multiplayerSupport?: boolean; // Whether it supports online play
  physicsEngine?: string; // Havok, PhysX, Bullet
  targetPlatform: string[]; // PC, Console, Mobile
}

export interface AppEmbeddedDescriptor extends CdAppDescriptor {
  realTimeOs?: string; // FreeRTOS, Zephyr
  hardwareConstraints?: { ram: string; storage: string }; // Memory and storage limitations
  connectivity?: string[]; // UART, I2C, SPI
}

export interface AppRoboticsDescriptor extends CdAppDescriptor {
  roboticsFramework: string; // ROS, OpenCV
  controlMethod?: 'autonomous' | 'remote-controlled'; // Mode of operation
  supportedHardware: string[]; // Arduino, Jetson Nano, etc.
}

export interface AppPluginDescriptor extends CdAppDescriptor {
  compatibleSoftware: string[]; // VSCode, Photoshop, Figma
  integrationType?: 'UI' | 'Middleware' | 'API Hook' | 'unknown'; // How it integrates
}

export interface AppMicroserviceDescriptor extends CdAppDescriptor {
  interServiceCommunication?: 'CdWire' | 'REST' | 'gRPC' | 'Message Queue' | 'unknown'; // How it talks to other services
  scalingMethod?: 'CloudBix' | 'Kubernetes' | 'Serverless'; // How it scales
  dependencies?: { databases?: string[]; messageQueues?: string[] }; // Services it relies on
}
