import type {
  ServiceDescriptor,
  ServiceProviderDescriptor,
} from './cd-dev-descriptor.model';
import {
  getServiceProviderByName,
  serviceProviders,
} from './service-provider.model';

export const services: ServiceDescriptor[] = [
  {
    serviceName: 'S3',
    serviceType: 'storage',
    credentials: {
      type: 'apiKey',
      apiKey: 'AKIA123456789EXAMPLE',
    },
    usageMetrics: {
      quota: { units: 'TB', value: 1 },
      currentUsage: { units: 'GB', value: 200 },
    },
    configuration: {
      bucketName: 'my-app-bucket',
      encryption: 'AES256',
    },
    availabilityZones: ['us-east-1', 'us-west-2'],
    serviceProvider: getServiceProviderByName('AWS', serviceProviders),
  },
  {
    serviceName: 'Compute Engine',
    serviceType: 'compute',
    credentials: {
      type: 'oauth',
      token: 'ya29.A0AfH6SMD2j-example',
    },
    usageMetrics: {
      quota: { units: 'vCPUs', value: 100 },
      currentUsage: { units: 'vCPUs', value: 25 },
    },
    configuration: {
      machineType: 'e2-standard-4',
      autoScaling: true,
    },
    availabilityZones: ['us-central1', 'europe-west1'],
    serviceProvider: getServiceProviderByName('GCP', serviceProviders),
  },
  {
    serviceName: 'Blob Storage',
    serviceType: 'storage',
    credentials: {
      type: 'custom',
      customAuthConfig: {
        accountName: 'myblobaccount',
        accountKey: 'abc123exampleKey',
      },
    },
    usageMetrics: {
      quota: { units: 'GB', value: 500 },
      currentUsage: { units: 'GB', value: 150 },
    },
    configuration: {
      containerName: 'static-content',
      accessTier: 'Hot',
    },
    availabilityZones: ['eastus', 'westus2'],
    serviceProvider: getServiceProviderByName('Azure', serviceProviders),
  },
  {
    serviceName: 'Push Notification Service',
    serviceType: 'other',
    credentials: {
      type: 'apiKey',
      apiKey: 'PUSH123456789EXAMPLE',
    },
    usageMetrics: {
      quota: { units: 'notifications/month', value: 1_000_000 },
      currentUsage: { units: 'notifications', value: 200_000 },
    },
    configuration: {
      platform: 'iOS/Android',
      retries: 3,
    },
    availabilityZones: ['global'],
    serviceProvider: getServiceProviderByName('Firebase', serviceProviders),
  },
  {
    serviceName: 'MySQL Database',
    serviceType: 'database',
    credentials: {
      type: 'usernamePassword',
      username: 'admin',
      password: 'securePass123',
    },
    usageMetrics: {
      quota: { units: 'GB', value: 100 },
      currentUsage: { units: 'GB', value: 45 },
    },
    configuration: {
      replication: true,
      backupEnabled: true,
    },
    availabilityZones: ['ap-southeast-1', 'us-east-1'],
    serviceProvider: getServiceProviderByName('Digitalocean', serviceProviders),
  },
  {
    serviceName: 'Container Registry',
    serviceType: 'storage',
    credentials: {
      type: 'oauth',
      token: 'ya29.ContainerRegistryExampleToken',
    },
    usageMetrics: {
      quota: { units: 'TB', value: 10 },
      currentUsage: { units: 'TB', value: 2 },
    },
    configuration: {
      retentionPolicy: '30 days',
      scanningEnabled: true,
    },
    availabilityZones: ['europe-north1', 'us-central1'],
    serviceProvider: getServiceProviderByName('GCP', serviceProviders),
  },
  {
    serviceName: 'Default Repository',
    serviceType: 'repository',
    configuration: {
      url: 'https://github.com/example/default-repo',
      defaultBranch: 'main',
      enabled: true,
      isPrivate: true,
    },
    serviceProvider: getServiceProviderByName('GitHub', serviceProviders),
  },
  {
    serviceName: 'GitLab Repository',
    serviceType: 'repository',
    configuration: {
      url: 'https://gitlab.com/example/project-repo',
      defaultBranch: 'main',
      enabled: true,
      isPrivate: false,
    },
    serviceProvider: getServiceProviderByName('GitLab', serviceProviders),
  },
  {
    serviceName: 'AWS CodeCommit Repository',
    serviceType: 'repository',
    configuration: {
      url: 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-repo',
      defaultBranch: 'main',
      enabled: true,
      isPrivate: true,
    },
    serviceProvider: getServiceProviderByName('AWS', serviceProviders),
  },
];

export const defaultService: ServiceDescriptor = {
  serviceName: 'Unknown Service',
  serviceType: 'other',
  credentials: {
    type: 'custom',
    customAuthConfig: {},
  },
  usageMetrics: {},
  configuration: {},
  availabilityZones: ['global'],
  serviceProvider: {
    providerName: 'Unknown Provider',
    credentials: {
      type: 'custom',
      customAuthConfig: {},
    },
    servicesInUse: [],
    dataCenterLocation: {
      region: 'unknown',
      country: 'unknown',
    },
  },
};

export function getServiceByName(
  names: string[],
  resources: ServiceDescriptor[],
): ServiceDescriptor[] {
  const foundServices = resources.filter((service) =>
    names.some(
      (name) => service.serviceName.toLowerCase() === name.toLowerCase(),
    ),
  );

  return foundServices.length > 0 ? foundServices : [defaultService];
}
