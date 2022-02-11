// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 120000,
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/out/", "<rootDir>/build/"],
};
