/** @type {import('jest').Config} */
const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // The test environment that will be used for testing
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/(?!uuid|superagent)'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;