import { useEffect, useMemo, useRef, useState } from 'react'
import { leerFamilias, type Familia } from '../utils/familias'
import { leerEtiquetas, type Etiqueta } from '../utils/etiquetas'
import {
  calcularEtapasRutaRegular,
  calcularSesionesRutaRegular,
  SESIONES_POR_ETAPA,
  type EtapaRutaRegular,
  type SesionProgramada,
} from '../utils/rutaRegular'
import SnippetSesionProgramada from './SnippetSesionProgramada'
import { useCalendarSessionDrag } from './useCalendarSessionDrag'
import {
  BotonNuevaEtiquetaCalendario,
  EtiquetaDiaCalendario,
  EtiquetasCalendarioProvider,
  useEtiquetasCalendario,
} from './SnippetEtiquetasCalendario'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const ETAPA_ESTILOS: Record<EtapaRutaRegular, string> = {
  1: 'bg-purple-400 text-white',
  2: 'bg-yellow-400 text-zinc-900',
  3: 'bg-blue-800 text-white',
  4: 'bg-violet-700 text-white',
}
const NOMBRE_ETAPA: Record<EtapaRutaRegular, string> = {
  1: 'Etapa I',
  2: 'Etapa II',
  3: 'Etapa III',
  4: 'Etapa IV',
}

interface SnippetCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  visibleMonth: Date;
  onVisibleMonthChange: (month: Date) => void;
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getSesionKey(sesion: SesionProgramada) {
  return `${sesion.familia.id}:${toDateKey(sesion.fechaOriginal)}`
}

