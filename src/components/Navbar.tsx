
import { useState } from "react";

import {
  CalendarDays,
  Menu,
} from "lucide-react";
import SnippetAlertas from "./SnippetAlertas";
import BarraLateral, { type Vista } from "./BarraLateral";
import type { SesionProgramada } from "../utils/rutaRegular";

interface NavbarProps {
  vistaActual: Vista;
  fechaSeleccionada: Date;
  onCambiarVista: (vista: Vista) => void;
  onVolverAHoy: () => void;
  onIrASesion: (sesion: SesionProgramada) => void;
  onIrAEtiqueta: (fecha: Date) => void;
}

export function Navbar({
  vistaActual,
  fechaSeleccionada,
  onCambiarVista,
  onVolverAHoy,
  onIrASesion,
  onIrAEtiqueta,
}: NavbarProps) {
  const [barraLateralAbierta, setBarraLateralAbierta] = useState(false);

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
  const nombreVista: Record<Vista, string> = {
    calendario: "Calendario",
    FamiliaList: "Familias",
    FamiliaForm: "Registrar familias",
    AdministradorEtiquetas: "Administrar etiquetas",
    VisitasList: "Lista de visitas",
  };

  return (
    <>
    <nav className="grid w-full shrink-0 grid-cols-3 items-center gap-3 !rounded-none bg-neutral-900 px-5 py-3 text-white">

      <div className="flex min-w-0 items-center gap-2 text-left">
        <button
          type="button"
          onClick={() => setBarraLateralAbierta(true)}
          aria-label="Abrir navegación"
          aria-expanded={barraLateralAbierta}
          aria-haspopup="dialog"
          title="Abrir navegación"
          className="!border-0 !bg-transparent !p-2 !shadow-none text-zinc-300 hover:text-white"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            onVolverAHoy();
          }}
          title="Volver al calendario de hoy"
          className="!bg-transparent !border-0 !shadow-none text-left"
        >
          <span className="block truncate text-sm font-semibold text-white">
            {nombreVista[vistaActual]}
          </span>

          <span className="block truncate text-xs capitalize text-zinc-400">
            {fechaActual}
          </span>
        </button>
        <SnippetAlertas
          onSeleccionarSesion={onIrASesion}
          onSeleccionarEtiqueta={onIrAEtiqueta}
        />
      </div>

      <div className="min-w-0 text-center">
        <span className="block text-xs text-zinc-400">
          Fecha seleccionada
        </span>

        <span className="block text-sm font-semibold capitalize">
          {fechaElegida}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onCambiarVista("calendario")}
          aria-label="Ir al calendario"
          title="Calendario"
          className="!border-0 !bg-transparent !p-2 !shadow-none text-zinc-300 hover:text-white"
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
    <BarraLateral
      abierta={barraLateralAbierta}
      vistaActual={vistaActual}
      onCambiarVista={onCambiarVista}
      onCerrar={() => setBarraLateralAbierta(false)}
    />
    </>
  );
}

export default Navbar;
