import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalInformativoProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ModalInformativo({
  titulo,
  onClose,
  children,
}: ModalInformativoProps) {
  useEffect(() => {
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-informativo-titulo"
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto bg-neutral-900 p-6 text-zinc-200 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="modal-informativo-titulo"
            className="text-xl font-semibold text-white"
          >
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="!border-0 !bg-transparent !p-2 !shadow-none text-zinc-400 hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 text-sm leading-6">{children}</div>
      </section>
    </div>
  );
}
