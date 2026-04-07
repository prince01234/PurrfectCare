module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup/jest.setup.js"],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
