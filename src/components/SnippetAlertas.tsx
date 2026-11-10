import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { leerFamilias, type Familia } from '../utils/familias'
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
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export default function SnippetAlertas({
  onSeleccionarSesion,
}: SnippetAlertasProps) {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [error, setError] = useState('')
  const [abiertas, setAbiertas] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    async function cargarFamilias() {
      try {
        const datos = await leerFamilias()
        if (mounted) {
          setFamilias(datos)
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
    document.addEventListener('mousedown', cerrarAlHacerClicFuera)

    return () => {
      mounted = false
      window.removeEventListener('familias-actualizadas', actualizar)
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera)
    }
  }, [])

  const proximasSesiones = useMemo(() => {
    const hoy = inicioDelDia(new Date())
    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + 7)
    return [...calcularSesionesRutaRegular(familias).values()]
      .flat()
      .filter((sesion) => {
        const fecha = inicioDelDia(sesion.fecha)
        return fecha >= hoy && fecha <= limite
      })
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
  }, [familias])

  return (
    <div className="relative shrink-0" ref={contenedorRef}>
      <button
        type="button"
        aria-label={`Alertas: ${proximasSesiones.length} sesiones próximas`}
        aria-expanded={abiertas}
        aria-haspopup="dialog"
        title="Sesiones en los próximos 7 días"
        onClick={() => setAbiertas((actual) => !actual)}
        className="relative flex items-center gap-1.5 rounded-md !border-0 !bg-red-900 px-2 py-1.5 text-xs font-semibold !text-white !shadow-none transition hover:!bg-red-600"
      >
        <Bell size={16} aria-hidden="true" />
        
        <span className="min-w-5 rounded-full bg-red-950 px-1.5 py-0.5 text-center text-[10px]">
          {proximasSesiones.length}
        </span>
      </button>

      {abiertas && (
        <div
          role="dialog"
          aria-label="Sesiones próximas"
          className="absolute left-0 top-full z-[60] mt-2 w-72 max-w-[85vw] rounded-lg border border-zinc-700 bg-neutral-900 p-2 text-white shadow-xl"
        >
          <p className="mb-1 px-2 py-1 text-xs font-semibold text-zinc-300">
            Sesiones en los próximos 7 días
          </p>
          {error ? (
            <p role="alert" className="px-2 py-1 text-xs text-red-300">
              {error}
            </p>
          ) : proximasSesiones.length === 0 ? (
            <p className="px-2 py-1 text-xs text-zinc-400">
              No hay sesiones próximas.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {proximasSesiones.map((sesion) => (
                <button
                  key={`${sesion.familia.id}-${sesion.numeroSesion}`}
                  type="button"
                  onClick={() => {
                    onSeleccionarSesion(sesion)
                    setAbiertas(false)
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded !border-0 !bg-transparent px-2 py-1.5 text-left !text-xs !font-normal !text-zinc-200 !shadow-none hover:!bg-zinc-800"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{sesion.familia.nombre}</span>
                    <span className="block text-[10px] text-zinc-400">
                      Sesión {sesion.numeroSesion} · {NOMBRE_ETAPA[sesion.etapa]} · Mes {sesion.numeroMes}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-zinc-400">
                    {sesion.fecha.toLocaleDateString('es-CL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
