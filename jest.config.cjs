module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.ts$": "ts-jest" },
  moduleNameMapper: { "(.*).js$": ["$1"] },
  moduleFileExtensions: ["js", "mjs", "ts"],
  transformIgnorePatterns: [],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/types/grammar.ts"],
  coverageDirectory: "./coverage",
};
