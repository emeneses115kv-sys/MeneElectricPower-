sed -i '/import { CustomComponentDesignerModal } from/d' src/App.tsx
sed -i '/import { getCustomComponents } from/d' src/App.tsx
sed -i "/import { CustomComponent } from '.\/types\/electrical';/d" src/App.tsx
sed -i "1i import { CustomComponentDesignerModal } from './components/canvas/CustomComponentDesignerModal';\nimport { getCustomComponents } from './utils/customComponentsDb';\nimport { CustomComponent } from './types/electrical';" src/App.tsx
