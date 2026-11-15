import { useEffect } from "react";
import {
  CalendarDays,
  ListChecks,
  Tags,
  Users,
  UserPlus,
  X,
} from "lucide-react";

export type Vista =
  | "calendario"
  | "FamiliaList"
  | "FamiliaForm"
  | "AdministradorEtiquetas"
  | "VisitasList";

interface BarraLateralProps {
  abierta: boolean;
  vistaActual: Vista;
  onCambiarVista: (vista: Vista) => void;
  onCerrar: () => void;
}

export default function BarraLateral({
  abierta,
  vistaActual,
  onCambiarVista,
  onCerrar,
}: BarraLateralProps) {
  useEffect(() => {
    if (!abierta) return;

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  const estiloOpcion = (vista: Vista) =>
    `flex w-full items-center gap-3 !border-0 !px-3 !py-2.5 !text-left !shadow-none ${
      vistaActual === vista
        ? "!bg-zinc-800 text-white"
        : "!bg-transparent text-zinc-300 hover:!bg-zinc-800 hover:text-white"
    }`;

  function elegirVista(vista: Vista) {
    onCambiarVista(vista);
    onCerrar();
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navegación principal"
        className="flex h-full w-72 max-w-[85vw] flex-col bg-neutral-900 p-4 text-white shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between border-b border-zinc-700 pb-3">
          <h2 className="text-sm font-semibold">Navegación</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="!border-0 !bg-transparent !p-2 !shadow-none text-zinc-400 hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <section>
          <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Visitas
          </h3>
          <button
            type="button"
            onClick={() => elegirVista("VisitasList")}
            className={estiloOpcion("VisitasList")}
          >
            <ListChecks size={18} aria-hidden="true" />
            <span>Lista de visitas</span>
          </button>
        </section>

        <section className="mt-6 border-t border-zinc-700 pt-4">
          <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Otros componentes
          </h3>
          <button
            type="button"
            onClick={() => elegirVista("calendario")}
            className={estiloOpcion("calendario")}
          >
            <CalendarDays size={18} aria-hidden="true" />
            <span>Calendario</span>
          </button>
          <button
            type="button"
            onClick={() => elegirVista("AdministradorEtiquetas")}
            className={estiloOpcion("AdministradorEtiquetas")}
          >
            <Tags size={18} aria-hidden="true" />
            <span>Administrar etiquetas</span>
          </button>
          <button
            type="button"
            onClick={() => elegirVista("FamiliaList")}
            className={estiloOpcion("FamiliaList")}
          >
            <Users size={18} aria-hidden="true" />
            <span>Administrar familias</span>
          </button>
          <button
            type="button"
            onClick={() => elegirVista("FamiliaForm")}
            className={estiloOpcion("FamiliaForm")}
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>Registrar familia</span>
          </button>
        </section>
      </aside>
    </div>
  );
}
