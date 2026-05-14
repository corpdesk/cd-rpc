
/**
 * Transport:
 * - Protocol: HTTP, HTTPS, WS, WSS, TCP, GRPC, SSH
 */

export enum TransportProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  WS = 'ws',
  WSS = 'wss',
  TCP = 'tcp',
  GRPC = 'grpc',
  SSH = 'ssh'
}

export enum TransportExecutionMode {
  LOCAL = 'local',
  REMOTE = 'remote',
  RPC = 'rpc',
  QUEUE = 'queue',
  WORKER = 'worker'
}

export interface TransportDescriptor {
  protocol?: TransportProtocol;
  mode: TransportExecutionMode;
  endpoint?: string;
  headers?: Record<string, string>;
}

/**
 * Network interface descriptor
 */

export interface NetworkInterfaceDescriptor {
  name: string;
  macAddress?: string;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dnsServers?: string[];
}

/**
 * Network device descriptor
 */

export interface NetworkDeviceDescriptor {
  id: string;
  name: string;
  type: string;
  interfaces: NetworkInterfaceDescriptor[];
  transport?: TransportDescriptor;
}

/**
 * Routing descriptors
 */

export interface RouteDescriptor {
  destination: string;
  gateway: string;
  interface: string;
  metric?: number;
}

export interface RoutingTableDescriptor {
  routes: RouteDescriptor[];
}

/**
 * DNS descriptor
 */

export interface DnsDescriptor {
  servers: string[];
  searchDomains?: string[];
}

