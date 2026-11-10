import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import type { Etiqueta } from '../utils/etiquetas'
import {
  actualizarEstadoSesionFamilia,
  editarObservacionFamilia,
  type Familia,
} from '../utils/familias'
import type { EtapaRutaRegular, SesionProgramada } from '../utils/rutaRegular'

const ETAPA_COLOR: Record<
  EtapaRutaRegular,
  { bg: string; text: string; postIt: string; nota: string }
> = {
  1: { bg: '#c084fc', text: '#ffffff', postIt: '#fb923c', nota: 'bg-purple-200' },
  2: { bg: '#facc15', text: '#18181b', postIt: '#facc15', nota: 'bg-yellow-200' },
  3: { bg: '#1e40af', text: '#ffffff', postIt: '#60a5fa', nota: 'bg-sky-200' },
  4: { bg: '#6d28d9', text: '#ffffff', postIt: '#a78bfa', nota: 'bg-violet-200' },
}

const NOMBRE_ETAPA: Record<EtapaRutaRegular, string> = {
  1: 'Etapa I',
  2: 'Etapa II',
  3: 'Etapa III',
  4: 'Etapa IV',
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface SnippetSesionProgramadaProps {
  sesion: SesionProgramada
  etiquetas: Etiqueta[]
  cantidadEnElDia: number
  altoDisponible?: number
  abierta: boolean
  onStartDrag: (
    sesion: SesionProgramada,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void
  onClick: (
    sesion: SesionProgramada,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => void
  onFamiliaActualizada: (familia: Familia) => void
  onCerrar: () => void
}

export default function SnippetSesionProgramada({
  sesion,
  etiquetas,
  cantidadEnElDia,
  altoDisponible,
  abierta,
  onStartDrag,
  onClick,
  onFamiliaActualizada,
  onCerrar,
}: SnippetSesionProgramadaProps) {
  const estilo = ETAPA_COLOR[sesion.etapa]
  const height = Math.min(
    68,
    altoDisponible ?? Math.max(28, 68 - (cantidadEnElDia - 1) * 8)
  )
  const fontSize = Math.max(8, Math.min(12, height * 0.42))
  const padding = Math.max(1, Math.min(4, height * 0.12))
  const arrastrable = sesion.etapa !== 1

  return (
    <div
      className="relative min-h-0 min-w-0 shrink-0"
      style={{ width: 68, height, maxWidth: '100%' }}
    >
      <button
        type="button"
        aria-label={`Ver sesión de ${sesion.familia.nombre}`}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        onPointerDown={(event) => {
          if (arrastrable) onStartDrag(sesion, event)
        }}
        onClick={(event) => onClick(sesion, event)}
        title={`${sesion.familia.nombre} · ${NOMBRE_ETAPA[sesion.etapa]}`}
        style={{
          backgroundColor: estilo.postIt,
          color: '#27272a',
          fontSize,
          fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
          fontWeight: 600,
          lineHeight: 1.05,
          padding: `${padding}px`,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          boxShadow:
            '2px 4px 8px rgba(0, 0, 0, 0.48), 0 1px 2px rgba(0, 0, 0, 0.35)',
        }}
        className={`pointer-events-auto block h-full w-full min-h-0 select-none overflow-hidden text-center font-bold !rounded-none border border-black/10 capitalize transition hover:brightness-105 !outline-none focus:!outline-none focus:!ring-0 ${
          arrastrable
            ? 'touch-none hover:cursor-grab active:cursor-grabbing'
            : 'cursor-default'
        }`}
      >
        {sesion.familia.nombre}
      </button>

      {abierta && (
        <SesionPopover
          sesion={sesion}
          etiquetas={etiquetas}
          onFamiliaActualizada={onFamiliaActualizada}
          onCerrar={onCerrar}
        />
      )}
    </div>
  )
}

interface SesionPopoverProps {
  sesion: SesionProgramada
  etiquetas: Etiqueta[]
  onFamiliaActualizada: (familia: Familia) => void
  onCerrar: () => void
}

function SesionPopover({
  sesion,
  etiquetas,
  onFamiliaActualizada,
  onCerrar,
}: SesionPopoverProps) {
  const tarjetaRef = useRef<HTMLDivElement>(null)
  const [observacionEditando, setObservacionEditando] = useState<string | null>(null)
  const [textoEditado, setTextoEditado] = useState('')
  const [guardandoObservacion, setGuardandoObservacion] = useState(false)
  const [errorObservacion, setErrorObservacion] = useState('')
  const [mensajeObservacion, setMensajeObservacion] = useState('')
  const observaciones = [...(sesion.familia.observaciones ?? [])]
    .sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime()
    )
    .slice(0, 3)
  const etiquetasFamilia = (sesion.familia.etiquetas ?? []).map((valor) => {
    const etiqueta = etiquetas.find(
      (item) =>
        item.id === valor ||
        item.nombre.toLowerCase() === valor.toLowerCase()
    )

    return etiqueta ?? { id: valor, nombre: valor, color: '#52525b', activa: true }
  })

  async function guardarObservacion(observacionId: string) {
    if (guardandoObservacion) return

    setGuardandoObservacion(true)
    setErrorObservacion('')
    setMensajeObservacion('')
    try {
      const familiaActualizada = await editarObservacionFamilia(
        sesion.familia.id,
        observacionId,
        textoEditado
      )
      onFamiliaActualizada(familiaActualizada)
      window.dispatchEvent(new Event('familias-actualizadas'))
      setObservacionEditando(null)
      setMensajeObservacion('Comentario actualizado.')
    } catch (error) {
      setErrorObservacion(`No se pudo actualizar el comentario: ${String(error)}`)
    } finally {
      setGuardandoObservacion(false)
    }
  }

  async function cambiarEstadoSesion() {
    setErrorObservacion('')
    try {
      const familiaActualizada = await actualizarEstadoSesionFamilia(
        sesion.familia.id,
        toDateKey(sesion.fechaOriginal),
        !sesion.realizada
      )
      onFamiliaActualizada(familiaActualizada)
      window.dispatchEvent(new Event('familias-actualizadas'))
    } catch (error) {
      setErrorObservacion(`No se pudo actualizar la sesión: ${String(error)}`)
    }
  }

  const inicioDeSemana = (fecha: Date) => {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7))
    return inicio
  }
  const puedeMarcarRealizada =
    inicioDeSemana(new Date()) >= inicioDeSemana(sesion.fecha)

  useEffect(() => {
    function cerrarAlHacerClicFuera(event: MouseEvent) {
      if (
        tarjetaRef.current &&
        !tarjetaRef.current.contains(event.target as Node)
      ) {
        onCerrar()
      }
    }

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCerrar()
    }

    document.addEventListener('mousedown', cerrarAlHacerClicFuera)
    document.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [onCerrar])

  return (
    <div
      ref={tarjetaRef}
      role="dialog"
      aria-label={`Sesión de ${sesion.familia.nombre}`}
      className={`pointer-events-auto absolute bottom-full left-0 z-50 mb-1 w-48 max-w-[75vw] max-h-44 overflow-y-auto rounded-sm p-2 text-zinc-900 shadow-lg ${ETAPA_COLOR[sesion.etapa].nota}`}
      style={{ pointerEvents: 'auto' }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-1 flex items-center gap-1">
        <h3 className="min-w-0 flex-1 truncate text-xs font-bold">
          {sesion.familia.nombre}
        </h3>
        {puedeMarcarRealizada && (
          <button
            type="button"
            aria-label={
              sesion.realizada
                ? 'Marcar sesión como pendiente'
                : 'Marcar sesión como realizada'
            }
            aria-pressed={sesion.realizada}
            title={
              sesion.realizada
                ? 'Marcar como pendiente'
                : 'Marcar como realizada'
            }
            onClick={() => void cambiarEstadoSesion()}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full !border-2 !p-0 !shadow-none ${
              sesion.realizada
                ? '!border-green-600 !bg-green-600 !text-white'
                : '!border-zinc-400 !bg-transparent !text-transparent hover:!border-zinc-600'
            }`}
          >
            {sesion.realizada && <Check size={12} aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className="mb-1 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] font-medium">
            {sesion.fecha.toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-[9px] opacity-70">
            Sesión {sesion.numeroSesion} · {NOMBRE_ETAPA[sesion.etapa]} · Mes {sesion.numeroMes}
          </p>
        </div>
      </div>

      <div className="mb-1">
        {etiquetasFamilia.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {etiquetasFamilia.map((etiqueta) => (
              <span
                key={etiqueta.id}
                className="rounded-sm px-1 py-0.5 text-[9px] font-medium text-white"
                style={{ backgroundColor: etiqueta.color }}
              >
                {etiqueta.nombre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-black/15 pt-1">
        {observaciones.length > 0 ? (
          <div className="space-y-1">
            {observaciones.map((observacion) => (
              <div key={observacion.id}>
                {observacionEditando === observacion.id ? (
                  <div className="space-y-1">
                    <textarea
                      autoFocus
                      value={textoEditado}
                      maxLength={2000}
                      rows={3}
                      disabled={guardandoObservacion}
                      onMouseDown={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) => setTextoEditado(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          void guardarObservacion(observacion.id)
                        }
                        if (event.key === 'Escape') {
                          setObservacionEditando(null)
                          setErrorObservacion('')
                        }
                      }}
                      aria-label="Editar comentario"
                      className="pointer-events-auto block w-full resize-y border-0 bg-transparent p-0 text-left text-[10px] font-normal leading-tight text-zinc-900 outline-none focus:ring-1 focus:ring-black/20"
                    />
                  </div>
                ) : (
                  <p
                    role="button"
                    tabIndex={0}
                    title="Haz clic para editar; Enter guarda los cambios"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
                    onClick={() => {
                      setObservacionEditando(observacion.id)
                      setTextoEditado(observacion.texto)
                      setErrorObservacion('')
                      setMensajeObservacion('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setObservacionEditando(observacion.id)
                        setTextoEditado(observacion.texto)
                        setErrorObservacion('')
                        setMensajeObservacion('')
                      }
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="pointer-events-auto relative z-10 block w-full cursor-text whitespace-pre-wrap break-words py-1 text-left text-[10px] font-normal leading-tight text-zinc-900 hover:bg-black/5"
                  >
                    {observacion.texto}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] italic opacity-60">Sin comentarios</p>
        )}
        {errorObservacion && (
          <p role="alert" className="mt-1 text-[9px] text-red-800">
            {errorObservacion}
          </p>
        )}
        {mensajeObservacion && (
          <p role="status" className="mt-1 text-[9px] text-green-800">
            {mensajeObservacion}
          </p>
        )}
      </div>
    </div>
  )
}
