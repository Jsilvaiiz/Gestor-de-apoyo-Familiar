import { useEffect, useMemo, useState } from 'react'
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

function SnippetCalendar({
  selectedDate,
  onSelectDate,
  visibleMonth,
  onVisibleMonthChange,
}: SnippetCalendarProps) {
  const todayKey = toDateKey(new Date())
  const [familias, setFamilias] = useState<Familia[]>([])
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [errorFamilias, setErrorFamilias] = useState('')
  const [sesionAbierta, setSesionAbierta] = useState<SesionProgramada | null>(null)
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
      setSesionAbierta(null)
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
            `No se pudieron cargar las sesiones de las familias: ${String(error)}`
          )
        }
      }
    }

    void cargarDatos()

    return () => {
      mounted = false
    }
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

  const sesionesPorSemana = useMemo(
    () => calcularSesionesRutaRegular(familias),
    [familias]
  )

  const selectedDateKey = toDateKey(selectedDate)

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
        
        

          <div className="grid grid-cols-[1fr_auto_1fr] items-center py-1 text-sm font-medium text-zinc-400">
            <span />
            <span className="text-center">
              {visibleMonth.toLocaleDateString("es-CL", {
                month: "long",
              }).replace(/^./, (letra) => letra.toUpperCase())}
              {" "}
              {visibleMonth.getFullYear()}
            </span>
            <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 pr-2 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-teal-900" aria-hidden="true" />
                Sesión
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-zinc-700" aria-hidden="true" />
                Fin de semana
              </span>
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

        <div className="grid min-h-0 flex-1 grid-rows-6 gap-px bg-zinc-800/40">
          {Array.from({ length: 6 }, (_, weekIndex) => {
            const weekDays = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7)
            const weekKey = toDateKey(weekDays[0])
            const sesionesSemana = sesionesPorSemana.get(weekKey) ?? []
            const etapasSemana = calcularEtapasRutaRegular(familias, weekDays[0])
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
                  const fondoDia = isWeekend
                    ? '!bg-zinc-700'
                    : sesionesSemana.length > 0
                      ? '!bg-teal-950/70'
                      : isToday
                        ? '!bg-[#0C3956]'
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
                          ...(sesionesDelDia.some((sesion) => sesion === sesionAbierta)
                            ? ['z-30']
                            : []),
                          ...(fechaDestinoArrastre === dateKey
                            ? ['z-20 ring-2 ring-inset ring-sky-400']
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
                      {sesionesDelDia.length > 0 && (
                        <div
                          className="pointer-events-none absolute z-10 flex flex-col items-start overflow-visible"
                          style={{
                            top: 28,
                            left: 4,
                            right: 2,
                            bottom: 2,
                            gap: sesionesDelDia.length > 1 ? 2 : 4,
                          }}
                        >
                          {sesionesDelDia.map((sesion, indice) => (
                            <SnippetSesionProgramada
                              key={`${sesion.familia.id}-${indice}`}
                              sesion={sesion}
                              etiquetas={etiquetas}
                              cantidadEnElDia={sesionesDelDia.length}
                              abierta={sesionAbierta === sesion}
                              onStartDrag={iniciarArrastre}
                              onClick={(sesionClicada, event) => {
                                event.stopPropagation()
                                if (debeIgnorarClick()) {
                                  event.preventDefault()
                                  return
                                }
                                setSesionAbierta(
                                  sesionAbierta === sesionClicada ? null : sesionClicada
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
                              onCerrar={() => setSesionAbierta(null)}
                            />
                          ))}
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

export default SnippetCalendar