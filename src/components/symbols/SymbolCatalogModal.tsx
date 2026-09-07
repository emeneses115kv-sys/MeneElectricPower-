import React, { useState } from 'react';
import {
  ELECTRICAL_SYMBOLS_CATALOG,
  SYMBOL_CATEGORIES,
} from './catalogData';
import { SymbolCatalogItem, CustomComponent } from '../../types/electrical';
import {
  Search,
  Plus,
  Check,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { DraggableWindow } from '../ui/DraggableWindow';

interface SymbolCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSymbols: (symbols: SymbolCatalogItem[]) => void;
  customComponents?: CustomComponent[];
}

export const SymbolCatalogModal: React.FC<SymbolCatalogModalProps> = ({
  isOpen,
  onClose,
  onAddSymbols,
  customComponents = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbols, setSelectedSymbols] = useState<SymbolCatalogItem[]>([]);


  const combinedCatalog: SymbolCatalogItem[] = [
    ...ELECTRICAL_SYMBOLS_CATALOG,
    ...customComponents.map(cc => ({
      type: 'custom_component' as const,
      name: cc.name,
      category: 'carga' as any,
      categoryLabel: 'Librería de Usuario',
      description: 'Componente personalizado',
      defaultProps: { customComponentId: cc.id, customPaths: cc.paths },
      iconName: 'Box',
      symbolBadge: 'U',
    }))
  ];

  // Filtrado de símbolos
  const filteredSymbols = combinedCatalog.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory || (selectedCategory === 'custom' && item.categoryLabel === 'Librería de Usuario');

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSelectSymbol = (item: SymbolCatalogItem) => {
    if (selectedSymbols.some(s => s.type === item.type && (s.defaultProps?.customComponentId === item.defaultProps?.customComponentId))) {
      setSelectedSymbols(selectedSymbols.filter(s => (s.type !== item.type || s.defaultProps?.customComponentId !== item.defaultProps?.customComponentId)));
    } else {
      setSelectedSymbols([...selectedSymbols, item]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedSymbols.length === filteredSymbols.length) {
      setSelectedSymbols([]);
    } else {
      setSelectedSymbols([...filteredSymbols]);
    }
  };

  const handleAddSingle = (item: SymbolCatalogItem) => {
    onAddSymbols([item]);
  };

  const handleAddMultiple = () => {
    if (selectedSymbols.length > 0) {
      onAddSymbols(selectedSymbols);
      setSelectedSymbols([]);
    }
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo de Simbología y Equipos"
      icon={<Layers className="w-4 h-4 text-blue-400" />}
      defaultPosition={{ x: window.innerWidth - 550, y: 70 }}
      defaultSize={{ width: 500, height: 600 }}
    >
      <div className="flex flex-col h-full bg-[#121418]">
        {/* Buscador y selector rápido de categorías */}
        <div className="p-3 border-b border-[#2A2D35] bg-[#0F1115] space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#666]" />
            <input
              type="text"
              placeholder="Buscar por equipo, calibre (AWG/kcmil), breaker, medidor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-xs text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Categorías según semejanzas */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs font-mono">
            {SYMBOL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1D23] border border-[#2A2D35] text-[#888] hover:text-[#AAA]'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1A1D23] border border-[#2A2D35] text-[#888] hover:text-[#AAA]'
              }`}
            >
              <span>Librería de Usuario</span>
            </button>
          </div>
          {/* Barra de control de selección múltiple */}
          <div className="flex items-center justify-between pt-0.5 text-[11px] text-[#888] font-mono">
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1 hover:text-blue-400 transition cursor-pointer"
            >
              {selectedSymbols.length === filteredSymbols.length && filteredSymbols.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Seleccionar todos ({filteredSymbols.length})</span>
            </button>

            {selectedSymbols.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold font-mono">
                  {selectedSymbols.length} elegidos
                </span>
                <button
                  onClick={handleAddMultiple}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Agregar al Lienzo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de símbolos */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSymbols.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#666] font-mono">
              No se encontraron componentes eléctricos con ese criterio.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredSymbols.map(item => {
                const isSelected = selectedSymbols.some(s => s.type === item.type && (s.defaultProps?.customComponentId === item.defaultProps?.customComponentId));
                return (
                  <div
                    key={item.type}
                    onClick={() => toggleSelectSymbol(item)}
                    className={`p-2.5 rounded border transition cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-[#161920] border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-[#1A1D23] border-[#2A2D35] hover:border-[#444] hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-[#444] bg-[#0F1115] text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="text-xs font-bold text-white leading-snug">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-[#0F1115] text-[#AAA] border border-[#2A2D35] font-mono">
                        {item.defaultProps.conductorGauge || `${item.defaultProps.ratedCurrent}A`}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#888] mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#2A2D35] text-[10px]">
                      <span className="text-blue-400 font-mono">
                        {item.symbolBadge}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleAddSingle(item);
                        }}
                        className="px-2 py-0.5 rounded bg-[#2A2D35] hover:bg-blue-600 hover:text-white text-[#AAA] font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie con botón de inserción masiva */}
        <div className="p-2.5 border-t border-[#2A2D35] bg-[#0F1115] flex items-center justify-between text-xs shrink-0">
          <span className="text-[#888] text-[11px] font-mono">
            Selecciona componentes para agregarlos juntos.
          </span>
          <button
            disabled={selectedSymbols.length === 0}
            onClick={handleAddMultiple}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition cursor-pointer text-xs ${
              selectedSymbols.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-[#1A1D23] border border-[#2A2D35] text-[#666] cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Insertar Selección ({selectedSymbols.length})
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
