
import { useState } from "react";

import {
  leerFamilias,
  editarFamilia,
  type Familia,
  type Observacion,
} from "../utils/familias";

interface Props {
  familia: Familia;
  onActualizar: () => void;
}

export default function FamiliaObservaciones({
  familia,
  onActualizar,
}: Props) {
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const observaciones = [...(familia.observaciones ?? [])].sort(
    (a, b) =>
      new Date(b.fechaCreacion).getTime() -
      new Date(a.fechaCreacion).getTime()
  );

  async function obtenerFamiliaActual() {
    const familias = await leerFamilias();

    const actual = familias.find(
      (registro) => registro.id === familia.id
    );

    if (!actual) {
      throw new Error("La familia ya no existe.");
    }

    return actual;
  }

  // Agregar una observación
  async function agregarObservacion() {
    const contenido = texto.trim();

    if (!contenido || guardando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const actual = await obtenerFamiliaActual();

      const nuevaObservacion: Observacion = {
        id: crypto.randomUUID(),
        texto: contenido,
        fechaCreacion: new Date().toISOString(),
      };

      await editarFamilia({
        ...actual,
        observaciones: [
          ...(actual.observaciones ?? []),
          nuevaObservacion,
        ],
      });

      setTexto("");
      setMensaje("Observación guardada correctamente.");
      onActualizar();
    } catch (err) {
      setError(
        "No se pudo guardar la observación: " +
          String(err)
      );
    } finally {
      setGuardando(false);
    }
  }

  // Eliminar una observación
  async function eliminarObservacion(id: string) {
    if (guardando) return;

    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta observación? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const actual = await obtenerFamiliaActual();

      const existe = (actual.observaciones ?? []).some(
        (observacion) => observacion.id === id
      );

      if (!existe) {
        throw new Error("La observación ya no existe.");
      }

      await editarFamilia({
        ...actual,
        observaciones: (actual.observaciones ?? []).filter(
          (observacion) => observacion.id !== id
        ),
      });

      setMensaje("Observación eliminada correctamente.");
      onActualizar();
    } catch (err) {
      setError(
        "No se pudo eliminar la observación: " +
          String(err)
      );
    } finally {
      setGuardando(false);
    }
  }

  function formatearFecha(fecha: string) {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return "Fecha no disponible";
    }

    return valor.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="mt-4 rounded-lg border border-zinc-700 p-4">
      <h4 className="mb-3 font-semibold">
        Observaciones de seguimiento
      </h4>

      {/* Nueva observación */}
      <div className="mb-4">
        <label
          htmlFor={`observacion-${familia.id}`}
          className="mb-2 block text-sm text-zinc-300"
        >
          Nueva observación
        </label>

        <textarea
          id={`observacion-${familia.id}`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribir una observación..."
          maxLength={2000}
          rows={3}
          disabled={guardando}
          className="w-full resize-y rounded-lg bg-zinc-900 p-3 text-white"
        />

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={agregarObservacion}
            disabled={!texto.trim() || guardando}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-40"
          >
            {guardando
              ? "Guardando..."
              : "Guardar observación"}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {mensaje && (
        <p role="status" className="mb-3 text-sm text-green-400">
          {mensaje}
        </p>
      )}

      {/* Historial */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold">
          Historial ({observaciones.length})
        </h5>

        {observaciones.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Esta familia todavía no tiene observaciones.
          </p>
        ) : (
          observaciones.map((observacion) => (
            <div
              key={observacion.id}
              className="rounded-lg bg-zinc-900 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">
                  {formatearFecha(observacion.fechaCreacion)}
                </span>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    eliminarObservacion(observacion.id)
                  }
                  className="!border-0 !bg-transparent !p-0 text-xs text-red-400 !shadow-none hover:text-red-300"
                >
                  Eliminar
                </button>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">
                {observacion.texto}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
