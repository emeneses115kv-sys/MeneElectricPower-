const fs = require('fs');
let content = fs.readFileSync('src/components/canvas/ElectricalNodeComponent.tsx', 'utf8');

const customSvgCode = `
      {node.type === 'custom_component' && node.properties.customPaths && (
        <div className="my-1.5 p-1 bg-[#0F1115] rounded border border-[#2A2D35] flex items-center justify-center">
          <svg viewBox="0 0 400 250" className="w-full h-12" preserveAspectRatio="xMidYMid meet">
            {node.properties.customPaths.map((p, i) => (
              <path key={i} d={p} fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        </div>
      )}
      
      {/* Título del componente */}
`;

content = content.replace("      {/* Título del componente */}", customSvgCode);

fs.writeFileSync('src/components/canvas/ElectricalNodeComponent.tsx', content);
