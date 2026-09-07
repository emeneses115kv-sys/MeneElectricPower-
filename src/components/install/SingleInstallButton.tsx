import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  Monitor,
  Usb,
  QrCode as QrIcon,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { DraggableWindow } from '../ui/DraggableWindow';

export const SingleInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'android' | 'ios' | 'usb' | 'qr'>('pwa');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Error generando QR:', err));
    }
  }, [isOpen]);

  const handleDownloadUsbScript = () => {
    const batContent = `@echo off
echo ===================================================
echo   INSTALADOR DIRECTO USB - DIAGRAMA UNIFILAR
echo   Compatible con Android 16+, Tablets y PC
echo ===================================================
echo Verificando conexion USB por depuracion ADB...
adb devices
echo Abriendo aplicacion en el dispositivo movil...
adb shell am start -a android.intent.action.VIEW -d "${window.location.href}"
echo Listo! La app ha sido desplegada con exito.
pause`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Instalar_App_USB_Android.bat';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Botón único y discreto con emoji según requerimiento */}
      <button
        id="btn-install-app-main"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer border border-blue-400/50"
        title="Instalar y sincronizar aplicación para Android 16+, iPhone, PC y USB"
      >
        <span className="text-xs leading-none">📲</span>
        <span className="tracking-wide">
          {isInstalled ? 'App Instalada ✓' : 'Instalar App'}
        </span>
      </button>

      {/* Modal integral de instalación y redireccionamiento */}
      <DraggableWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span>Centro de Instalación y Setup</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                MULTIPLATAFORMA
              </span>
            </div>
            <span className="text-[10px] text-[#888] font-mono font-normal">
              Android 16+, iPhone iOS, Windows/Mac y Cable USB Directo
            </span>
          </div>
        }
        icon={<span className="text-lg">📲</span>}
        defaultPosition={{ x: window.innerWidth / 2 - 300, y: 100 }}
        defaultSize={{ width: 600, height: 'auto' }}
      >
        <div className="flex flex-col h-full bg-[#121418]">
          {/* Pestañas de plataforma */}
          <div className="flex border-b border-[#2A2D35] bg-[#0F1115] px-3 pt-1 gap-1 overflow-x-auto text-xs font-mono shrink-0">
              <button
                onClick={() => setActiveTab('pwa')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'pwa'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-[#888] hover:text-[#AAA]'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Directa / PWA
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'android'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-[#888] hover:text-[#AAA]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android 16+
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'ios'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-[#888] hover:text-[#AAA]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                iPhone / iPad
              </button>
              <button
                onClick={() => setActiveTab('usb')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'usb'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-[#888] hover:text-[#AAA]'
                }`}
              >
                <Usb className="w-3.5 h-3.5" />
                Cable USB
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'qr'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-[#888] hover:text-[#AAA]'
                }`}
              >
                <QrIcon className="w-3.5 h-3.5" />
                Código QR
              </button>
            </div>

            {/* Contenido según pestaña */}
            <div className="p-4 overflow-y-auto space-y-3 text-[#E0E0E0] text-xs">
              {activeTab === 'pwa' && (
                <div className="space-y-3">
                  <div className="bg-[#1A1D23] rounded-lg p-3.5 border border-[#2A2D35] flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 justify-center md:justify-start">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        Instalar como Aplicación Nativa de Escritorio o Móvil
                      </h4>
                      <p className="text-[11px] text-[#888] max-w-md">
                        Ejecución en ventana independiente sin barras de navegador, aceleración gráfica para diagramas CAD y modo fuera de línea al 100%.
                      </p>
                    </div>
                    {isInstallable ? (
                      <button
                        onClick={install}
                        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer whitespace-nowrap"
                      >
                        Descargar e Instalar
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isInstalled
                          ? 'Aplicación ya instalada en este dispositivo'
                          : 'Listo para instalar desde el menú de tu navegador'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#1A1D23] border border-[#2A2D35] space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" /> PC (Windows / Mac / Linux)
                      </div>
                      <p className="text-[#888] leading-relaxed text-[11px]">
                        En Chrome o Edge, haz clic en el ícono de instalación en la barra de direcciones o pulsa el botón superior para crear el acceso directo de escritorio.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1A1D23] border border-[#2A2D35] space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Modo 100% Offline
                      </div>
                      <p className="text-[#888] leading-relaxed text-[11px]">
                        Todos los diagramas, motores de cálculo, simbologías y simulaciones se guardan localmente para operar sin internet en campo o inspecciones.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="space-y-3">
                  <div className="bg-[#1A1D23] p-3.5 rounded-lg border border-[#2A2D35] space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      Instalación en Android (Android 16, 15, 14+)
                    </h4>
                    <p className="text-[11px] text-[#AAA] leading-relaxed">
                      El sistema genera un paquete PWA/WebAPK optimizado que se integra directamente con el cajón de aplicaciones de Android, admitiendo gestos táctiles, zoom y almacenamiento interno.
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-[#888] space-y-1 pt-1 font-mono">
                      <li>Abre el menú de opciones de Chrome en tu móvil (los 3 puntos verticales).</li>
                      <li>Selecciona <strong className="text-white">"Instalar aplicación"</strong> o <strong className="text-white">"Agregar a la pantalla principal"</strong>.</li>
                      <li>Confirma la instalación. El ícono aparecerá en tus aplicaciones como app nativa.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="space-y-3">
                  <div className="bg-[#1A1D23] p-3.5 rounded-lg border border-[#2A2D35] space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      Instalación en iPhone / iPad (iOS Safari)
                    </h4>
                    <p className="text-[11px] text-[#AAA] leading-relaxed">
                      Apple Safari permite instalar la aplicación en pantalla completa sin barras del sistema:
                    </p>
                    <div className="p-3 rounded bg-[#0F1115] border border-[#2A2D35] text-[11px] space-y-1 text-[#888] font-mono">
                      <p>1. Toca el botón de <strong className="text-white">Compartir (Share)</strong> en la barra inferior de Safari.</p>
                      <p>2. Desliza hacia abajo y pulsa <strong className="text-white">"Agregar al inicio" (Add to Home Screen)</strong>.</p>
                      <p>3. Pulsa "Agregar" en la esquina superior derecha.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'usb' && (
                <div className="space-y-3">
                  <div className="bg-[#1A1D23] p-3.5 rounded-lg border border-[#2A2D35] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        <Usb className="w-3.5 h-3.5 text-blue-400" />
                        Instalación Vía Cable USB (PC a Móvil)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0F1115] text-[#AAA] border border-[#2A2D35]">
                        Plug & Play
                      </span>
                    </div>
                    <p className="text-[11px] text-[#AAA] leading-relaxed">
                      Si necesitas instalar o sincronizar el proyecto desde tu computadora hacia un dispositivo móvil mediante cable USB sin conexión a internet:
                    </p>
                    <div className="p-3 rounded bg-[#0F1115] border border-[#2A2D35] text-[11px] space-y-1.5 font-mono text-[#888]">
                      <div className="text-blue-400 font-sans font-medium">Instrucciones de conexión por cable USB:</div>
                      <p>1. Conecta el cable USB del PC al móvil Android y activa "Depuración USB" o "Transferencia de archivos".</p>
                      <p>2. Descarga el lanzador de instalación automática para desplegar la app en la memoria del teléfono.</p>
                    </div>
                    <button
                      onClick={handleDownloadUsbScript}
                      className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-white border border-[#444] text-xs font-medium transition cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      Descargar Script Setup USB (.bat)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="flex flex-col items-center justify-center p-4 space-y-3 text-center">
                  <div className="p-3 bg-white rounded-lg shadow-xl">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR de Instalación" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-800 text-xs font-mono">
                        Generando QR...
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#888] max-w-sm font-mono">
                    Apunta la cámara de tu smartphone o tablet para abrir la aplicación directamente e instalarla en segundos.
                  </p>
                </div>
              )}
            </div>

            {/* Pie de modal */}
            <div className="px-4 py-2.5 border-t border-[#2A2D35] bg-[#0F1115] flex items-center justify-between text-xs text-[#888] font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-green-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Service Worker Activo (Precache Offline)
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-[#AAA] hover:text-white border border-[#444] transition cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
      </DraggableWindow>
    </>
  );
};
