import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import AyudaContacto from "./AyudaContacto";
import PoliticasPrivacidad from "./PoliticasPrivacidad";
import TerminosUso from "./TerminosUso";

type Seccion = "politicas" | "ayuda" | "terminos" | null;

export default function BarraInferior() {
  const [seccionAbierta, setSeccionAbierta] = useState<Seccion>(null);
  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem("tema-aplicacion") === "claro"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = temaClaro ? "claro" : "oscuro";
    localStorage.setItem("tema-aplicacion", temaClaro ? "claro" : "oscuro");
  }, [temaClaro]);

  return (
    <>
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-zinc-800 bg-neutral-900 px-4 text-[11px] text-zinc-500">
        <button
          type="button"
          onClick={() => setTemaClaro((temaActual) => !temaActual)}
          aria-label={temaClaro ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
          title={temaClaro ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
          className="!border-0 !bg-transparent !p-0 !shadow-none text-zinc-400 hover:text-white"
        >
          {temaClaro ? (
            <Moon size={16} aria-hidden="true" />
          ) : (
            <Sun size={16} aria-hidden="true" />
          )}
        </button>
        <nav aria-label="Información" className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSeccionAbierta("politicas")}
            className="!border-0 !bg-transparent !p-0 !shadow-none hover:text-white hover:underline"
          >
            Políticas
          </button>
          <button
            type="button"
            onClick={() => setSeccionAbierta("ayuda")}
            className="!border-0 !bg-transparent !p-0 !shadow-none hover:text-white hover:underline"
          >
            Ayuda y contacto
          </button>
          <button
            type="button"
            onClick={() => setSeccionAbierta("terminos")}
            className="!border-0 !bg-transparent !p-0 !shadow-none hover:text-white hover:underline"
          >
            Términos de uso
          </button>
        </nav>
      </footer>

      {seccionAbierta === "politicas" && (
        <PoliticasPrivacidad onClose={() => setSeccionAbierta(null)} />
      )}
      {seccionAbierta === "ayuda" && (
        <AyudaContacto onClose={() => setSeccionAbierta(null)} />
      )}
      {seccionAbierta === "terminos" && (
        <TerminosUso onClose={() => setSeccionAbierta(null)} />
      )}
    </>
  );
}
