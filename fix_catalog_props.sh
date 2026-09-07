sed -i 's/import { SymbolCatalogItem/import { SymbolCatalogItem, CustomComponent/g' src/components/symbols/SymbolCatalogModal.tsx
sed -i 's/  onAddSymbols: (symbols: SymbolCatalogItem\[\]) => void;/  onAddSymbols: (symbols: SymbolCatalogItem[]) => void;\n  customComponents?: CustomComponent[];/g' src/components/symbols/SymbolCatalogModal.tsx
sed -i 's/  onAddSymbols,/  onAddSymbols,\n  customComponents = [],/g' src/components/symbols/SymbolCatalogModal.tsx
