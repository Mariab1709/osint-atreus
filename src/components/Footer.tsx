import { useState } from 'react';
import Toast from './Toast';

export default function Footer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <footer className="border-t border-slate-900 bg-[#070A11] px-4 md:px-8 py-6 text-xs text-slate-500 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h5 className="font-extrabold text-[10px] text-slate-400 tracking-wider">ASTRAEUS INTELLIGENCE</h5>
          <p>© {new Date().getFullYear()} Astraeus Intelligence OSINT. Institutional Grade Security.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 font-semibold">
          <a
            href="https://github.com/Mariab1709/osint-atreus/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            Documentación
          </a>
          <a
            href="mailto:astraeusosint@gmail.com"
            className="hover:text-slate-300 transition-colors"
          >
            Soporte Técnico
          </a>
          <button
            onClick={() => triggerToast('Página legal en construcción')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Términos de Servicio
          </button>
          <button
            onClick={() => triggerToast('Página legal en construcción')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Privacidad
          </button>
        </div>
      </div>

      <Toast show={showToast} message={toastMessage} />
    </footer>
  );
}
