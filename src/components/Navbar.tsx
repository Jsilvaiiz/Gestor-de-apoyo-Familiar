
import React from 'react';
import { CalendarDays, Users, UserPlus } from 'lucide-react';

interface NavbarProps {
  vistaActual: "calendario" | "FamiliaList" | "FamiliaForm";
  fechaSeleccionada: Date;
  onCambiarVista: (
    vista: "calendario" | "FamiliaList" | "FamiliaForm"
  ) => void;
  onVolverAHoy: () => void;
}

export function Navbar({
  vistaActual,
  fechaSeleccionada,
  onCambiarVista,
  onVolverAHoy,
}: NavbarProps) {

  const formatoFecha = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString("es-CL", {
      month: "long",
    });
    const anio = fecha.getFullYear();

    return `${dia} de ${mes} de ${anio}`;
  };

  const fechaActual = formatoFecha(new Date());
  const fechaElegida = formatoFecha(fechaSeleccionada);

  const estiloBoton = (activo: boolean) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm
     transition-colors !border-0 !shadow-none
     ${
       activo
         ? "!bg-zinc-800 text-white"
         : "!bg-transparent text-zinc-300 hover:!bg-zinc-800 hover:text-white"
     }`;

  return (
    <nav className="grid w-full shrink-0 grid-cols-3 items-center gap-3 border-b border-zinc-800 bg-neutral-900 px-5 py-3 text-white">

      {/* Fecha actual: regresar al día de hoy */}
      <div className="min-w-0 text-left">
        <button
          type="button"
          onClick={onVolverAHoy}
          title="Volver al calendario de hoy"
          className="!bg-transparent !border-0 !shadow-none
                     text-left hover:text-blue-300"
        >
          <span className="block text-xs text-zinc-400">
            Fecha actual
          </span>

          <span className="block text-sm font-semibold capitalize">
            {fechaActual}
          </span>
        </button>
      </div>

      {/* Fecha seleccionada en el calendario */}
      <div className="min-w-0 text-center">
        <span className="block text-xs text-zinc-400">
          Fecha seleccionada
        </span>

        <span className="block text-sm font-semibold capitalize">
          {fechaElegida}
        </span>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-end gap-2">

        <button
          type="button"
          onClick={() => onCambiarVista("calendario")}
          aria-label="Ir al calendario"
          title="Calendario"
          className={estiloBoton(vistaActual === "calendario")}
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onCambiarVista("FamiliaList")}
          className={estiloBoton(vistaActual === "FamiliaList")}
        >
          <Users size={16} aria-hidden="true" />
          <span>Familias</span>
        </button>

        <button
          type="button"
          onClick={() => onCambiarVista("FamiliaForm")}
          className={estiloBoton(vistaActual === "FamiliaForm")}
        >
          <UserPlus size={16} aria-hidden="true" />
          <span>Registrar familia</span>
        </button>

      </div>
    </nav>
  );
}

export default Navbar;
