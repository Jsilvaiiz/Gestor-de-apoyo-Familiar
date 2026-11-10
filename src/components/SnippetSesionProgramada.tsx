import { useEffect, useRef } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import type { Etiqueta } from '../utils/etiquetas'
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

interface SnippetSesionProgramadaProps {
  sesion: SesionProgramada
  etiquetas: Etiqueta[]
  cantidadEnElDia: number
  abierta: boolean
  onStartDrag: (
    sesion: SesionProgramada,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void
  onClick: (
    sesion: SesionProgramada,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => void
  onCerrar: () => void
}

export default function SnippetSesionProgramada({
  sesion,
  etiquetas,
  cantidadEnElDia,
  abierta,
  onStartDrag,
  onClick,
  onCerrar,
}: SnippetSesionProgramadaProps) {
  const estilo = ETAPA_COLOR[sesion.etapa]
  const width = Math.max(36, 72 - (cantidadEnElDia - 1) * 5)
  const fontSize = Math.max(6, 12 - (cantidadEnElDia - 1))
  const arrastrable = sesion.etapa !== 1

  return (
    <div
      className="relative min-h-0"
      style={{ flex: '1 1 0%', width, maxWidth: '100%' }}
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
          lineHeight: 1.1,
          padding: '4px',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.25)',
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
          onCerrar={onCerrar}
        />
      )}
    </div>
  )
}

interface SesionPopoverProps {
  sesion: SesionProgramada
  etiquetas: Etiqueta[]
  onCerrar: () => void
}

function SesionPopover({ sesion, etiquetas, onCerrar }: SesionPopoverProps) {
  const tarjetaRef = useRef<HTMLDivElement>(null)
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
      className={`absolute bottom-full left-0 z-50 mb-1 w-48 max-w-[75vw] max-h-44 overflow-y-auto rounded-sm p-2 text-zinc-900 shadow-lg ${ETAPA_COLOR[sesion.etapa].nota}`}
    >
      <div className="mb-1 flex items-start justify-between gap-1">
        <h3 className="min-w-0 flex-1 truncate text-xs font-bold">
          {sesion.familia.nombre}
        </h3>
        <button
          type="button"
          aria-label="Cerrar resumen de sesión"
          onClick={onCerrar}
          className="!border-0 !bg-transparent !p-0 text-sm leading-none text-zinc-700 !shadow-none hover:text-black"
        >
          ×
        </button>
      </div>
      <p className="text-[10px] font-medium">
        {sesion.fecha.toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <p className="mb-1 text-[9px] opacity-70">
        {NOMBRE_ETAPA[sesion.etapa]} · Mes {sesion.numeroMes}
      </p>

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
              <p
                key={observacion.id}
                className="line-clamp-2 break-words text-[10px] leading-tight"
              >
                {observacion.texto}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[10px] italic opacity-60">Sin comentarios</p>
        )}
      </div>
    </div>
  )
}
