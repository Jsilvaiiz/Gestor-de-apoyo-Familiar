
import { useEffect, useState } from "react";
import {
  leerEtiquetas,
  type Etiqueta,
} from "../utils/etiquetas";

interface Props {
  seleccionada: string;
  onCambiar: (id: string) => void;
  onCargar: (etiquetas: Etiqueta[]) => void;
}

export default function FiltroEtiquetas({
  seleccionada,
  onCambiar,
  onCargar,
}: Props) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await leerEtiquetas();
        setEtiquetas(datos);
        onCargar(datos);
      } catch (err) {
        setError("No se pudieron cargar las etiquetas.");
        console.error(err);
      }
    }

    void cargar();
  }, [onCargar]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label htmlFor="filtro-etiquetas" className="text-sm">
        Filtrar por etiqueta:
      </label>

      <select
        id="filtro-etiquetas"
        value={seleccionada}
        onChange={(e) => onCambiar(e.target.value)}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-white"
      >
        <option value="">Todas las etiquetas</option>

        {etiquetas.map((etiqueta) => (
          <option key={etiqueta.id} value={etiqueta.id}>
            {etiqueta.nombre}
            {!etiqueta.activa ? " (desactivada)" : ""}
          </option>
        ))}
      </select>

      {seleccionada && (
        <button
          type="button"
          onClick={() => onCambiar("")}
          className="rounded-lg bg-zinc-700 px-3 py-2 text-sm"
        >
          Limpiar filtro
        </button>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
