import type { DependencyDescriptor } from './cd-dev-descriptor.model';

export const dependencies: DependencyDescriptor[] = [
  {
    name: 'express',
    version: '^4.18.1',
    category: 'library',
    type: 'runtime',
    source: 'npm',
    scope: 'module',
    resolution: {
      method: 'require',
      path: 'node_modules/express',
      alias: 'express',
    },
    usage: {
      context: 'api',
      functionsUsed: ['Router', 'json', 'urlencoded'],
    },
    platformCompatibility: {
      languages: ['Node.js'],
      os: ['Linux', 'Windows', 'macOS'],
      architectures: ['x86_64', 'arm64'],
    },
    lifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isTrusted: true,
      vulnerabilities: [],
    },
    metadata: {
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      repository: 'https://github.com/expressjs/express',
      license: 'MIT',
      documentationUrl: 'https://expressjs.com/',
    },
  },
  {
    name: 'webpack',
    version: '5.75.0',
    category: 'tool',
    type: 'development',
    source: 'npm',
    scope: 'global',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'utility',
      functionsUsed: ['bundle', 'watch'],
    },
    platformCompatibility: {
      languages: ['Node.js', 'JavaScript'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    lifecycle: {
      loadTime: 'manual',
      updates: 'automatic',
    },
    security: {
      isTrusted: true,
      vulnerabilities: [],
    },
    metadata: {
      description:
        'A static module bundler for modern JavaScript applications.',
      repository: 'https://github.com/webpack/webpack',
      license: 'MIT',
      documentationUrl: 'https://webpack.js.org/',
    },
  },
  {
    name: 'stdio.h',
    version: 'default for headers',
    category: 'header',
    type: 'runtime',
    source: 'system',
    scope: 'local',
    resolution: {
      method: 'header',
      path: '/usr/include/stdio.h',
    },
    usage: {
      context: 'utility',
      functionsUsed: ['printf', 'scanf'],
    },
    platformCompatibility: {
      languages: ['C'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    lifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isTrusted: true,
    },
    metadata: {
      description: 'Standard Input/Output library for C programming.',
      license: 'Standard C Library',
    },
  },
  {
    name: 'React',
    version: '^18.2.0',
    category: 'framework',
    type: 'runtime',
    source: 'cdn',
    scope: 'module',
    resolution: {
      method: 'import',
      alias: 'React',
    },
    usage: {
      context: 'controller',
      functionsUsed: ['useState', 'useEffect'],
      modulesUsed: ['ReactDOM', 'React'],
    },
    platformCompatibility: {
      languages: ['JavaScript', 'TypeScript'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    lifecycle: {
      loadTime: 'lazy',
      updates: 'automatic',
    },
    security: {
      isTrusted: true,
    },
    metadata: {
      description: 'A JavaScript library for building user interfaces.',
      repository: 'https://github.com/facebook/react',
      license: 'MIT',
      documentationUrl: 'https://reactjs.org/',
    },
  },
  {
    name: 'pytest',
    version: '^7.2.0',
    category: 'tool',
    type: 'development',
    source: 'external',
    scope: 'module',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'test',
    },
    platformCompatibility: {
      languages: ['Python'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    lifecycle: {
      loadTime: 'manual',
      updates: 'manual',
    },
    security: {
      isTrusted: true,
    },
    metadata: {
      description: 'A framework for writing and running Python tests.',
      repository: 'https://github.com/pytest-dev/pytest',
      license: 'MIT',
      documentationUrl: 'https://docs.pytest.org/',
    },
  },
  {
    name: 'NVIDIA CUDA Toolkit',
    version: '12.1',
    category: 'core',
    type: 'runtime',
    source: 'system',
    scope: 'global',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'core',
    },
    platformCompatibility: {
      languages: ['C++', 'Python'],
      os: ['Linux', 'Windows'],
      architectures: ['x86_64'],
    },
    lifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isTrusted: true,
    },
    metadata: {
      description: 'Development toolkit for GPU-accelerated applications.',
      repository: 'https://developer.nvidia.com/cuda-toolkit',
      license: 'Proprietary',
      documentationUrl: 'https://docs.nvidia.com/cuda/',
    },
  },
];

export const defaultDependency: DependencyDescriptor = {
  name: 'Unknown',
  version: 'N/A',
  category: 'custom',
  type: 'runtime',
  source: 'custom',
  scope: 'local',
  resolution: {
    method: 'other',
  },
  usage: {
    context: 'other',
  },
  platformCompatibility: {
    languages: [],
    os: [],
    architectures: [],
  },
  lifecycle: {
    loadTime: 'manual',
    updates: 'manual',
  },
  security: {
    isTrusted: false,
  },
  metadata: {
    description: 'No metadata available.',
  },
};

export function getDependencyByName(
  names: string[],
  resources: DependencyDescriptor[],
): DependencyDescriptor[] {
  const foundDependencies = names
    .map((name) => resources.find((dependency) => dependency.name === name))
    .filter((dependency): dependency is DependencyDescriptor => !!dependency); // Filter out undefined

  const missingCount = names.length - foundDependencies.length;

  // Include defaultDependency only once if there are missing items
  if (missingCount > 0) {
    return [...foundDependencies, defaultDependency];
  }

  return foundDependencies;
}
