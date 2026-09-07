const fs = require('fs');
let content = fs.readFileSync('src/components/symbols/SymbolCatalogModal.tsx', 'utf8');

content = content.replace(
  "defaultProps: { customComponentId: cc.id },",
  "defaultProps: { customComponentId: cc.id, customPaths: cc.paths },"
);

fs.writeFileSync('src/components/symbols/SymbolCatalogModal.tsx', content);
