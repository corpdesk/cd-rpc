/* eslint-disable antfu/if-newline */
import type { CiCdDescriptor } from './cd-dev-descriptor.model';

export const knownCiCds: CiCdDescriptor[] = [
  {
    pipeline: {
      name: 'GitHub Actions - Build and Deploy',
      type: 'integration',
      stages: [
        {
          name: 'Build',
          description: 'Build the application',
          tasks: [
            {
              name: 'Install Dependencies',
              type: 'build',
              executor: 'runner',
              status: 'success',
              duration: '2m 15s',
            },
            {
              name: 'Compile Code',
              type: 'build',
              executor: 'runner',
              status: 'success',
              duration: '1m 45s',
            },
          ],
        },
        {
          name: 'Test',
          description: 'Run tests for the application',
          tasks: [
            {
              name: 'Run Unit Tests',
              type: 'test',
              executor: 'script',
              status: 'success',
              duration: '3m 10s',
            },
          ],
        },
        {
          name: 'Deploy',
          description: 'Deploy to production',
          tasks: [
            {
              name: 'Deploy to Staging',
              type: 'deploy',
              executor: 'docker',
              status: 'pending',
            },
          ],
        },
      ],
    },
    triggers: {
      type: 'push',
      branchFilters: ['main'],
      conditions: { includeTags: true },
    },
    environment: {
      name: 'Production',
      url: 'https://app.example.com',
      type: 'production',
      deploymentStrategy: 'blue-green',
    },
  },
  {
    pipeline: {
      name: 'CircleCI - Test and Deploy',
      type: 'delivery',
      stages: [
        {
          name: 'Test',
          description: 'Run all automated tests',
          tasks: [
            {
              name: 'Run Integration Tests',
              type: 'test',
              executor: 'docker',
              status: 'running',
            },
          ],
        },
        {
          name: 'Deploy',
          description: 'Deploy to staging environment',
          tasks: [
            {
              name: 'Deploy Docker Image',
              type: 'deploy',
              executor: 'docker',
              status: 'pending',
            },
          ],
        },
      ],
    },
    triggers: {
      type: 'pull_request',
      branchFilters: ['develop'],
    },
    environment: {
      name: 'Staging',
      url: 'https://staging.example.com',
      type: 'staging',
      deploymentStrategy: 'rolling',
    },
    notifications: {
      channels: [
        {
          name: 'Slack',
          type: 'slack',
          recipients: ['#devops'],
          messageFormat: 'text',
        },
      ],
      onEvents: ['failure', 'success'],
    },
  },
];

export const defaultCiCd: CiCdDescriptor = {
  pipeline: {
    name: 'Default CI/CD Pipeline',
    type: 'integration',
    stages: [
      {
        name: 'Build',
        description: 'Default build stage',
        tasks: [
          {
            name: 'Default Build Task',
            type: 'build',
            executor: 'script',
            status: 'pending',
          },
        ],
      },
    ],
  },
  triggers: {
    type: 'manual',
    conditions: { includeTags: false },
  },
  environment: {
    name: 'Default Environment',
    url: 'http://localhost',
    type: 'testing',
    deploymentStrategy: 'recreate',
  },
};

export function getCiCd(
  names: string[],
  cIcDs: CiCdDescriptor[],
): CiCdDescriptor {
  for (const name of names) {
    const found = cIcDs.find((ciCd) => ciCd.pipeline.name === name);
    if (found) return found;
  }
  return defaultCiCd;
}
