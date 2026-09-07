sed -i '/isDesignerOpen={isDesignerOpen}/d' src/App.tsx
sed -i '/onToggleDesigner={() => setIsDesignerOpen(!isDesignerOpen)}/d' src/App.tsx
