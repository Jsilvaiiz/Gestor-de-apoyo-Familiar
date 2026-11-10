
import { useCallback, useEffect, useState } from "react";

import {
  leerFamilias,
  editarFamilia,
  cambiarEstadoFamilia,
  type Familia,
} from "../utils/familias";

import FamiliaEtiquetas from "./FamiliaEtiquetas";
import FamiliaObservaciones from "./FamiliaObservaciones";
import FiltroEtiquetas from "./FiltroEtiquetas";

import type { Etiqueta } from "../utils/etiquetas";

import {
  ChevronDown,
  ChevronUp,
  Tags,
  MessageSquareText,
  Pencil,
} from "lucide-react";

type Seccion = "etiquetas" | "observaciones" | "editar" | null;

export default function FamiliaList() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("");
  const [catalogoEtiquetas, setCatalogoEtiquetas] =
    useState<Etiqueta[]>([]);

  const [familiaAbierta, setFamiliaAbierta] =
    useState<string | null>(null);

  const [seccionAbierta, setSeccionAbierta] =
    useState<Seccion>(null);

  const [mostrarArchivadas, setMostrarArchivadas] =
    useState(false);

  const [editando, setEditando] = useState<Familia | null>(null);
  const [mensajeEdicion, setMensajeEdicion] = useState("");
  const [notificacion, setNotificacion] = useState("");
  const [error, setError] = useState("");

  const actualizarCatalogo = useCallback(
    (etiquetas: Etiqueta[]) => {
      setCatalogoEtiquetas(etiquetas);
    },
    []
  );

  // Cargar familias
  async function cargarFamilias() {
    try {
      const datos = await leerFamilias();
      setFamilias(datos);
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    void cargarFamilias();

    const actualizar = () => {
      void cargarFamilias();
    };

    window.addEventListener("familias-actualizadas", actualizar);

    return () => {
      window.removeEventListener(
        "familias-actualizadas",
        actualizar
      );
    };
  }, []);

  // Buscar una etiqueta por ID o nombre antiguo
  function obtenerEtiqueta(valor: string) {
    return catalogoEtiquetas.find(
      (etiqueta) =>
        etiqueta.id === valor ||
        etiqueta.nombre.toLowerCase() === valor.toLowerCase()
    );
  }

  // Aplicar filtros
  const filtradas = familias.filter((familia) => {
    const coincideBusqueda =
      `${familia.nombre} ${familia.representante}`
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase());

    const coincideEstado = mostrarArchivadas
      ? familia.archivada === true
      : familia.archivada !== true;

    const coincideEtiqueta =
      filtroEtiqueta === "" ||
      (familia.etiquetas ?? []).some(
        (valor) =>
          obtenerEtiqueta(valor)?.id === filtroEtiqueta
      );

    return (
      coincideBusqueda &&
      coincideEstado &&
      coincideEtiqueta
    );
  });

  // Abrir o cerrar una familia
  function alternarFamilia(id: string) {
    if (familiaAbierta === id) {
      setFamiliaAbierta(null);
    } else {
      setFamiliaAbierta(id);
    }

    setSeccionAbierta(null);
    setEditando(null);
    setMensajeEdicion("");
  }

  // Abrir una sección dentro de la familia
  function cambiarSeccion(seccion: Seccion, familia: Familia) {
    if (seccionAbierta === seccion) {
      setSeccionAbierta(null);
      setEditando(null);
    } else {
      setSeccionAbierta(seccion);

      if (seccion === "editar") {
        setEditando({ ...familia });
      } else {
        setEditando(null);
      }
    }

    setMensajeEdicion("");
  }

  // Guardar edición
  async function guardarEdicion() {
    if (!editando) return;

    try {
      const actuales = await leerFamilias();
      const actual = actuales.find(
        (familia) => familia.id === editando.id
      );

      if (!actual) {
        throw new Error("La familia ya no existe.");
      }

      // Conservar etiquetas y observaciones recientes
      await editarFamilia({
        ...actual,
        nombre: editando.nombre,
        representante: editando.representante,
        telefono: editando.telefono,
        direccion: editando.direccion,
        fechaInicio: editando.fechaInicio,
      });

      setEditando(null);
      setSeccionAbierta(null);
      setMensajeEdicion("");
      setNotificacion("Familia actualizada correctamente.");

      await cargarFamilias();
    } catch (err) {
      setMensajeEdicion(String(err));
    }
  }

  // Archivar o restaurar
  async function cambiarEstado(id: string, archivar: boolean) {
    try {
      await cambiarEstadoFamilia(id, archivar);
      await cargarFamilias();

      setFamiliaAbierta(null);
      setSeccionAbierta(null);
      setEditando(null);

      setNotificacion(
        archivar
          ? "Familia archivada correctamente."
          : "Familia restaurada correctamente."
      );
    } catch (err) {
      setNotificacion(
        "No se pudo cambiar el estado: " + String(err)
      );
    }
  }

  function formatearFecha(fecha?: string) {
    if (!fecha) return "Sin registrar";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return [...partes].reverse().join("/");
  }

  function formatearFechaObservacion(fecha: string) {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return "Fecha no disponible";
    }

    return valor.toLocaleDateString("es-CL");
  }

  return (
    <section className="p-6 text-left text-white">

      {/* ENCABEZADO */}
      <div className="mb-5 text-center">
        <h2 className="text-xl font-bold">
          Familias registradas
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          Consulta la información y selecciona una familia
          para gestionar sus registros.
        </p>
      </div>

      {/* NOTIFICACIONES */}
      {notificacion && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-zinc-700 p-3 text-sm"
        >
          {notificacion}
        </p>
      )}

      {/* ACTIVAS Y ARCHIVADAS */}
      <button
        type="button"
        onClick={() => {
          setMostrarArchivadas(!mostrarArchivadas);
          setFamiliaAbierta(null);
          setSeccionAbierta(null);
          setEditando(null);
        }}
        className="mb-4 rounded-lg bg-zinc-700 px-4 py-2 hover:bg-zinc-600"
      >
        {mostrarArchivadas
          ? "Ver familias activas"
          : "Ver familias archivadas"}
      </button>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar familia o representante..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 w-full rounded-lg bg-zinc-900 p-3 text-white"
      />

      {/* FILTRO POR ETIQUETA */}
      <FiltroEtiquetas
        seleccionada={filtroEtiqueta}
        onCambiar={setFiltroEtiqueta}
        onCargar={actualizarCatalogo}
      />

      <p className="mb-4 text-sm text-zinc-400">
        {filtradas.length}{" "}
        {filtradas.length === 1
          ? "familia encontrada"
          : "familias encontradas"}
      </p>

      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}

      {/* LISTADO */}
      {filtradas.length === 0 ? (
        <p className="rounded-lg bg-zinc-900 p-4 text-zinc-400">
          No hay familias que coincidan con los filtros.
        </p>
      ) : (
        <div className="space-y-3">

          {filtradas.map((familia) => {
            const abierta = familiaAbierta === familia.id;
            const etiquetas = familia.etiquetas ?? [];

            const observacionesOrdenadas = [
              ...(familia.observaciones ?? []),
            ].sort(
              (a, b) =>
                new Date(b.fechaCreacion).getTime() -
                new Date(a.fechaCreacion).getTime()
            );

            const ultimaObservacion =
              observacionesOrdenadas[0];

            const cantidadObservaciones =
              observacionesOrdenadas.length;

            return (
              <article
                key={familia.id}
                className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900"
              >

                {/* RESUMEN VISIBLE */}
                <button
                  type="button"
                  aria-expanded={abierta}
                  aria-label={`${
                    abierta ? "Cerrar" : "Abrir"
                  } detalles de ${familia.nombre}`}
                  onClick={() =>
                    alternarFamilia(familia.id)
                  }
                  className="flex w-full items-start justify-between gap-4 !border-0 !bg-transparent p-4 text-left !shadow-none hover:!bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">

                    <h3 className="font-semibold">
                      {familia.nombre}
                    </h3>

                    <div className="mt-1 space-y-1 text-sm text-zinc-400">
                      <p>
                        Representante: {familia.representante}
                      </p>

                      <p>
                        Teléfono:{" "}
                        {familia.telefono || "Sin registrar"}
                      </p>

                      <p>
                        Dirección:{" "}
                        {familia.direccion || "Sin registrar"}
                      </p>

                      <p>
                        Fecha de ingreso:{" "}
                        {formatearFecha(familia.fechaInicio)}
                      </p>

                    </div>


                    {/* ETIQUETAS DEL RESUMEN */}
                    {etiquetas.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {etiquetas.map((valor, indice) => {
                          const etiqueta =
                            obtenerEtiqueta(valor);

                          return (
                            <span
                              key={`${valor}-${indice}`}
                              className="rounded-full px-3 py-1 text-xs text-white"
                              style={{
                                backgroundColor:
                                  etiqueta?.color ?? "#52525b",
                              }}
                            >
                              {etiqueta?.nombre ?? valor}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* ÚLTIMA OBSERVACIÓN */}
                    {ultimaObservacion && (
                      <div className="mt-3 rounded-lg bg-zinc-800 px-3 py-2">
                        <p className="mb-1 text-xs font-semibold text-zinc-400">
                          Última observación ·{" "}
                          {formatearFechaObservacion(
                            ultimaObservacion.fechaCreacion
                          )}
                        </p>

                        <p className="line-clamp-2 break-words text-sm text-zinc-200">
                          {ultimaObservacion.texto}
                        </p>
                      </div>
                    )}

                  </div>

                  <div className="flex shrink-0 items-center gap-3 pt-1">

                    <span className="hidden text-xs text-zinc-400 sm:block">
                      {cantidadObservaciones}{" "}
                      {cantidadObservaciones === 1
                        ? "observación"
                        : "observaciones"}
                    </span>

                    {abierta ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {/* OPCIONES DE LA FAMILIA */}
                {abierta && (
                  <div className="border-t border-zinc-700 p-4">

                    <div className="mb-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          cambiarSeccion("etiquetas", familia)
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                          seccionAbierta === "etiquetas"
                            ? "bg-blue-700 text-white"
                            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        }`}
                      >
                        <Tags size={16} />
                        Etiquetas
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarSeccion(
                            "observaciones",
                            familia
                          )
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                          seccionAbierta === "observaciones"
                            ? "bg-blue-700 text-white"
                            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        }`}
                      >
                        <MessageSquareText size={16} />
                        Observaciones
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarSeccion("editar", familia)
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                          seccionAbierta === "editar"
                            ? "bg-blue-700 text-white"
                            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        }`}
                      >
                        <Pencil size={16} />
                        Editar datos
                      </button>
                    </div>

                    {/* SECCIÓN DE ETIQUETAS */}
                    {seccionAbierta === "etiquetas" && (
                      <FamiliaEtiquetas
                        familia={familia}
                        onActualizar={cargarFamilias}
                      />
                    )}

                    {/* SECCIÓN DE OBSERVACIONES */}
                    {seccionAbierta === "observaciones" && (
                      <FamiliaObservaciones
                        familia={familia}
                        onActualizar={cargarFamilias}
                      />
                    )}

                    {/* SECCIÓN DE EDICIÓN */}
                    {seccionAbierta === "editar" && (
                      <div className="rounded-lg border border-zinc-700 p-4">

                        <h4 className="mb-3 font-semibold">
                          Editar datos de la familia
                        </h4>

                        {editando?.id === familia.id && (
                          <div className="space-y-3">

                            {(
                              [
                                ["nombre", "Nombre"],
                                ["representante", "Representante"],
                                ["telefono", "Teléfono"],
                                ["direccion", "Dirección"],
                              ] as const
                            ).map(([campo, etiqueta]) => (
                              <label
                                key={campo}
                                className="block text-sm"
                              >
                                {etiqueta}

                                <input
                                  value={editando[campo]}
                                  onChange={(e) =>
                                    setEditando({
                                      ...editando,
                                      [campo]: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full rounded-lg bg-zinc-800 p-2"
                                />
                              </label>
                            ))}

                            <label className="block text-sm">
                              Fecha de ingreso

                              <input
                                type="date"
                                value={editando.fechaInicio ?? ""}
                                onChange={(e) =>
                                  setEditando({
                                    ...editando,
                                    fechaInicio: e.target.value,
                                  })
                                }
                                onClick={(e) =>
                                  e.currentTarget.showPicker?.()
                                }
                                style={{ colorScheme: "dark" }}
                                className="mt-1 block w-full rounded-lg bg-zinc-800 p-2"
                              />
                            </label>

                            {mensajeEdicion && (
                              <p className="text-sm text-red-400">
                                {mensajeEdicion}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={guardarEdicion}
                                className="rounded-lg bg-blue-700 px-4 py-2 hover:bg-blue-600"
                              >
                                Guardar cambios
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  cambiarSeccion(null, familia)
                                }
                                className="rounded-lg bg-zinc-700 px-4 py-2"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ARCHIVAR / RESTAURAR */}
                        <div className="mt-5 border-t border-zinc-700 pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstado(
                                familia.id,
                                !familia.archivada
                              )
                            }
                            className={`rounded-lg px-4 py-2 text-sm ${
                              familia.archivada
                                ? "bg-green-700 hover:bg-green-600"
                                : "bg-amber-700 hover:bg-amber-600"
                            }`}
                          >
                            {familia.archivada
                              ? "Restaurar familia"
                              : "Archivar familia"}
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                )}

              </article>
            );
          })}

        </div>
      )}
    </section>
  );
}
