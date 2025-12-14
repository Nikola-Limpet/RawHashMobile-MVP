const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports for better-auth
config.resolver.unstable_enablePackageExports = true;

// Add condition names for ESM resolution
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
];

module.exports = withNativeWind(config, { input: "./global.css" });
