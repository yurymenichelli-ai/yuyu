const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Let Metro bundle the Porcupine wake-word model files as binary assets.
config.resolver.assetExts.push("ppn", "pv");

module.exports = config;
