// Metro does not tree-shake barrel exports. Import only the icons we use rather
// than parsing/evaluating thousands of Tabler components during app startup.
function tablerDirectImports({types}) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value !== '@tabler/icons-react-native') return;
        if (!path.node.specifiers.every(item => types.isImportSpecifier(item))) return;
        path.replaceWithMultiple(path.node.specifiers.map(item =>
          types.importDeclaration(
            [types.importDefaultSpecifier(item.local)],
            types.stringLiteral(`@tabler/icons-react-native/${item.imported.name}`),
          ),
        ));
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [tablerDirectImports, 'react-native-worklets/plugin'],
};
