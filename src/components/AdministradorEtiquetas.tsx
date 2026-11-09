
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { leerFamilias } from "../utils/familias";

import {
  crearEtiqueta,
  guardarEtiquetas,
  leerEtiquetas,
  type Etiqueta,
} from "../utils/etiquetas";

const COLORES = [
  { nombre: "Azul", valor: "#2563eb" },
  { nombre: "Turquesa", valor: "#0d9488" },
  { nombre: "Verde", valor: "#16a34a" },
  { nombre: "Amarillo", valor: "#ca8a04" },
  { nombre: "Naranjo", valor: "#ea580c" },
  { nombre: "Rojo", valor: "#dc2626" },
  { nombre: "Morado", valor: "#9333ea" },
  { nombre: "Rosado", valor: "#db2777" },
  { nombre: "Gris", valor: "#64748b" },
  { nombre: "Celeste", valor: "#0891b2" },
  { nombre: "Lima", valor: "#65a30d" },
  { nombre: "Violeta", valor: "#7c3aed" },
];

export default function AdministradorEtiquetas() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);

  // Formulario de creación
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#2563eb");

  // Administración de etiquetas
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  // Edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEdicion, setNombreEdicion] = useState("");
  const [colorEdicion, setColorEdicion] = useState("#2563eb");

  // Estados generales
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await leerEtiquetas();
        setEtiquetas(datos);
      } catch (err) {
        setError("Error al cargar etiquetas: " + String(err));
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, []);

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  // Crear etiqueta
  async function agregarEtiqueta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    limpiarMensajes();

    try {
      await crearEtiqueta(nombre, color);

      const actualizadas = await leerEtiquetas();
      setEtiquetas(actualizadas);

      setNombre("");
      setColor("#2563eb");
      setMensaje("Etiqueta creada correctamente");
    } catch (err) {
      setError(String(err));
    } finally {
      setGuardando(false);
    }
  }

  // Guardar cambios del catálogo
  async function actualizarCatalogo(nuevas: Etiqueta[]) {
    await guardarEtiquetas(nuevas);
    setEtiquetas(nuevas);
  }

  // Activar / desactivar
  async function cambiarEstado(etiqueta: Etiqueta) {
    if (guardando) return;

    setGuardando(true);
    setMenuAbierto(null);
    limpiarMensajes();

    try {
      const nuevas = etiquetas.map((e) =>
        e.id === etiqueta.id
          ? { ...e, activa: !e.activa }
          : e
      );

      await actualizarCatalogo(nuevas);

      setMensaje(
        etiqueta.activa
          ? "Etiqueta desactivada correctamente"
          : "Etiqueta activada correctamente"
      );
    } catch (err) {
      setError("No se pudo cambiar el estado: " + String(err));
    } finally {
      setGuardando(false);
    }
  }


    async function eliminarEtiqueta(etiqueta: Etiqueta) {
    if (guardando) return;

    setMenuAbierto(null);
    limpiarMensajes();
    setGuardando(true);

    try {
        // Solo se pueden eliminar etiquetas desactivadas
        if (etiqueta.activa) {
        throw new Error(
            "Primero debes desactivar esta etiqueta."
        );
        }

        // Comprobar todas las familias, incluso las archivadas
        const familias = await leerFamilias();

        const estaEnUso = familias.some((familia) =>
        (familia.etiquetas ?? []).some(
            (valor) =>
            valor === etiqueta.id ||
            valor.trim().toLowerCase() ===
                etiqueta.nombre.trim().toLowerCase()
        )
        );

        if (estaEnUso) {
        throw new Error(
            "No puedes eliminar esta etiqueta porque está asignada a una o más familias."
        );
        }

        // Confirmar antes de eliminar definitivamente
        const confirmar = window.confirm(
        `¿Eliminar definitivamente la etiqueta "${etiqueta.nombre}"?`
        );

        if (!confirmar) return;

        // Volver a comprobar su estado en el JSON
        const actuales = await leerEtiquetas();
        const actual = actuales.find((e) => e.id === etiqueta.id);

        if (!actual || actual.activa) {
        throw new Error(
            "La etiqueta ya no existe o está activada."
        );
        }

        const nuevas = actuales.filter(
        (e) => e.id !== etiqueta.id
        );

        await guardarEtiquetas(nuevas);
        setEtiquetas(nuevas);

        setMensaje("Etiqueta eliminada correctamente");
    } catch (err) {
        setError(String(err));
    } finally {
        setGuardando(false);
    }
    }


  // Comenzar edición
  function comenzarEdicion(etiqueta: Etiqueta) {
    setEditandoId(etiqueta.id);
    setNombreEdicion(etiqueta.nombre);
    setColorEdicion(etiqueta.color);
    setMenuAbierto(null);
    limpiarMensajes();
  }

  function cancelarEdicion() {
    setEditandoId(null);
    limpiarMensajes();
  }

  // Guardar nombre y color editados
  async function guardarEdicion() {
    if (guardando || editandoId === null) return;

    const nuevoNombre = nombreEdicion.trim();

    if (!nuevoNombre) {
      setError("Debes ingresar un nombre");
      return;
    }

    const duplicado = etiquetas.some(
      (e) =>
        e.id !== editandoId &&
        e.nombre.toLowerCase() === nuevoNombre.toLowerCase()
    );

    if (duplicado) {
      setError("Ya existe una etiqueta con ese nombre");
      return;
    }

    setGuardando(true);
    limpiarMensajes();

    try {
      const nuevas = etiquetas.map((e) =>
        e.id === editandoId
          ? {
              ...e,
              nombre: nuevoNombre,
              color: colorEdicion,
            }
          : e
      );

      await actualizarCatalogo(nuevas);

      setEditandoId(null);
      setMensaje("Etiqueta actualizada correctamente");
    } catch (err) {
      setError("No se pudo editar la etiqueta: " + String(err));
    } finally {
      setGuardando(false);
    }
  }

  const etiquetasVisibles = etiquetas.filter(
  (e) => mostrarInactivas ? !e.activa : e.activa
);

  const cantidadActivas = etiquetas.filter(
    (e) => e.activa
  ).length;

  return (
    <section className="mx-auto max-w-3xl p-6 text-left text-white">

      <h2 className="mb-2 text-2xl font-bold">
        Administrador de etiquetas
      </h2>

      <p className="mb-6 text-sm text-zinc-400">
        Crea y organiza etiquetas para clasificar familias
        según sus necesidades de seguimiento.
      </p>

      {/* CREAR NUEVA ETIQUETA */}
      <form
        onSubmit={agregarEtiqueta}
        className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900 p-5"
      >
        <h3 className="mb-4 text-lg font-semibold">
          Crear nueva etiqueta
        </h3>

        <label
          htmlFor="nombre-etiqueta"
          className="mb-2 block text-sm"
        >
          Nombre de la etiqueta
        </label>

        <input
          id="nombre-etiqueta"
          value={nombre}
          maxLength={50}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Contacto pendiente"
          className="mb-5 w-full rounded-lg bg-zinc-800 p-3"
          required
        />

        <p className="mb-3 text-sm font-medium">
          Elegir color
        </p>

        <div className="mb-5 grid grid-cols-6 gap-3">
          {COLORES.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              title={opcion.nombre}
              aria-label={`Color ${opcion.nombre}`}
              aria-pressed={color === opcion.valor}
              onClick={() => setColor(opcion.valor)}
              className="flex h-10 items-center justify-center rounded-lg border-2"
              style={{
                backgroundColor: opcion.valor,
                borderColor:
                  color === opcion.valor
                    ? "#ffffff"
                    : "transparent",
              }}
            >
              {color === opcion.valor && (
                <span className="font-bold text-white">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            Vista previa:
          </span>

          <span
            className="rounded-full px-3 py-1 text-sm text-white"
            style={{ backgroundColor: color }}
          >
            {nombre.trim() || "Nueva etiqueta"}
          </span>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-blue-700 px-5 py-2 hover:bg-blue-600 disabled:opacity-50"
        >
          Crear etiqueta
        </button>
      </form>

      {/* MENSAJES */}
      {mensaje && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-green-900/30 p-3 text-green-300"
        >
          {mensaje}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-900/30 p-3 text-red-300"
        >
          {error}
        </p>
      )}

      {/* ADMINISTRAR ETIQUETAS */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">

        <h3 className="mb-4 text-lg font-semibold">
          Mis etiquetas
        </h3>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            {cantidadActivas} etiquetas disponibles
          </p>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={(e) => {
                setMostrarInactivas(e.target.checked);
                setMenuAbierto(null);
              }}
              className="h-4 w-4"
            />
            Ver desactivadas
          </label>
        </div>

        {cargando ? (
          <p className="text-zinc-400">
            Cargando etiquetas...
          </p>
        ) : etiquetasVisibles.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No hay etiquetas para mostrar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {etiquetasVisibles.map((etiqueta) => (
              <div
                key={etiqueta.id}
                className="relative rounded-lg border border-zinc-700 bg-zinc-800 p-3"
              >

                {editandoId === etiqueta.id ? (
                  /* FORMULARIO DE EDICIÓN */
                  <div className="space-y-3">

                    <input
                      type="text"
                      value={nombreEdicion}
                      maxLength={50}
                      onChange={(e) =>
                        setNombreEdicion(e.target.value)
                      }
                      aria-label="Editar nombre de etiqueta"
                      className="w-full rounded-lg bg-zinc-900 p-2 text-sm"
                    />

                    <p className="text-xs text-zinc-400">
                      Cambiar color
                    </p>

                    <div className="grid grid-cols-6 gap-2">
                      {COLORES.map((opcion) => (
                        <button
                          key={opcion.valor}
                          type="button"
                          title={opcion.nombre}
                          aria-label={`Color ${opcion.nombre}`}
                          onClick={() =>
                            setColorEdicion(opcion.valor)
                          }
                          className="flex h-7 items-center justify-center rounded border-2"
                          style={{
                            backgroundColor: opcion.valor,
                            borderColor:
                              colorEdicion === opcion.valor
                                ? "#ffffff"
                                : "transparent",
                          }}
                        >
                          {colorEdicion === opcion.valor &&
                            <span className="text-xs text-white">
                              ✓
                            </span>
                          }
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={guardarEdicion}
                        className="rounded bg-blue-700 px-3 py-2 text-sm hover:bg-blue-600"
                      >
                        Guardar
                      </button>

                      <button
                        type="button"
                        disabled={guardando}
                        onClick={cancelarEdicion}
                        className="rounded bg-zinc-700 px-3 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TARJETA NORMAL */
                  <>
                    <div className="flex items-start justify-between gap-2">

                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: etiqueta.color,
                          }}
                        />

                        <span
                          className={`break-words text-sm font-medium ${
                            etiqueta.activa
                              ? "text-white"
                              : "text-zinc-400"
                          }`}
                        >
                          {etiqueta.nombre}
                        </span>
                      </div>

                      {/* MENÚ DE TRES PUNTOS */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          disabled={guardando}
                          aria-label={`Opciones de ${etiqueta.nombre}`}
                          aria-expanded={
                            menuAbierto === etiqueta.id
                          }
                          onClick={() =>
                            setMenuAbierto(
                              menuAbierto === etiqueta.id
                                ? null
                                : etiqueta.id
                            )
                          }
                          className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-700"
                        >
                          ⋯
                        </button>

                        {menuAbierto === etiqueta.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-zinc-600 bg-zinc-900 p-1 shadow-xl">

                            <button
                              type="button"
                              onClick={() =>
                                comenzarEdicion(etiqueta)
                              }
                              className="w-full rounded px-3 py-2 text-left text-sm hover:bg-zinc-700"
                            >
                              Editar etiqueta
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstado(etiqueta)
                              }
                              className="w-full rounded px-3 py-2 text-left text-sm hover:bg-zinc-700"
                            >
                              {etiqueta.activa
                                ? "Desactivar"
                                : "Activar"}
                            </button>
                            
                            {!etiqueta.activa && (
                            <button
                                type="button"
                                disabled={guardando}
                                onClick={() => eliminarEtiqueta(etiqueta)}
                                className="w-full rounded px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700"
                            >
                                Eliminar etiqueta
                            </button>
                            )}


                            <button
                              type="button"
                              onClick={() =>
                                setMenuAbierto(null)
                              }
                              className="w-full rounded px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-700"
                            >
                              Cerrar
                            </button>

                          </div>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-zinc-400">
                      {etiqueta.activa
                        ? "Disponible para asignar"
                        : "No disponible para nuevas asignaciones"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {!mostrarInactivas &&
          etiquetas.some((e) => !e.activa) && (
            <p className="mt-4 text-xs text-zinc-500">
              Hay etiquetas desactivadas ocultas.
            </p>
          )}
      </div>
    </section>
  );
}
