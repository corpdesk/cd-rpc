import type { WorkstationDescriptor } from './cd-dev-descriptor.model';
import { defaultOs, getOsByName, operatingSystems } from './oses.model';
import {
  defaultSoftware,
  getSoftwareByName,
  softwareDataStore,
} from './software-store.model';

export const workstations: WorkstationDescriptor[] = [
  {
    id: 'ws-001',
    name: 'Local Development Machine',
    type: 'local',
    os: getOsByName('ubuntu.22.04', operatingSystems)[0],
    path: '/local/dev',
    enabled: true,
    timezone: 'UTC',
    network: {
      hostname: 'dev-machine',
      ipAddresses: ['192.168.0.2'],
    },
    hardware: {
      cpu: {
        model: 'Intel Core i7-12700K',
        cores: 12,
        threads: 24,
      },
      memory: {
        total: 32768,
      },
      storage: {
        total: 1000000,
      },
      gpu: {
        model: 'NVIDIA RTX 3080',
        memory: 10000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['npm.9.8.1', 'vscode.1.82.0'],
      softwareDataStore,
    ),
    sshCredentials: undefined,
    capabilities: {
      canBuild: true,
      canTest: true,
      canDeploy: false,
    },
    lastActive: new Date('2025-01-20T10:45:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-002',
    name: 'Windows Build Server',
    type: 'remote',
    os: getOsByName('Windows', operatingSystems)[0],
    path: '\\\\build-server\\shared',
    enabled: true,
    timezone: 'EST',
    network: {
      hostname: 'build-server',
      ipAddresses: ['10.0.0.10'],
    },
    hardware: {
      cpu: {
        model: 'AMD Ryzen 9 5950X',
        cores: 16,
        threads: 32,
      },
      memory: {
        total: 65536,
      },
      storage: {
        total: 2000000,
      },
      gpu: {
        model: 'NVIDIA RTX A6000',
        memory: 48000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['pnpm.7.16.0', 'apache.2.4.57', 'mysql-server.8.0.34'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'admin',
      privateKey: '/keys/build-server-key',
      host: '123.456.890',
      port: 22,
    },
    capabilities: {
      canBuild: true,
      canTest: true,
      canDeploy: true,
    },
    lastActive: new Date('2025-01-19T23:00:00Z'),
    isOnline: false,
  },
  {
    id: 'ws-003',
    name: 'macOS Developer Laptop',
    type: 'local',
    os: getOsByName('macOS', operatingSystems)[0],
    path: '/Users/dev/code',
    enabled: true,
    timezone: 'PST',
    network: {
      hostname: 'dev-macbook',
      ipAddresses: ['192.168.1.20'],
    },
    hardware: {
      cpu: {
        model: 'Apple M1 Max',
        cores: 10,
        threads: 20,
      },
      memory: {
        total: 65536,
      },
      storage: {
        total: 2000000,
      },
      gpu: {
        model: 'Integrated',
        memory: 32000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['vscode.1.82.0', 'npm.9.8.1', 'lxd.5.0'],
      softwareDataStore,
    ),
    sshCredentials: undefined,
    capabilities: {
      canBuild: true,
      canTest: true,
      canDeploy: false,
    },
    lastActive: new Date('2025-01-18T15:30:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-004',
    name: 'CentOS Database Server',
    type: 'remote',
    os: getOsByName('CentOS', operatingSystems)[0],
    path: '/var/lib/mysql',
    enabled: true,
    timezone: 'UTC',
    network: {
      hostname: 'db-server',
      ipAddresses: ['10.0.1.15'],
    },
    hardware: {
      cpu: {
        model: 'Intel Xeon Gold 6258R',
        cores: 28,
        threads: 56,
      },
      memory: {
        total: 128000,
      },
      storage: {
        total: 4000000,
      },
      gpu: {
        model: 'None',
        memory: 0,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['mysql-server.8.0.34', 'apache.2.4.57', 'incus.1.2.3'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'dbadmin',
      privateKey: '/keys/db-server-key',
      host: '123.238.101',
      port: 22,
    },
    capabilities: {
      canBuild: false,
      canTest: false,
      canDeploy: true,
    },
    lastActive: new Date('2025-01-20T09:00:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-005',
    name: 'Test Virtual Machine',
    type: 'remote',
    os: getOsByName('ubuntu.22.04', operatingSystems)[0],
    path: '/vm/test',
    enabled: true,
    timezone: 'UTC',
    network: {
      hostname: 'test-vm',
      ipAddresses: ['172.16.0.5'],
    },
    hardware: {
      cpu: {
        model: 'Virtual CPU',
        cores: 4,
        threads: 8,
      },
      memory: {
        total: 8192,
      },
      storage: {
        total: 250000,
      },
      gpu: {
        model: 'Virtual GPU',
        memory: 2048,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['npm.9.8.1', 'pnpm.7.16.0', 'vscode.1.82.0'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'vmuser',
      privateKey: '/keys/test-vm-key',
      host: '123.122.7',
      port: 22,
    },
    capabilities: {
      canBuild: true,
      canTest: true,
      canDeploy: false,
    },
    lastActive: new Date('2025-01-15T20:00:00Z'),
    isOnline: false,
  },
];

export const defaultWorkstation: WorkstationDescriptor = {
  id: 'unknown',
  name: 'Local Development Machine',
  type: 'local',
  os: getOsByName('ubuntu.22.04', operatingSystems)[0],
  path: '/local/dev',
  enabled: true,
  timezone: 'UTC',
  network: {
    hostname: 'dev-machine',
    ipAddresses: ['192.168.0.2'],
  },
  hardware: {
    cpu: {
      model: 'Intel Core i7-12700K',
      cores: 12,
      threads: 24,
    },
    memory: {
      total: 32768,
    },
    storage: {
      total: 1000000,
    },
    gpu: {
      model: 'NVIDIA RTX 3080',
      memory: 10000,
    },
  },
  requiredSoftware: getSoftwareByName(
    ['npm.9.8.1', 'vscode.1.82.0'],
    softwareDataStore,
  ),
  sshCredentials: undefined,
  capabilities: {
    canBuild: true,
    canTest: true,
    canDeploy: false,
  },
  lastActive: new Date('2025-01-20T10:45:00Z'),
  isOnline: true,
};

export function getWorkstationByName(
  name: string,
  ws: WorkstationDescriptor[],
): WorkstationDescriptor | undefined {
  return ws.find((workstation) => workstation.name === name);
}
