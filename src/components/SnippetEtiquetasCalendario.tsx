import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { leerFamilias, type Familia } from '../utils/familias'
import {
  eliminarEtiquetaCalendario,
  guardarEtiquetaCalendario,
  leerEtiquetasCalendario,
  moverEtiquetaCalendario,
  type EtiquetaCalendario,
} from '../utils/etiquetasCalendario'

interface EtiquetasCalendarioContextValue {
  etiquetas: EtiquetaCalendario[]
  familias: Familia[]
  abrirEditor: (fecha: Date, etiqueta?: EtiquetaCalendario) => void
  errorCarga: string
  moverEtiqueta: (id: string, fecha: string) => Promise<void>
  fechaDestinoArrastre: string | null
  setFechaDestinoArrastre: (fecha: string | null) => void
}

const EtiquetasCalendarioContext =
  createContext<EtiquetasCalendarioContextValue | null>(null)

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useEtiquetasCalendario() {
  const context = useContext(EtiquetasCalendarioContext)
  if (!context) {
    throw new Error(
      'Los componentes de etiquetas deben estar dentro de EtiquetasCalendarioProvider'
    )
  }
  return context
}

export function EtiquetasCalendarioProvider({
  children,
}: {
  children: ReactNode
}) {
  const [etiquetas, setEtiquetas] = useState<EtiquetaCalendario[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [errorCarga, setErrorCarga] = useState('')
  const [fechaDestinoArrastre, setFechaDestinoArrastre] = useState<string | null>(null)
  const [fechaEditor, setFechaEditor] = useState('')
  const [etiquetaEditando, setEtiquetaEditando] =
    useState<EtiquetaCalendario | null>(null)
  const [editorAbierto, setEditorAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [comentario, setComentario] = useState('')
  const [familiaId, setFamiliaId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorEditor, setErrorEditor] = useState('')

  const cargarEtiquetas = useCallback(async () => {
    try {
      const [notas, datosFamilias] = await Promise.all([
        leerEtiquetasCalendario(),
        leerFamilias(),
      ])
      setEtiquetas(notas)
      setFamilias(datosFamilias.filter((familia) => familia.archivada !== true))
      setErrorCarga('')
    } catch (error) {
      setErrorCarga(`No se pudieron cargar las etiquetas: ${String(error)}`)
    }
  }, [])

  useEffect(() => {
    void cargarEtiquetas()
    window.addEventListener('etiquetas-calendario-actualizadas', cargarEtiquetas)
    return () =>
      window.removeEventListener(
        'etiquetas-calendario-actualizadas',
        cargarEtiquetas
      )
  }, [cargarEtiquetas])

  const abrirEditor = useCallback(
    (fecha: Date, etiqueta?: EtiquetaCalendario) => {
      setFechaEditor(etiqueta?.fecha ?? toDateKey(fecha))
      setEtiquetaEditando(etiqueta ?? null)
      setNombre(etiqueta?.etiqueta ?? '')
      setComentario(etiqueta?.comentario ?? '')
      setFamiliaId(etiqueta?.familiaId ?? '')
      setErrorEditor('')
      setEditorAbierto(true)
    },
    []
  )

  const moverEtiqueta = useCallback(async (id: string, fecha: string) => {
    try {
      setEtiquetas(await moverEtiquetaCalendario(id, fecha))
      window.dispatchEvent(new Event('etiquetas-calendario-actualizadas'))
    } catch (error) {
      setErrorCarga(`No se pudo mover la etiqueta: ${String(error)}`)
    }
  }, [])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (guardando) return

    setGuardando(true)
    setErrorEditor('')
    try {
      setEtiquetas(
        await guardarEtiquetaCalendario({
          id: etiquetaEditando?.id,
          fecha: fechaEditor,
          etiqueta: nombre,
          comentario,
          familiaId: familiaId || undefined,
        })
      )
      window.dispatchEvent(new Event('etiquetas-calendario-actualizadas'))
      setEditorAbierto(false)
    } catch (error) {
      setErrorEditor(`No se pudo guardar la etiqueta: ${String(error)}`)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!etiquetaEditando) return

    setErrorEditor('')
    try {
      setEtiquetas(await eliminarEtiquetaCalendario(etiquetaEditando.id))
      window.dispatchEvent(new Event('etiquetas-calendario-actualizadas'))
      setEditorAbierto(false)
    } catch (error) {
      setErrorEditor(`No se pudo eliminar la etiqueta: ${String(error)}`)
    }
  }

  const contextValue = useMemo(
    () => ({
      etiquetas,
      familias,
      abrirEditor,
      errorCarga,
      moverEtiqueta,
      fechaDestinoArrastre,
      setFechaDestinoArrastre,
    }),
    [
      etiquetas,
      familias,
      abrirEditor,
      errorCarga,
      moverEtiqueta,
      fechaDestinoArrastre,
    ]
  )

  return (
    <EtiquetasCalendarioContext.Provider value={contextValue}>
      {children}
      {editorAbierto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditorAbierto(false)
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-label={
              etiquetaEditando
                ? 'Editar etiqueta del calendario'
                : 'Agregar etiqueta al calendario'
            }
            onSubmit={(event) => void guardar(event)}
            className="w-full max-w-sm space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white shadow-2xl"
          >
            <div>
              <h2 className="text-sm font-semibold">
                {etiquetaEditando ? 'Editar etiqueta' : 'Nueva etiqueta'}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(`${fechaEditor}T00:00:00`).toLocaleDateString(
                  'es-CL',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </p>
            </div>
            <label className="block space-y-1 text-xs text-zinc-300">
              Etiqueta
              <input
                autoFocus
                required
                maxLength={50}
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="w-full rounded border border-zinc-600 !bg-zinc-800 px-2 py-1.5 text-sm !text-white"
              />
            </label>
            <label className="block space-y-1 text-xs text-zinc-300">
              Comentario
              <textarea
                required
                maxLength={1000}
                rows={3}
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                className="w-full resize-y rounded border border-zinc-600 !bg-zinc-800 px-2 py-1.5 text-sm !text-white"
              />
            </label>
            <label className="block space-y-1 text-xs text-zinc-300">
              Familia relacionada (opcional)
              <select
                value={familiaId}
                onChange={(event) => setFamiliaId(event.target.value)}
                className="w-full rounded border border-zinc-600 !bg-zinc-800 px-2 py-1.5 text-sm !text-white"
              >
                <option value="">Ninguna</option>
                {familias.map((familia) => (
                  <option key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </option>
                ))}
              </select>
            </label>
            {errorEditor && (
              <p role="alert" className="text-xs text-red-300">
                {errorEditor}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              {etiquetaEditando && (
                <button
                  type="button"
                  onClick={() => void eliminar()}
                  className="!rounded !border-red-900 !bg-red-950 !px-3 !py-1.5 !text-xs !text-red-200 !shadow-none hover:!bg-red-900"
                >
                  Eliminar
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditorAbierto(false)}
                  className="!rounded !border-zinc-600 !bg-zinc-800 !px-3 !py-1.5 !text-xs !text-zinc-200 !shadow-none hover:!bg-zinc-700"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="!rounded !border-sky-700 !bg-sky-800 !px-3 !py-1.5 !text-xs !text-white !shadow-none hover:!bg-sky-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </EtiquetasCalendarioContext.Provider>
  )
}

export function BotonNuevaEtiquetaCalendario({ fecha }: { fecha: Date }) {
  const { abrirEditor, errorCarga } = useEtiquetasCalendario()

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={() => abrirEditor(fecha)}
        className="!rounded-none !border-none !bg-sky-800 !px-2 !py-1 !text-[10px] !font-medium !text-white !shadow-none hover:!bg-sky-700"
      >
        + Etiqueta
      </button>
      {errorCarga && (
        <span role="alert" className="absolute top-full mt-1 text-[10px] text-red-300">
          {errorCarga}
        </span>
      )}
    </div>
  )
}

export function EtiquetaDiaCalendario({
  etiqueta,
  fecha,
  onSelectDate,
}: {
  etiqueta: EtiquetaCalendario
  fecha: Date
  onSelectDate: (date: Date) => void
}) {
  const {
    abrirEditor,
    moverEtiqueta,
    familias,
    setFechaDestinoArrastre,
  } = useEtiquetasCalendario()
  const arrastreRef = useRef<{
    pointerId: number
    xInicial: number
    yInicial: number
    iniciado: boolean
  } | null>(null)
  const ignorarClickHastaRef = useRef(0)
  const [posicionArrastre, setPosicionArrastre] = useState<{
    x: number
    y: number
  } | null>(null)
  const familia = familias.find((item) => item.id === etiqueta.familiaId)

  useEffect(() => {
    function moverPuntero(event: PointerEvent) {
      const arrastre = arrastreRef.current
      if (!arrastre || event.pointerId !== arrastre.pointerId) return

      if (
        !arrastre.iniciado &&
        Math.hypot(event.clientX - arrastre.xInicial, event.clientY - arrastre.yInicial) < 8
      ) {
        return
      }

      arrastre.iniciado = true
      const fechaDestino = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-calendar-date]')
        ?.dataset.calendarDate ?? null
      setFechaDestinoArrastre(fechaDestino)
      setPosicionArrastre({ x: event.clientX, y: event.clientY })
      event.preventDefault()
    }

    function terminarArrastre(event: PointerEvent) {
      const arrastre = arrastreRef.current
      if (!arrastre || event.pointerId !== arrastre.pointerId) return

      arrastreRef.current = null
      setPosicionArrastre(null)
      setFechaDestinoArrastre(null)
      if (!arrastre.iniciado) return

      ignorarClickHastaRef.current = Date.now() + 500
      const destino = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-calendar-date]')
        ?.dataset.calendarDate
      if (destino && destino !== etiqueta.fecha) {
        void moverEtiqueta(etiqueta.id, destino)
      }
    }

    function cancelarArrastre(event: PointerEvent) {
      if (event.pointerId !== arrastreRef.current?.pointerId) return
      arrastreRef.current = null
      setPosicionArrastre(null)
      setFechaDestinoArrastre(null)
    }

    window.addEventListener('pointermove', moverPuntero, { passive: false })
    window.addEventListener('pointerup', terminarArrastre)
    window.addEventListener('pointercancel', cancelarArrastre)
    return () => {
      window.removeEventListener('pointermove', moverPuntero)
      window.removeEventListener('pointerup', terminarArrastre)
      window.removeEventListener('pointercancel', cancelarArrastre)
    }
  }, [etiqueta, moverEtiqueta, setFechaDestinoArrastre])

  return (
    <>
      <button
        type="button"
        title={`${etiqueta.etiqueta}${familia ? ` · ${familia.nombre}` : ''}: ${etiqueta.comentario}`}
        onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
          if (event.button !== 0) return
          event.stopPropagation()
          arrastreRef.current = {
            pointerId: event.pointerId,
            xInicial: event.clientX,
            yInicial: event.clientY,
            iniciado: false,
          }
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (Date.now() < ignorarClickHastaRef.current) {
            ignorarClickHastaRef.current = 0
            return
          }
          onSelectDate(fecha)
          abrirEditor(fecha, etiqueta)
        }}
        className="pointer-events-auto max-w-[95%] touch-none select-none truncate !rounded-sm !border border-sky-300/50 !bg-sky-700 !px-1 !py-0.5 !text-[9px] !font-medium !text-white !shadow-md hover:!bg-sky-600 hover:!cursor-grab active:!cursor-grabbing"
      >
        {etiqueta.etiqueta}{familia ? ` · ${familia.nombre}` : ''}
      </button>
      {posicionArrastre && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] -translate-y-1/2 rounded-sm border border-sky-300/50 bg-sky-700 px-2 py-1 text-[10px] font-medium text-white shadow-xl"
          style={{ left: posicionArrastre.x + 12, top: posicionArrastre.y + 12 }}
        >
          {etiqueta.etiqueta}
        </span>
      )}
    </>
  )
}
