// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  transformIgnorePatterns: [
      'node_modules/(?!(expo|expo-web-browser|expo-modules-core|@react-native|react-native|@expo|@unimodules)/)'
    ],
};
