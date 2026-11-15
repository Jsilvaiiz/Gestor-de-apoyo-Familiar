import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Tag } from "lucide-react";
import { leerEtiquetas, type Etiqueta } from "../utils/etiquetas";
import {
  leerEtiquetasCalendario,
  type EtiquetaCalendario,
} from "../utils/etiquetasCalendario";
import { leerFamilias } from "../utils/familias";
import {
  calcularSesionesRutaRegular,
  type SesionProgramada,
} from "../utils/rutaRegular";

interface VisitasListProps {
  onSeleccionarSesion: (sesion: SesionProgramada) => void;
}

interface DatosVisitas {
  sesiones: SesionProgramada[];
  etiquetas: Etiqueta[];
  etiquetasCalendario: EtiquetaCalendario[];
}

const NOMBRE_ETAPA: Record<SesionProgramada["etapa"], string> = {
  1: "Etapa I",
  2: "Etapa II",
  3: "Etapa III",
  4: "Etapa IV",
};

function fechaClave(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function fechaFormato(fecha: Date): string {
  return fecha.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VisitasList({
  onSeleccionarSesion,
}: VisitasListProps) {
  const [datos, setDatos] = useState<DatosVisitas>({
    sesiones: [],
    etiquetas: [],
    etiquetasCalendario: [],
  });
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      const [familias, etiquetas, etiquetasCalendario] = await Promise.all([
        leerFamilias(),
        leerEtiquetas(),
        leerEtiquetasCalendario(),
      ]);
      const hoy = inicioDelDia(new Date());
      const sesiones = [...calcularSesionesRutaRegular(familias).values()]
        .flat()
        .filter((sesion) => !sesion.realizada && sesion.fecha >= hoy)
        .sort(
          (a, b) =>
            a.fecha.getTime() - b.fecha.getTime() ||
            a.familia.nombre.localeCompare(b.familia.nombre, "es")
        );

      setDatos({ sesiones, etiquetas, etiquetasCalendario });
      setError("");
    } catch (cause) {
      setError(`No se pudieron cargar las próximas visitas: ${String(cause)}`);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
    window.addEventListener("familias-actualizadas", cargarDatos);
    window.addEventListener("etiquetas-calendario-actualizadas", cargarDatos);
    window.addEventListener("etiquetas-actualizadas", cargarDatos);

    return () => {
      window.removeEventListener("familias-actualizadas", cargarDatos);
      window.removeEventListener(
        "etiquetas-calendario-actualizadas",
        cargarDatos
      );
      window.removeEventListener("etiquetas-actualizadas", cargarDatos);
    };
  }, [cargarDatos]);

  const sesionesPorFecha = useMemo(() => {
    const grupos = new Map<string, SesionProgramada[]>();
    for (const sesion of datos.sesiones) {
      const clave = fechaClave(sesion.fecha);
      const sesiones = grupos.get(clave) ?? [];
      sesiones.push(sesion);
      grupos.set(clave, sesiones);
    }
    return [...grupos.entries()];
  }, [datos.sesiones]);

  function nombresEtiquetas(familia: SesionProgramada["familia"]): Etiqueta[] {
    return (familia.etiquetas ?? []).map((valor) => {
      const encontrada = datos.etiquetas.find(
        (etiqueta) =>
          etiqueta.id === valor ||
          etiqueta.nombre.toLocaleLowerCase() === valor.toLocaleLowerCase()
      );
      return encontrada ?? { id: valor, nombre: valor, color: "#71717a", activa: true };
    });
  }

  function comentariosDeSesion(sesion: SesionProgramada): EtiquetaCalendario[] {
    const clave = fechaClave(sesion.fecha);
    return datos.etiquetasCalendario.filter(
      (etiqueta) =>
        etiqueta.fecha === clave &&
        (!etiqueta.familiaId || etiqueta.familiaId === sesion.familia.id)
    );
  }

  return (
    <section className="h-full overflow-y-auto bg-zinc-800 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <CalendarDays size={22} aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">Próximas visitas</h1>
            <p className="text-sm text-zinc-400">
              Ordenadas por fecha; no se muestran las sesiones realizadas.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 bg-red-900/40 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {!error && datos.sesiones.length === 0 && (
          <p className="bg-zinc-900 p-4 text-sm text-zinc-300">
            No hay visitas futuras pendientes.
          </p>
        )}

        <div className="space-y-5">
          {sesionesPorFecha.map(([clave, sesiones]) => (
            <section key={clave} aria-label={fechaFormato(sesiones[0].fecha)}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize text-zinc-300">
                <Clock3 size={15} aria-hidden="true" />
                {fechaFormato(sesiones[0].fecha)}
              </h2>
              <div className="divide-y divide-zinc-700 bg-zinc-900">
                {sesiones.map((sesion) => {
                  const etiquetasFamilia = nombresEtiquetas(sesion.familia);
                  const comentarios = comentariosDeSesion(sesion);
                  const observaciones = [...(sesion.familia.observaciones ?? [])]
                    .sort(
                      (a, b) =>
                        new Date(b.fechaCreacion).getTime() -
                        new Date(a.fechaCreacion).getTime()
                    );

                  return (
                    <article
                      key={`${sesion.familia.id}-${fechaClave(sesion.fecha)}-${sesion.esAPS}-${sesion.esASL}`}
                      className="space-y-4 p-4"
                    >
                      {/*Datos de identificación y contacto de la familia. */}
                      <section aria-label="Información de la familia">
                        <button
                          type="button"
                          onClick={() => onSeleccionarSesion(sesion)}
                          className="!border-0 !bg-transparent !p-0 !text-left !shadow-none hover:underline"
                        >
                          <span className="block text-base font-semibold text-white">
                            {sesion.familia.nombre}
                          </span>
                        </button>
                        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="inline text-zinc-500">Representante: </dt>
                            <dd className="inline text-zinc-300">
                              {sesion.familia.representante || "Sin representante"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-zinc-500">Teléfono: </dt>
                            <dd className="inline text-zinc-300">
                              {sesion.familia.telefono || "Sin teléfono"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-zinc-500">Dirección: </dt>
                            <dd className="inline text-zinc-300">
                              {sesion.familia.direccion || "Sin dirección"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-zinc-500">Fecha de ingreso: </dt>
                            <dd className="inline text-zinc-300">
                              {sesion.familia.fechaInicio
                                ? fechaFormato(new Date(`${sesion.familia.fechaInicio}T00:00:00`))
                                : "Sin fecha"}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      {/* Sección editable: información programada de esta visita. */}
                      <section
                        aria-label="Detalles de la visita"
                        className="border-l-2 border-zinc-700 pl-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {sesion.esAPS && (
                            <span className="bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
                              APS
                            </span>
                          )}
                          {sesion.esASL && (
                            <span className="bg-purple-700 px-2 py-0.5 text-xs font-semibold text-white">
                              ASL
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-zinc-200">
                            {sesion.esAPS
                              ? `Sesión ${sesion.numeroSesion} · ${NOMBRE_ETAPA[sesion.etapa]} · Mes ${sesion.numeroMes}`
                              : `Visita ASL · Mes ${sesion.numeroMesASL}`}
                            {sesion.esAPS &&
                              sesion.esASL &&
                              ` · ASL Mes ${sesion.numeroMesASL}`}
                          </h3>
                        </div>
                      </section>

                      {/* Sección editable: etiquetas de familia y comentarios asociados a la fecha. */}
                      <section
                        aria-label="Etiquetas y comentarios"
                        className="min-w-0 space-y-2"
                      >
                        {etiquetasFamilia.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {etiquetasFamilia.map((etiqueta) => (
                              <span
                                key={etiqueta.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
                                style={{
                                  backgroundColor: etiqueta.color,
                                  color: "#18181b",
                                }}
                              >
                                <Tag size={11} aria-hidden="true" />
                                {etiqueta.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                        {comentarios.length > 0 && (
                          <ul className="space-y-1 text-sm text-zinc-300">
                            {comentarios.map((comentario) => (
                              <li key={comentario.id}>
                                <span className="font-medium">
                                  {comentario.etiqueta}:
                                </span>{" "}
                                {comentario.comentario}
                              </li>
                            ))}
                          </ul>
                        )}
                        {observaciones.length > 0 && (
                          <ul className="space-y-1 text-sm text-zinc-400">
                            {observaciones.map((observacion) => (
                              <li key={observacion.id}>
                                <span className="font-medium">Nota familiar:</span>{" "}
                                {observacion.texto}
                              </li>
                            ))}
                          </ul>
                        )}
                        {etiquetasFamilia.length === 0 &&
                          comentarios.length === 0 &&
                          observaciones.length === 0 && (
                            <span className="text-xs text-zinc-500">
                              Sin etiquetas ni comentarios para esta visita.
                            </span>
                          )}
                      </section>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
