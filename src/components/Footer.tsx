
export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-[#070A11] px-4 md:px-8 py-6 text-xs text-slate-500 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h5 className="font-extrabold text-[10px] text-slate-400 tracking-wider">ASTRAEUS INTELLIGENCE</h5>
          <p>© {new Date().getFullYear()} Astraeus Intelligence OSINT. Institutional Grade Security.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 font-semibold">
          <a href="#" className="hover:text-slate-300 transition-colors">Documentación</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Soporte Técnico</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Términos de Servicio</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacidad</a>
        </div>
      </div>
    </footer>
  );
}
