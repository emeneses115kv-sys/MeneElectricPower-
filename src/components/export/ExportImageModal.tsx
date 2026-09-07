import React, { useState } from 'react';
import { DraggableWindow } from '../ui/DraggableWindow';
import { DiagramViewMode } from '../../App';
import { Download, Image as ImageIcon } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: DiagramViewMode;
  onChangeView: (view: DiagramViewMode) => void;
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({
  isOpen,
  onClose,
  currentView,
  onChangeView
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'svg' | 'jpeg'>('png');
  const [selectedView, setSelectedView] = useState<DiagramViewMode>(currentView);

  const handleExport = async () => {
    setIsExporting(true);
    
    // Si la vista actual es diferente a la seleccionada, la cambiamos y esperamos un poco a que React renderice
    if (currentView !== selectedView) {
      onChangeView(selectedView);
      await new Promise(resolve => setTimeout(resolve, 800)); // Esperar al renderizado y a que carguen imágenes
    }

    try {
      const element = document.getElementById('electrical-canvas-container');
      if (!element) throw new Error('Canvas container not found');

      let dataUrl = '';
      if (selectedFormat === 'png') {
        dataUrl = await htmlToImage.toPng(element, { quality: 1, pixelRatio: 2, backgroundColor: '#0F1115' });
      } else if (selectedFormat === 'jpeg') {
        dataUrl = await htmlToImage.toJpeg(element, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0F1115' });
      } else if (selectedFormat === 'svg') {
        dataUrl = await htmlToImage.toSvg(element, { backgroundColor: '#0F1115' });
      }

      const link = document.createElement('a');
      link.download = `diagrama_electrico_${selectedView}.${selectedFormat}`;
      link.href = dataUrl;
      link.click();
      
      onClose();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Hubo un error al exportar la imagen.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Imagen del Diagrama"
      icon={<ImageIcon className="w-4 h-4 text-blue-400" />}
      defaultPosition={{ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 }}
      defaultSize={{ width: 320, height: 'auto' }}
      className="z-[9999]"
    >
      <div className="p-4 bg-[#121418] text-slate-200 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#AAA] mb-1 font-mono">Tipo de Diagrama</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedView('unifilar')}
              className={`py-2 px-3 text-xs rounded border transition font-medium ${
                selectedView === 'unifilar'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                  : 'bg-[#1A1D23] border-[#2A2D35] text-[#888] hover:border-[#444]'
              }`}
            >
              📐 Unifilar Clásico
            </button>
            <button
              onClick={() => setSelectedView('realista')}
              className={`py-2 px-3 text-xs rounded border transition font-medium ${
                selectedView === 'realista'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]'
                  : 'bg-[#1A1D23] border-[#2A2D35] text-[#888] hover:border-[#444]'
              }`}
            >
              🔌 Realista
            </button>
            <button
              onClick={() => setSelectedView('3d_isometric')}
              className={`py-2 px-3 text-xs rounded border transition font-medium col-span-2 ${
                selectedView === '3d_isometric'
                  ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                  : 'bg-[#1A1D23] border-[#2A2D35] text-[#888] hover:border-[#444]'
              }`}
            >
              🧊 Vista 3D Isométrica
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#AAA] mb-1 font-mono">Formato de Imagen</label>
          <select 
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as any)}
            className="w-full bg-[#1A1D23] border border-[#2A2D35] text-white text-xs p-2 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="png">PNG (Alta Calidad)</option>
            <option value="jpeg">JPEG (Menor Peso)</option>
            <option value="svg">SVG (Vectorial)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exportando...' : 'Descargar Imagen'}
        </button>
      </div>
    </DraggableWindow>
  );
};
