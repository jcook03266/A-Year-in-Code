/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only run tests on .ts files
  testMatch: ["**/?(*.)+(spec|test).ts"],
};
