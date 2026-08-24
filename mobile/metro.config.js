const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = __dirname;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // pnpm hoists/stores packages under the workspace root's node_modules/.pnpm,
  // symlinked into each package's node_modules. Metro needs to watch the
  // workspace root and be told about both node_modules locations, and to
  // follow symlinks, or it fails to resolve packages like @babel/runtime.
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    unstable_enableSymlinks: true,
  },
};

module.exports = withNativeWind(
  mergeConfig(getDefaultConfig(__dirname), config),
  {
    input: './global.css',
  },
);
