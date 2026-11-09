
import { useEffect, useRef, useState } from "react";

import {
  CalendarDays,
  Users,
  UserPlus,
  Ellipsis,
  Tags,
} from "lucide-react";

type Vista =
  | "calendario"
  | "FamiliaList"
  | "FamiliaForm"
  | "AdministradorEtiquetas";

interface NavbarProps {
  vistaActual: Vista;
  fechaSeleccionada: Date;
  onCambiarVista: (vista: Vista) => void;
  onVolverAHoy: () => void;
}

export function Navbar({
  vistaActual,
  fechaSeleccionada,
  onCambiarVista,
  onVolverAHoy,
}: NavbarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    function cerrarAlHacerClicFuera(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuAbierto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      cerrarAlHacerClicFuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarAlHacerClicFuera
      );
    };
  }, []);

  // Cerrar menú al presionar Escape
  useEffect(() => {
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, []);

  function cambiarVista(vista: Vista) {
    onCambiarVista(vista);
    setMenuAbierto(false);
  }

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

      {/* Fecha actual */}
      <div className="min-w-0 text-left">
        <button
          type="button"
          onClick={() => {
            setMenuAbierto(false);
            onVolverAHoy();
          }}
          title="Volver al calendario de hoy"
          className="!bg-transparent !border-0 !shadow-none text-left hover:text-blue-300"
        >
          <span className="block text-xs text-zinc-400">
            Fecha actual
          </span>

          <span className="block text-sm font-semibold capitalize">
            {fechaActual}
          </span>
        </button>
      </div>

      {/* Fecha seleccionada */}
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

        {/* Calendario */}
        <button
          type="button"
          onClick={() => cambiarVista("calendario")}
          aria-label="Ir al calendario"
          title="Calendario"
          className={estiloBoton(vistaActual === "calendario")}
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>

        {/* Familias */}
        <button
          type="button"
          onClick={() => cambiarVista("FamiliaList")}
          className={estiloBoton(vistaActual === "FamiliaList")}
        >
          <Users size={16} aria-hidden="true" />
          <span>Familias</span>
        </button>

        {/* Registrar familia */}
        <button
          type="button"
          onClick={() => cambiarVista("FamiliaForm")}
          className={estiloBoton(vistaActual === "FamiliaForm")}
        >
          <UserPlus size={16} aria-hidden="true" />
          <span>Registrar familia</span>
        </button>

        {/* Menú de herramientas */}
        <div className="relative" ref={menuRef}>

          <button
            type="button"
            title="Más opciones"
            aria-label="Abrir herramientas"
            aria-expanded={menuAbierto}
            aria-haspopup="menu"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className={estiloBoton(
              menuAbierto ||
                vistaActual === "AdministradorEtiquetas"
            )}
          >
            <Ellipsis size={20} aria-hidden="true" />
          </button>

          {menuAbierto && (
            <div
              role="menu"
              aria-label="Herramientas"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-zinc-700 bg-neutral-900 p-2 shadow-xl"
            >
              <p className="px-3 py-2 text-xs font-medium text-zinc-400">
                Herramientas
              </p>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  cambiarVista("AdministradorEtiquetas")
                }
                className="flex w-full items-center gap-2 rounded-lg !border-0 !bg-transparent px-3 py-2 text-left text-sm text-zinc-200 !shadow-none hover:!bg-zinc-800 hover:text-white"
              >
                <Tags size={17} aria-hidden="true" />
                <span>Administrar etiquetas</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
