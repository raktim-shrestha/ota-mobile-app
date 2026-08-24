module.exports = {
  preset: '@react-native/jest-preset',
  // pnpm hoists into node_modules/.pnpm/<pkg+ver>/node_modules/<pkg>
  // The preset's transformIgnorePatterns only covers flat node_modules.
  // Override to also allow @react-native packages inside .pnpm nested paths.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|jest-react-native|react-native|@react-native|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-blob-util|react-native-config|zustand))',
  ],
};
