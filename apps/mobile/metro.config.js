const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for additional asset extensions if needed
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif');

module.exports = config;