module.exports = {
  clearMocks: true,
  coverageProvider: "v8",
  moduleNameMapper: {
    '^@/(.*)
: '<rootDir>/src/$1',
  },
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/tests'],
  // The test environment that will be used for testing
  testEnvironment: 'node',
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/tests/**/*.test.js?(x)'],
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transform: {},
};
