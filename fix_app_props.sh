sed -i 's/isLayersOpen={isLayersOpen}/isLayersOpen={isLayersOpen}\n        isDesignerOpen={isDesignerOpen}\n        onToggleDesigner={() => setIsDesignerOpen(!isDesignerOpen)}/g' src/App.tsx