function CalendarioContenido({
  selectedDate,
  onSelectDate,
  visibleMonth,
  onVisibleMonthChange,
}: SnippetCalendarProps) {
  const {
    etiquetas: etiquetasCalendario,
    fechaDestinoArrastre: fechaDestinoEtiqueta,
  } = useEtiquetasCalendario()
  const todayKey = toDateKey(new Date())
  const [familias, setFamilias] = useState<Familia[]>([])
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [errorFamilias, setErrorFamilias] = useState('')
  const [sesionAbiertaKey, setSesionAbiertaKey] = useState<string | null>(null)
  const [familiasSeleccionadas, setFamiliasSeleccionadas] = useState<string[] | null>(null)
  const [filtroFamiliasAbierto, setFiltroFamiliasAbierto] = useState(false)
  const calendarioGridRef = useRef<HTMLDivElement>(null)
  const [altoFilaCalendario, setAltoFilaCalendario] = useState(0)
  const {
    fechaDestinoArrastre,
    tarjetaArrastrada,
    iniciarArrastre,
    debeIgnorarClick,
  } = useCalendarSessionDrag({
    familias,
    onFamiliaActualizada: (familiaActualizada) =>
      setFamilias((actuales) =>
        actuales.map((familia) =>
          familia.id === familiaActualizada.id ? familiaActualizada : familia
        )
      ),
    onError: setErrorFamilias,
    onMoveComplete: () => {
      setSesionAbiertaKey(null)
      setErrorFamilias('')
    },
  })

  useEffect(() => {
    let mounted = true

    async function cargarDatos() {
      try {
        const [datos, etiquetasGuardadas] = await Promise.all([
          leerFamilias(),
          leerEtiquetas(),
        ])
        if (mounted) {
          setFamilias(datos)
          setEtiquetas(etiquetasGuardadas)
          setErrorFamilias('')
        }
      } catch (error) {
        if (mounted) {
          setErrorFamilias(
            `No se pudieron cargar los datos del calendario: ${String(error)}`
          )
        }
      }
    }

    void cargarDatos()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const grid = calendarioGridRef.current
    if (!grid) return

    const observer = new ResizeObserver(() => {
      setAltoFilaCalendario(grid.clientHeight / 6)
    })
    observer.observe(grid)
    setAltoFilaCalendario(grid.clientHeight / 6)

    return () => observer.disconnect()
  }, [])

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7
    const start = new Date(firstOfMonth)
    start.setDate(firstOfMonth.getDate() - mondayOffset)

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [visibleMonth])

  const familiasActivas = useMemo(
    () => familias.filter((familia) => familia.archivada !== true),
    [familias]
  )

  const familiasVisibles = useMemo(
    () =>
      familiasSeleccionadas === null
        ? familiasActivas
        : familiasActivas.filter((familia) =>
            familiasSeleccionadas.includes(familia.id)
          ),
    [familiasActivas, familiasSeleccionadas]
  )

  const sesionesPorSemana = useMemo(
    () => calcularSesionesRutaRegular(familiasVisibles),
    [familiasVisibles]
  )

  const selectedDateKey = toDateKey(selectedDate)
  const todasLasFamiliasSeleccionadas =
    familiasSeleccionadas === null ||
    familiasActivas.every((familia) =>
      familiasSeleccionadas.includes(familia.id)
    )

  function cambiarFiltroFamilia(familiaId: string) {
    const seleccionActual =
      familiasSeleccionadas ?? familiasActivas.map((familia) => familia.id)
    const nuevaSeleccion = seleccionActual.includes(familiaId)
      ? seleccionActual.filter((id) => id !== familiaId)
      : [...seleccionActual, familiaId]

    setFamiliasSeleccionadas(
      nuevaSeleccion.length === familiasActivas.length ? null : nuevaSeleccion
    )
    setSesionAbiertaKey(null)
  }

  return (
    <section className="h-full min-h-0 w-full text-left text-white">
      {tarjetaArrastrada && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] -translate-y-1/2 rounded-sm border border-black/30 px-2 py-1 text-xs font-bold capitalize shadow-xl opacity-90"
          style={{
            left: tarjetaArrastrada.x + 12,
            top: tarjetaArrastrada.y + 12,
            backgroundColor: ['#c084fc', '#facc15', '#1e40af', '#6d28d9'][
              tarjetaArrastrada.etapa - 1
            ],
            color: tarjetaArrastrada.etapa === 2 ? '#18181b' : '#ffffff',
          }}
        >
          {tarjetaArrastrada.nombre}
        </div>
      )}
      <div className="group relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-900">
        
        

          <div className="relative z-40 grid grid-cols-[1fr_auto_1fr] items-center py-1 text-sm font-medium text-zinc-400">
            <div className="relative flex items-center gap-1 justify-self-start pl-2">
              <BotonNuevaEtiquetaCalendario fecha={selectedDate} />
              <button
                type="button"
                aria-expanded={filtroFamiliasAbierto}
                aria-haspopup="true"
                onClick={() => setFiltroFamiliasAbierto((abierto) => !abierto)}
                className="!rounded-none !border-none !bg-zinc-800 !px-2 !py-1 !text-[10px] !font-medium !text-zinc-200 !shadow-none hover:!bg-zinc-700"
              >
                Familias: {todasLasFamiliasSeleccionadas
                  ? 'Todas'
                  : familiasSeleccionadas?.length === 0
                    ? 'Ninguna'
                    : `${familiasSeleccionadas?.length} seleccionada(s)`}
              </button>
              {filtroFamiliasAbierto && (
                <div
                  role="group"
                  aria-label="Filtrar familias del calendario"
                  className="absolute left-2 top-full z-[60] mt-1 max-h-56 w-52 overflow-y-auto rounded border border-zinc-600 bg-zinc-900 p-2 text-xs text-zinc-100 shadow-xl"
                >
                  <label className="flex cursor-pointer items-center gap-2 border-b border-zinc-700 pb-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={todasLasFamiliasSeleccionadas}
                      className="!m-0 !h-3 !w-3 !shrink-0 !p-0 !accent-sky-500"
                      onChange={() => {
                        setFamiliasSeleccionadas(
                          todasLasFamiliasSeleccionadas
                            ? []
                            : null
                        )
                        setSesionAbiertaKey(null)
                      }}
                    />
                    Todas las familias
                  </label>
                  {familiasActivas.map((familia) => (
                    <label
                      key={familia.id}
                      className="flex cursor-pointer items-center gap-2 py-1"
                    >
                      <input
                        type="checkbox"
                        className="!m-0 !h-3 !w-3 !shrink-0 !p-0 !accent-sky-500"
                        checked={
                          familiasSeleccionadas === null ||
                          familiasSeleccionadas.includes(familia.id)
                        }
                        onChange={() => cambiarFiltroFamilia(familia.id)}
                      />
                      <span className="truncate">{familia.nombre}</span>
                    </label>
                  ))}
                  {familiasActivas.length === 0 && (
                    <p className="py-2 text-zinc-400">No hay familias para mostrar.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiltroFamiliasAbierto(false)}
                    className="mt-1 w-full !rounded !border-zinc-700 !bg-zinc-800 !px-2 !py-1 !text-xs !text-zinc-200 !shadow-none hover:!bg-zinc-700"
                  >
                    Listo
                  </button>
                </div>
              )}
            </div>
            <span className="text-center">
              {visibleMonth.toLocaleDateString("es-CL", {
                month: "long",
              }).replace(/^./, (letra) => letra.toUpperCase())}
              {" "}
              {visibleMonth.getFullYear()}
            </span>
            <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 pr-2 text-[10px]">
              {([1, 2, 3, 4] as const).map((etapa) => (
                <span key={etapa} className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-sm ${ETAPA_ESTILOS[etapa].split(' ')[0]}`} aria-hidden="true" />
                  {NOMBRE_ETAPA[etapa]}
                </span>
              ))}
            </span>
          </div>
        <div className="grid shrink-0 grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,0.65fr)_minmax(0,0.65fr)] border-b border-zinc-700/80 bg-zinc-800/40">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div
          ref={calendarioGridRef}
          className="grid min-h-0 flex-1 grid-rows-6 gap-px bg-zinc-800/40"
        >
          {Array.from({ length: 6 }, (_, weekIndex) => {
            const weekDays = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7)
            const weekKey = toDateKey(weekDays[0])
            const sesionesSemana = sesionesPorSemana.get(weekKey) ?? []
            const etapasSemana = calcularEtapasRutaRegular(familiasVisibles, weekDays[0])
            const detalleSesiones = sesionesSemana
              .map(({ familia, etapa, numeroMes }) =>
                `${familia.nombre} (${NOMBRE_ETAPA[etapa]}, mes ${numeroMes})`
              )
              .join(', ')
            const detalleEtapas = etapasSemana
              .map(({ familia, etapa, numeroMes }) =>
                `${familia.nombre}: ${NOMBRE_ETAPA[etapa]}, mes ${numeroMes}`
              )
              .join(', ')

            return (
              <div
                key={weekKey}
                className="grid min-h-0 grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,0.65fr)_minmax(0,0.65fr)] gap-px bg-zinc-800/40"
              >
                {weekDays.map((date) => {
                  const dateKey = toDateKey(date)
                  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()
                  const isToday = dateKey === todayKey
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const sesionesDelDia = sesionesSemana.filter(
                    (sesion) => toDateKey(sesion.fecha) === dateKey
                  )
                  const etiquetasDelDia = etiquetasCalendario.filter(
                    (etiqueta) => etiqueta.fecha === dateKey
                  )
                  const fondoDia = isWeekend
                    ? '!bg-zinc-700'
                    : isToday
                      ? '!bg-[#0C3956]'
                      : sesionesSemana.length > 0
                        ? '!bg-teal-950/70'
                        : '!bg-zinc-800'
                  const ariaLabel = `${date.toLocaleDateString('es-ES')}${
                    detalleSesiones ? `. Sesiones esta semana: ${detalleSesiones}` : ''
                  }${detalleEtapas ? `. Etapas esta semana: ${detalleEtapas}` : ''}`
                  const title = [detalleSesiones, detalleEtapas]
                    .filter(Boolean)
                    .join(' | ')

                  return (
                    <div
                      key={dateKey}
                      data-calendar-date={dateKey}
                      className={`relative min-h-0 min-w-0 ${
                        [
                          ...(sesionesDelDia.some((sesion) => getSesionKey(sesion) === sesionAbiertaKey)
                            ? ['z-30']
                            : []),
                          ...(fechaDestinoArrastre === dateKey
                            ? ['z-20 ring-2 ring-inset ring-sky-400']
                            : []),
                          ...(fechaDestinoEtiqueta === dateKey
                            ? ['z-20 ring-2 ring-inset ring-emerald-400']
                            : []),
                        ].join(' ')
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={ariaLabel}
                        aria-pressed={selectedDateKey === dateKey}
                        title={title || undefined}
                        onClick={() => onSelectDate(date)}
                        className={`absolute inset-0 flex w-full flex-col items-start justify-start outline-none border-none rounded-none! shadow-none! ${fondoDia} p-1 text-left transition hover:bg-zinc-800 ${
                          isCurrentMonth ? 'text-white' : 'text-zinc-400 opacity-40'
                        } ${selectedDateKey === dateKey ? 'bg-blue-950/60 ring-2 ring-inset ring-blue-500' : ''}`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-xs ${
                            isToday ? 'font-bold text-white' : ''
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </button>
                      {(sesionesDelDia.length > 0 || etiquetasDelDia.length > 0) && (
                        <div
                          className="pointer-events-none absolute z-10 flex flex-row items-center overflow-visible"
                          style={{
                            top: 28,
                            left: 2,
                            right: 4,
                            bottom: 2,
                          }}
                        >
                          {sesionesDelDia.length > 0 && (
                            <div
                              className={`pointer-events-none flex min-w-0 flex-col items-center justify-center overflow-visible ${
                                etiquetasDelDia.length > 0 ? 'w-[68%]' : 'w-full'
                              }`}
                              style={{
                                gap: Math.max(0, 3 - sesionesDelDia.length),
                              }}
                            >
                              {sesionesDelDia.map((sesion, indice) => (
                                <SnippetSesionProgramada
                                  key={`${sesion.familia.id}-${indice}`}
                                  sesion={sesion}
                                  etiquetas={etiquetas}
                                  cantidadEnElDia={sesionesDelDia.length}
                                  altoDisponible={
                                    altoFilaCalendario > 0
                                      ? Math.max(
                                          10,
                                          (altoFilaCalendario -
                                            32 -
                                            Math.max(0, sesionesDelDia.length - 1)) /
                                            sesionesDelDia.length
                                        )
                                      : undefined
                                  }
                                  abierta={sesionAbiertaKey === getSesionKey(sesion)}
                                  onStartDrag={iniciarArrastre}
                                  onClick={(sesionClicada, event) => {
                                    event.stopPropagation()
                                    if (debeIgnorarClick()) {
                                      event.preventDefault()
                                      return
                                    }
                                    const sesionKey = getSesionKey(sesionClicada)
                                    setSesionAbiertaKey((abierta) =>
                                      abierta === sesionKey ? null : sesionKey
                                    )
                                  }}
                                  onFamiliaActualizada={(familiaActualizada) =>
                                    setFamilias((actuales) =>
                                      actuales.map((familia) =>
                                        familia.id === familiaActualizada.id
                                          ? familiaActualizada
                                          : familia
                                      )
                                    )
                                  }
                                  onCerrar={() => setSesionAbiertaKey(null)}
                                />
                              ))}
                            </div>
                          )}
                          {etiquetasDelDia.length > 0 && (
                            <div
                              className={`pointer-events-none flex min-w-0 flex-col items-end justify-center gap-1 ${
                                sesionesDelDia.length > 0 ? 'w-[32%]' : 'ml-auto w-full'
                              }`}
                            >
                              {etiquetasDelDia.map((etiqueta) => (
                                <EtiquetaDiaCalendario
                                  key={etiqueta.id}
                                  etiqueta={etiqueta}
                                  fecha={date}
                                  onSelectDate={onSelectDate}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {date.getDay() === 1 && etapasSemana.length > 0 && sesionesDelDia.length === 0 && (
                        <span className="pointer-events-none absolute bottom-1 left-1 flex flex-wrap gap-0.5">
                          {Array.from(new Set(etapasSemana.map(({ etapa }) => etapa))).map((etapa) => (
                            <span
                              key={etapa}
                              className={`rounded px-1 text-[9px] leading-tight ${ETAPA_ESTILOS[etapa]}`}
                            >
                              {etapa}. {SESIONES_POR_ETAPA[etapa]} ses.
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {errorFamilias && (
          <p role="alert" className="bg-red-900/40 px-3 py-2 text-sm text-red-300">
            {errorFamilias}
          </p>
        )}

          {/* Zona izquierda: mes anterior */}
          <div className="group/izquierda absolute left-0 top-0 bottom-0 z-20 flex w-14 items-center justify-start">

            <button
              type="button"
              aria-label="Mes anterior"
              title="Mes anterior"
              onClick={() =>
                onVisibleMonthChange(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="ml-2 rounded-full! bg-zinc-950/80! p-3!
                        text-white shadow-lg!
                        opacity-0 group-hover/izquierda:opacity-100
                        focus-visible:opacity-100 transition-opacity"
            >
              ‹
            </button>

          </div>

          {/* Zona derecha: mes siguiente */}
          <div className="group/derecha absolute right-0 top-0 bottom-0 z-20 flex w-14 items-center justify-end">

            <button
              type="button"
              aria-label="Mes siguiente"
              title="Mes siguiente"
              onClick={() =>
                onVisibleMonthChange(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="mr-2 rounded-full! bg-zinc-950/80! p-3!
                        text-white shadow-lg!
                        opacity-0 group-hover/derecha:opacity-100
                        focus-visible:opacity-100 transition-opacity"
            >
              ›
            </button>

          </div>


      </div>
    </section>
  )
}

export default function SnippetCalendar(props: SnippetCalendarProps) {
  return (
    <EtiquetasCalendarioProvider>
      <CalendarioContenido {...props} />
    </EtiquetasCalendarioProvider>
  )
}