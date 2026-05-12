import type { ServiceProviderDescriptor } from './cd-dev-descriptor.model';

export const serviceProviders: ServiceProviderDescriptor[] = [
  {
    providerName: 'AWS',
    accountId: '123456789',
    credentials: {
      type: 'apiKey',
      apiKey: 'AKIAxxxxxxxxxxxxxxxx',
    },
    servicesInUse: [
      {
        serviceName: 'S3',
        serviceType: 'storage',
        credentials: {
          type: 'apiKey',
          apiKey: 'AKIAxxxxxxxxxxxxxxxx',
        },
        usageMetrics: {
          currentUsage: { units: 'GB', value: 150 },
          quota: { units: 'GB', value: 500 },
          utilizationPercentage: { units: '%', value: 30 },
          billingCost: { units: 'USD', value: 20.0 },
        },
        configuration: {
          bucketName: 'my-data-bucket',
          versioningEnabled: true,
        },
        availabilityZones: ['us-east-1', 'us-west-2'],
      },
      {
        serviceName: 'EC2',
        serviceType: 'compute',
        usageMetrics: {
          currentUsage: { units: 'hours', value: 70 },
          quota: { units: 'hours', value: 100 },
          utilizationPercentage: { units: '%', value: 70 },
          billingCost: { units: 'USD', value: 50.0 },
        },
      },
    ],
    dataCenterLocation: {
      region: 'us-east-1',
      country: 'United States',
      complianceStandards: ['GDPR', 'ISO27001'],
    },
    metadata: {
      description: 'AWS account for cloud services',
      website: 'https://aws.amazon.com',
      supportContact: 'support@aws.amazon.com',
    },
  },
  {
    providerName: 'GCP',
    accountId: 'gcp-987654321',
    credentials: {
      type: 'oauth',
      token: 'ya29.a0Afxxxxxxxxxxxxxx',
    },
    servicesInUse: [
      {
        serviceName: 'Compute Engine',
        serviceType: 'compute',
        usageMetrics: {
          currentUsage: { units: 'hours', value: 120 },
          quota: { units: 'hours', value: 300 },
          utilizationPercentage: { units: '%', value: 40 },
          billingCost: { units: 'USD', value: 60.0 },
        },
        configuration: {
          instanceType: 'n2-standard-4',
        },
      },
      {
        serviceName: 'Cloud Storage',
        serviceType: 'storage',
        usageMetrics: {
          currentUsage: { units: 'GB', value: 500 },
          quota: { units: 'GB', value: 1000 },
          utilizationPercentage: { units: '%', value: 50 },
          billingCost: { units: 'USD', value: 45.0 },
        },
        availabilityZones: ['us-central1', 'europe-west1'],
      },
    ],
    dataCenterLocation: {
      region: 'us-central1',
      country: 'United States',
      complianceStandards: ['SOC2', 'PCI-DSS'],
    },
    metadata: {
      description: 'Google Cloud Platform account',
      website: 'https://cloud.google.com',
      supportContact: 'support@googlecloud.com',
    },
  },
  {
    providerName: 'Azure',
    accountId: 'azure-555666',
    credentials: {
      type: 'usernamePassword',
      username: 'azureAdmin',
      password: 'password123',
    },
    servicesInUse: [
      {
        serviceName: 'Blob Storage',
        serviceType: 'storage',
        usageMetrics: {
          currentUsage: { units: 'GB', value: 250 },
          quota: { units: 'GB', value: 1000 },
          utilizationPercentage: { units: '%', value: 25 },
          billingCost: { units: 'USD', value: 30.0 },
        },
      },
    ],
    dataCenterLocation: {
      region: 'westeurope',
      country: 'Netherlands',
      complianceStandards: ['GDPR'],
    },
    metadata: {
      description: 'Azure account for Europe-based services',
      website: 'https://azure.microsoft.com',
      supportContact: 'support@azure.com',
    },
  },
  {
    providerName: 'DigitalOcean',
    credentials: {
      type: 'apiKey',
      apiKey: 'do_key_12345',
    },
    servicesInUse: [
      {
        serviceName: 'Droplets',
        serviceType: 'compute',
        usageMetrics: {
          currentUsage: { units: 'hours', value: 50 },
          quota: { units: 'hours', value: 200 },
          utilizationPercentage: { units: '%', value: 25 },
          billingCost: { units: 'USD', value: 10.0 },
        },
      },
    ],
    dataCenterLocation: {
      region: 'sgp1',
      country: 'Singapore',
    },
    metadata: {
      description: 'DigitalOcean account for lightweight deployments',
      website: 'https://www.digitalocean.com',
    },
  },
  {
    providerName: 'Linode',
    accountId: 'linode-888777',
    credentials: {
      type: 'apiKey',
      apiKey: 'lin_key_67890',
    },
    servicesInUse: [
      {
        serviceName: 'Object Storage',
        serviceType: 'storage',
        usageMetrics: {
          currentUsage: { units: 'GB', value: 100 },
          quota: { units: 'GB', value: 500 },
          utilizationPercentage: { units: '%', value: 20 },
          billingCost: { units: 'USD', value: 15 },
        },
      },
    ],
    dataCenterLocation: {
      region: 'us-east',
      country: 'United States',
    },
    metadata: {
      description: 'Linode account for object storage',
      website: 'https://www.linode.com',
    },
  },
  {
    providerName: 'GitHub',
    credentials: {
      type: 'oauth',
      token: 'ghp_exampleToken',
    },
    servicesInUse: [],
    dataCenterLocation: {
      region: 'global',
      country: 'United States',
    },
    metadata: {
      description: 'GitHub for repositories',
      website: 'https://github.com',
      supportContact: 'support@github.com',
    },
  },
  {
    providerName: 'GitLab',
    credentials: {
      type: 'apiKey',
      apiKey: 'gitlabApiKey123',
    },
    servicesInUse: [],
    dataCenterLocation: {
      region: 'global',
      country: 'United States',
    },
    metadata: {
      description: 'GitLab for CI/CD and repositories',
      website: 'https://gitlab.com',
      supportContact: 'support@gitlab.com',
    },
  },
];

export const defaultProvider: ServiceProviderDescriptor = {
  providerName: 'Unknown',
  credentials: {
    type: 'custom',
    customAuthConfig: {},
  },
  servicesInUse: [],
};

export function getServiceProviderByName(
  name: string,
  providers: ServiceProviderDescriptor[],
): ServiceProviderDescriptor {
  return (
    providers.find(
      (provider) => provider.providerName.toLowerCase() === name.toLowerCase(),
    ) || defaultProvider
  );
}
