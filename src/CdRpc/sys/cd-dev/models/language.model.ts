import type { LanguageDescriptor } from './cd-dev-descriptor.model';

export const languages: LanguageDescriptor[] = [
  {
    name: 'JavaScript',
    version: 'ES2022',
    releaseDate: '2022-06-01',
    type: 'interpreted',
    ecosystem: {
      defaultPackageManager: 'npm',
      frameworks: ['React', 'Angular', 'Vue'],
      community: {
        size: 2000000,
        forums: ['https://stackoverflow.com', 'https://dev.to'],
      },
    },
    paradigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    tooling: {
      buildTools: ['Webpack', 'Parcel', 'Rollup'],
      testingFrameworks: ['Jest', 'Mocha', 'Jasmine'],
      linters: ['ESLint', 'JSHint'],
      debuggers: ['Chrome DevTools', 'Node.js Inspector'],
    },
    features: {
      staticTyping: false,
      dynamicTyping: true,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'browser', 'mobile'],
      interoperability: ['Node.js', 'Deno'],
    },
    miscellaneous: {
      documentationStyle: 'JSDoc',
      fileExtensions: ['.js', '.mjs'],
      useCases: ['web development', 'server-side applications'],
    },
  },
  {
    name: 'Python',
    version: '3.11',
    releaseDate: '2022-10-03',
    type: 'interpreted',
    ecosystem: {
      defaultPackageManager: 'pip',
      frameworks: ['Django', 'Flask', 'FastAPI'],
      community: {
        size: 1500000,
        forums: ['https://python.org', 'https://reddit.com/r/python'],
      },
    },
    paradigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    tooling: {
      buildTools: ['PyInstaller', 'Setuptools'],
      testingFrameworks: ['unittest', 'pytest', 'nose'],
      linters: ['Pylint', 'flake8'],
      debuggers: ['PDB', 'PyCharm Debugger'],
    },
    features: {
      staticTyping: true,
      dynamicTyping: true,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'desktop', 'scientific computing'],
      interoperability: ['C', 'Java'],
    },
    miscellaneous: {
      documentationStyle: 'Sphinx',
      fileExtensions: ['.py'],
      useCases: ['data science', 'web development', 'automation'],
    },
  },
  {
    name: 'C++',
    version: '20',
    releaseDate: '2020-12-15',
    type: 'compiled',
    ecosystem: {
      defaultPackageManager: 'vcpkg',
      frameworks: ['Qt', 'Boost'],
      community: {
        size: 800000,
        forums: ['https://cplusplus.com', 'https://stackoverflow.com'],
      },
    },
    paradigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    tooling: {
      buildTools: ['CMake', 'Make'],
      testingFrameworks: ['Google Test', 'Catch2'],
      linters: ['Cppcheck', 'Clang-Tidy'],
      debuggers: ['GDB', 'LLDB'],
    },
    features: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'manual',
      platformSupport: ['server', 'desktop', 'embedded'],
      interoperability: ['C', 'Python'],
    },
    miscellaneous: {
      documentationStyle: 'Doxygen',
      fileExtensions: ['.cpp', '.h', '.hpp'],
      useCases: ['game development', 'system software', 'embedded systems'],
    },
  },
  {
    name: 'Go',
    version: '1.21',
    releaseDate: '2023-08-01',
    type: 'compiled',
    ecosystem: {
      defaultPackageManager: 'go modules',
      frameworks: ['Gin', 'Echo', 'Beego'],
      community: {
        size: 500000,
        forums: ['https://golang.org', 'https://golangweekly.com'],
      },
    },
    paradigms: {
      supportsOOP: false,
      supportsFunctional: false,
      supportsProcedural: true,
    },
    tooling: {
      buildTools: ['Go Build'],
      testingFrameworks: ['Go Test'],
      linters: ['Golint'],
      debuggers: ['Delve'],
    },
    features: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'cloud'],
      interoperability: ['C'],
    },
    miscellaneous: {
      documentationStyle: 'Godoc',
      fileExtensions: ['.go'],
      useCases: ['cloud computing', 'microservices', 'network programming'],
    },
  },
];

export const defaultLanguage: LanguageDescriptor = {
  name: 'Unknown',
  version: 'N/A',
  type: 'interpreted',
  ecosystem: {
    defaultPackageManager: 'N/A',
    frameworks: [],
    community: {
      size: 0,
      forums: [],
    },
  },
  paradigms: {
    supportsOOP: false,
    supportsFunctional: false,
    supportsProcedural: false,
  },
  tooling: {
    buildTools: [],
    testingFrameworks: [],
    linters: [],
    debuggers: [],
  },
  features: {
    staticTyping: false,
    dynamicTyping: false,
    memoryManagement: 'other',
    platformSupport: [],
    interoperability: [],
  },
  miscellaneous: {
    documentationStyle: 'N/A',
    fileExtensions: [],
    useCases: [],
  },
};

export function getLanguageByName(
  name: string,
  languages: LanguageDescriptor[],
): LanguageDescriptor {
  return (
    languages.find((language) => language.name === name) || defaultLanguage
  );
}
