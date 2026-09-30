module.exports = {
  preset: '@react-native/jest-preset',
  resolver: 'react-native-reanimated/jest/resolver',
  setupFilesAfterEnv: ['./jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native-community|@react-native-async-storage|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-svg|@tabler/icons-react-native)/)',
  ],
};
