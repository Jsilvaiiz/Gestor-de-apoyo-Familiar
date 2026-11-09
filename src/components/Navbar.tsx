import React from 'react';
import { CalendarDays, Users } from 'lucide-react';


interface NavbarProps {
  vistaActual: 'calendario' | 'FamiliaList' | 'FamiliaForm';
  onCambiarVista: (vista: 'calendario' | 'FamiliaList' | 'FamiliaForm') => void;
  onVolverAHoy: () => void;
}

export function Navbar({ vistaActual, onCambiarVista, onVolverAHoy }: NavbarProps) {
  const titulo = vistaActual === 'calendario' ? 'Ruta regular' : 'Familias';
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <nav className="grid w-full shrink-0 grid-cols-3 items-center border-b border-zinc-800 bg-neutral-900 px-5 py-2.5">
      <div className="min-w-0 text-left">
        <h1 className="truncate text-lg font-semibold tracking-wide text-zinc-200">
          {titulo}
        </h1>
      </div>

      <div className="text-center text-lg capitalize text-zinc-300">
        <button
          type="button"
          aria-label={`Ir a hoy: ${fecha}`}
          onClick={onVolverAHoy}
          className="!m-0 !border-0 !bg-transparent !px-0 !py-0 !shadow-none rounded-none text-lg capitalize text-zinc-300 hover:text-white "
        >
        {fecha}
        </button>
      </div>

      <div className="flex items-center justify-self-end gap-1">
        {/* <button
          type="button"
          title="Calendario"
          onClick={() => onCambiarVista('calendario')}
          className={`flex items-center gap-2 rounded-none px-3 py-1.5 text-xs font-medium transition !outline-none !shadow-none ${
            vistaActual === 'calendario'
              ? '!bg-zinc-900 text-white'
              : '!bg-transparent text-zinc-400 hover:!bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <CalendarDays size={16} aria-hidden="true" />
          <span>Calendario</span>
        </button> */}

        <button
          type="button"
          title="Familias"
          onClick={() => onCambiarVista('FamiliaList')}
          className={`flex items-center gap-2 rounded-none px-3 py-1.5 text-xs font-medium transition !outline-none !shadow-none ${
            vistaActual === 'FamiliaList'
              ? '!bg-zinc-900 text-white'
              : '!bg-transparent text-zinc-400 hover:!bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <Users size={16} aria-hidden="true" />
          <span>Familias</span>
        </button>

        <button
          type="button"
          title="Familias"
          onClick={() => onCambiarVista('FamiliaForm')}
          className={`flex items-center gap-2 rounded-none px-3 py-1.5 text-xs font-medium transition !outline-none !shadow-none ${
            vistaActual === 'FamiliaForm'
              ? '!bg-zinc-900 text-white'
              : '!bg-transparent text-zinc-400 hover:!bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <Users size={16} aria-hidden="true" />
          <span>Familias Formulario</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;