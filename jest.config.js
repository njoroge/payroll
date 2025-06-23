module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The default timeout of a test in milliseconds
  testTimeout: 10000, // Increased timeout just in case

  // A list of paths to directories that Jest should use to search for files in
  // This is the key change: telling Jest to look in server/node_modules
  moduleDirectories: [
    "node_modules", // Default
    "server/node_modules" // To find mongoose and other server dependencies
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  // This might not be strictly necessary if providing the pattern on CLI, but good for completeness
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],

  // A map from regular expressions to paths to transformers
  // transform: {}, // Default is usually fine for .js files (babel-jest)

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};
