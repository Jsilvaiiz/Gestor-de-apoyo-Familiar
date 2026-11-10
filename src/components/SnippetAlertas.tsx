import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { leerFamilias, type Familia } from '../utils/familias'
import {
  leerEtiquetasCalendario,
  type EtiquetaCalendario,
} from '../utils/etiquetasCalendario'
import { calcularSesionesRutaRegular } from '../utils/rutaRegular'
import type { EtapaRutaRegular, SesionProgramada } from '../utils/rutaRegular'

const NOMBRE_ETAPA: Record<EtapaRutaRegular, string> = {
  1: 'Etapa I',
  2: 'Etapa II',
  3: 'Etapa III',
  4: 'Etapa IV',
}

interface SnippetAlertasProps {
  onSeleccionarSesion: (sesion: SesionProgramada) => void
  onSeleccionarEtiqueta: (fecha: Date) => void
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

function inicioDeSemana(fecha: Date) {
  const inicio = inicioDelDia(fecha)
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7))
  return inicio
}

function fechaDesdeClave(clave: string) {
  const [anio, mes, dia] = clave.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export default function SnippetAlertas({
  onSeleccionarSesion,
  onSeleccionarEtiqueta,
}: SnippetAlertasProps) {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [etiquetasCalendario, setEtiquetasCalendario] = useState<EtiquetaCalendario[]>([])
  const [error, setError] = useState('')
  const [abiertas, setAbiertas] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    async function cargarFamilias() {
      try {
        const [datos, notas] = await Promise.all([
          leerFamilias(),
          leerEtiquetasCalendario(),
        ])
        if (mounted) {
          setFamilias(datos.filter((familia) => familia.archivada !== true))
          setEtiquetasCalendario(notas)
          setError('')
        }
      } catch (errorCarga) {
        if (mounted) {
          setError(`No se pudieron cargar las alertas: ${String(errorCarga)}`)
        }
      }
    }

    function cerrarAlHacerClicFuera(event: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        setAbiertas(false)
      }
    }

    const actualizar = () => void cargarFamilias()
    void cargarFamilias()
    window.addEventListener('familias-actualizadas', actualizar)
    window.addEventListener('etiquetas-calendario-actualizadas', actualizar)
    document.addEventListener('mousedown', cerrarAlHacerClicFuera)

    return () => {
      mounted = false
      window.removeEventListener('familias-actualizadas', actualizar)
      window.removeEventListener('etiquetas-calendario-actualizadas', actualizar)
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera)
    }
  }, [])

  const alertas = useMemo(() => {
    const hoy = inicioDelDia(new Date())
    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + 7)
    const lunesEstaSemana = inicioDeSemana(hoy)
    const domingoEstaSemana = new Date(lunesEstaSemana)
    domingoEstaSemana.setDate(domingoEstaSemana.getDate() + 6)
    const pendientes = [...calcularSesionesRutaRegular(familias).values()]
      .flat()
      .filter((sesion) => !sesion.realizada)

    return {
      atrasadas: pendientes
        .filter((sesion) => inicioDelDia(sesion.fecha) < hoy)
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
      proximas: pendientes
        .filter((sesion) => {
          const fecha = inicioDelDia(sesion.fecha)
          return fecha >= hoy && fecha <= limite
        })
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
      etiquetas: etiquetasCalendario
        .filter((etiqueta) => {
          const fecha = fechaDesdeClave(etiqueta.fecha)
          return fecha >= lunesEstaSemana && fecha <= domingoEstaSemana
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }
  }, [familias, etiquetasCalendario])
  const cantidadAlertas =
    alertas.atrasadas.length + alertas.proximas.length + alertas.etiquetas.length

  return (
    <div className="relative rounded shrink-0" ref={contenedorRef}>
      <button
        type="button"
        aria-label={`Alertas: ${cantidadAlertas} pendientes`}
        aria-expanded={abiertas}
        aria-haspopup="dialog"
        title="Sesiones y etiquetas del calendario"
        onClick={() => setAbiertas((actual) => !actual)}
        className="relative flex items-center gap-1.5 rounded-md !border-0 !bg-red-900 px-2 py-1.5 text-xs font-semibold !text-white !shadow-none transition hover:!bg-red-600"
      >
        <Bell size={16} aria-hidden="true" />
        
        <span className="min-w-5 rounded-full bg-red-950 px-1.5 py-0.5 text-center text-[10px]">
          {cantidadAlertas}
        </span>
      </button>

      {abiertas && (
        <div
          role="dialog"
          aria-label="Alertas de sesiones y calendario"
          className="absolute left-0 top-full z-[60] mt-2 w-72 max-w-[85vw] rounded-lg border border-zinc-700 bg-neutral-900 p-2 text-white shadow-xl"
        >
          {error ? (
            <p role="alert" className="px-2 py-1 text-xs text-red-300">
              {error}
            </p>
          ) : cantidadAlertas === 0 ? (
            <p className="px-2 py-1 text-xs text-zinc-400">
              No hay alertas pendientes.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {alertas.atrasadas.length > 0 && (
                <>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                    Atrasadas · pendientes
                  </p>
                  {alertas.atrasadas.map((sesion) => (
                    <AlertaSesion
                      key={`${sesion.familia.id}-${sesion.numeroSesion}`}
                      sesion={sesion}
                      atrasada
                      onSeleccionar={() => {
                        onSeleccionarSesion(sesion)
                        setAbiertas(false)
                      }}
                    />
                  ))}
                </>
              )}
              {alertas.proximas.length > 0 && (
                <>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Próximos 7 días
                  </p>
                  {alertas.proximas.map((sesion) => (
                    <AlertaSesion
                      key={`${sesion.familia.id}-${sesion.numeroSesion}`}
                      sesion={sesion}
                      atrasada={false}
                      onSeleccionar={() => {
                        onSeleccionarSesion(sesion)
                        setAbiertas(false)
                      }}
                    />
                  ))}
                </>
              )}
              {alertas.etiquetas.length > 0 && (
                <>
                  <p className="mt-1 border-t border-zinc-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                    Etiquetas
                  </p>
                  {alertas.etiquetas.map((etiqueta) => (
                    <AlertaEtiqueta
                      key={etiqueta.id}
                      etiqueta={etiqueta}
                      familiaNombre={
                        familias.find(
                          (familia) => familia.id === etiqueta.familiaId
                        )?.nombre
                      }
                      onSeleccionar={() => {
                        onSeleccionarEtiqueta(fechaDesdeClave(etiqueta.fecha))
                        setAbiertas(false)
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertaEtiqueta({
  etiqueta,
  familiaNombre,
  onSeleccionar,
}: {
  etiqueta: EtiquetaCalendario
  familiaNombre?: string
  onSeleccionar: () => void
}) {
  const fecha = fechaDesdeClave(etiqueta.fecha)

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      className="flex w-full items-center justify-between gap-2 rounded !border-0 !bg-transparent px-2 py-1.5 text-left !text-xs !font-normal !text-zinc-300 !shadow-none hover:!bg-zinc-800"
    >
      <span className="min-w-0">
        <span className="block truncate text-sky-300">
          {etiqueta.etiqueta}
          {familiaNombre ? ` · ${familiaNombre}` : ''}
        </span>
        <span className="block truncate text-[10px] text-zinc-500">
          {etiqueta.comentario}
        </span>
      </span>
      <span className="shrink-0 text-[10px] text-zinc-500">
        {fecha.toLocaleDateString('es-CL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </button>
  )
}

interface AlertaSesionProps {
  sesion: SesionProgramada
  atrasada: boolean
  onSeleccionar: () => void
}

function AlertaSesion({
  sesion,
  atrasada,
  onSeleccionar,
}: AlertaSesionProps) {
  return (
    <button
      type="button"
      onClick={onSeleccionar}
      className={`flex w-full items-center justify-between gap-2 rounded !border-0 !bg-transparent px-2 py-1.5 text-left !text-xs !font-normal !shadow-none ${
        atrasada
          ? '!text-red-300 hover:!bg-red-950/50'
          : '!text-zinc-200 hover:!bg-zinc-800'
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate">{sesion.familia.nombre}</span>
        <span className={`block text-[10px] ${atrasada ? 'text-red-400' : 'text-zinc-400'}`}>
          Sesión {sesion.numeroSesion} · {NOMBRE_ETAPA[sesion.etapa]} · Mes {sesion.numeroMes}
        </span>
      </span>
      <span className={`shrink-0 text-[10px] ${atrasada ? 'text-red-400' : 'text-zinc-400'}`}>
        {sesion.fecha.toLocaleDateString('es-CL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </button>
  )
}
