const fs = require('fs');
let content = fs.readFileSync('src/components/symbols/SymbolCatalogModal.tsx', 'utf8');

const replacement = `
  const combinedCatalog: SymbolCatalogItem[] = [
    ...ELECTRICAL_SYMBOLS_CATALOG,
    ...customComponents.map(cc => ({
      type: 'custom_component' as const,
      name: cc.name,
      category: 'carga' as any,
      categoryLabel: 'Librería de Usuario',
      description: 'Componente personalizado',
      defaultProps: { customComponentId: cc.id },
      iconName: 'Box',
      symbolBadge: 'U',
    }))
  ];

  // Filtrado de símbolos
  const filteredSymbols = combinedCatalog.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory || (selectedCategory === 'custom' && item.categoryLabel === 'Librería de Usuario');
`;

content = content.replace(`  // Filtrado de símbolos\n  const filteredSymbols = ELECTRICAL_SYMBOLS_CATALOG.filter(item => {\n    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;`, replacement);

content = content.replace(/s\.type === item\.type/g, "s.type === item.type && (s.defaultProps?.customComponentId === item.defaultProps?.customComponentId)");
content = content.replace(/s\.type !== item\.type/g, "(s.type !== item.type || s.defaultProps?.customComponentId !== item.defaultProps?.customComponentId)");

fs.writeFileSync('src/components/symbols/SymbolCatalogModal.tsx', content);
