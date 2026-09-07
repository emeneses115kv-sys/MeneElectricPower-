const fs = require('fs');
let content = fs.readFileSync('src/components/symbols/SymbolCatalogModal.tsx', 'utf8');

const regex = /<div className="flex items-center gap-1 overflow-x-auto pb-0\.5 text-xs font-mono">[\s\S]*?<\/div>\s*\{\/\* Barra de control de selección múltiple \*\/\}/;

const newBlock = `<div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs font-mono">
            {SYMBOL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={\`px-2 py-0.5 rounded font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 \${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1D23] border border-[#2A2D35] text-[#888] hover:text-[#AAA]'
                }\`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('custom')}
              className={\`px-2 py-0.5 rounded font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 \${
                selectedCategory === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1A1D23] border border-[#2A2D35] text-[#888] hover:text-[#AAA]'
              }\`}
            >
              <span>Librería de Usuario</span>
            </button>
          </div>
          {/* Barra de control de selección múltiple */}`;

content = content.replace(regex, newBlock);
fs.writeFileSync('src/components/symbols/SymbolCatalogModal.tsx', content);
