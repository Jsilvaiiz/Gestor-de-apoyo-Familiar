
import { useEffect, useState } from "react";

import {
  editarFamilia,
  type Familia,
} from "../utils/familias";

import {
  leerEtiquetas,
  type Etiqueta,
} from "../utils/etiquetas";

interface Props {
  familia: Familia;
  onActualizar: () => void;
}

export default function FamiliaEtiquetas({
  familia,
  onActualizar,
}: Props) {
  const [catalogo, setCatalogo] = useState<Etiqueta[]>([]);
  const [seleccionada, setSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await leerEtiquetas();

        if (activo) {
          setCatalogo(datos);
          setError("");
        }
      } catch (err) {
        if (activo) {
          setError(
            "No se pudieron cargar las etiquetas: " +
              String(err)
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  const asignadas = familia.etiquetas ?? [];

  // Reconocer IDs nuevos y nombres antiguos
  function obtenerEtiqueta(valor: string) {
    return catalogo.find(
      (etiqueta) =>
        etiqueta.id === valor ||
        etiqueta.nombre.toLowerCase() ===
          valor.toLowerCase()
    );
  }

  // Convertir las etiquetas reconocidas a IDs
  function normalizarEtiquetas(valores: string[]) {
    return Array.from(
      new Set(
        valores.map(
          (valor) => obtenerEtiqueta(valor)?.id ?? valor
        )
      )
    );
  }

  const idsAsignados = normalizarEtiquetas(asignadas);

  // Solo ofrecer etiquetas activas y no asignadas
  const disponibles = catalogo.filter(
    (etiqueta) =>
      etiqueta.activa &&
      !idsAsignados.includes(etiqueta.id)
  );

  async function guardarCambios(nuevas: string[]) {
    if (guardando) return false;

    setGuardando(true);
    setError("");

    try {
      await editarFamilia({
        ...familia,
        etiquetas: nuevas,
      });

      onActualizar();
      return true;
    } catch (err) {
      setError(
        "No se pudieron guardar los cambios: " +
          String(err)
      );
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function agregarEtiqueta() {
    if (!seleccionada || guardando) return;

    // Comprobar que aún está activa
    const actuales = await leerEtiquetas().catch(() => null);

    if (!actuales) {
      setError("No se pudo comprobar el catálogo.");
      return;
    }

    const etiqueta = actuales.find(
      (e) => e.id === seleccionada && e.activa
    );

    if (!etiqueta) {
      setError("Esta etiqueta ya no está disponible.");
      setCatalogo(actuales);
      setSeleccionada("");
      return;
    }

    const nuevas = normalizarEtiquetas([
      ...asignadas,
      etiqueta.id,
    ]);

    const correcto = await guardarCambios(nuevas);

    if (correcto) {
      setSeleccionada("");
    }
  }

  async function quitarEtiqueta(valor: string) {
    const etiqueta = obtenerEtiqueta(valor);

    const restantes = asignadas.filter((actual) => {
      if (actual === valor) return false;

      // Quitar también una asignación duplicada
      // que use el nombre antiguo en vez del ID
      if (etiqueta) {
        return obtenerEtiqueta(actual)?.id !== etiqueta.id;
      }

      return true;
    });

    await guardarCambios(normalizarEtiquetas(restantes));
  }

  return (
    <section className="mt-4 rounded-lg border border-zinc-700 p-4">
      <h4 className="mb-3 font-semibold">
        Etiquetas de seguimiento
      </h4>

      {/* ETIQUETAS ASIGNADAS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {asignadas.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Esta familia no tiene etiquetas asignadas.
          </p>
        ) : (
          asignadas.map((valor, indice) => {
            const etiqueta = obtenerEtiqueta(valor);

            return (
              <span
                key={`${valor}-${indice}`}
                className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white"
                style={{
                  backgroundColor:
                    etiqueta?.color ?? "#52525b",
                }}
              >
                {etiqueta?.nombre ?? valor}

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => quitarEtiqueta(valor)}
                  aria-label={`Quitar ${
                    etiqueta?.nombre ?? valor
                  }`}
                  className="!border-0 !bg-transparent !p-0 !shadow-none"
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* SELECTOR DE ETIQUETAS */}
      {cargando ? (
        <p className="text-sm text-zinc-400">
          Cargando etiquetas...
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            value={seleccionada}
            disabled={guardando}
            onChange={(e) =>
              setSeleccionada(e.target.value)
            }
            className="min-w-0 flex-1 rounded-lg bg-zinc-900 p-2 text-white"
          >
            <option value="">
              Seleccionar etiqueta...
            </option>

            {disponibles.map((etiqueta) => (
              <option
                key={etiqueta.id}
                value={etiqueta.id}
              >
                {etiqueta.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!seleccionada || guardando}
            onClick={agregarEtiqueta}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-400"
        >
          {error}
        </p>
      )}
    </section>
  );
}
