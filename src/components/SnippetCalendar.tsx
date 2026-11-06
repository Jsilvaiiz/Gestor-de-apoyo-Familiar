import { useMemo, useState } from 'react'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function SnippetCalendar() {
  const todayKey = toDateKey(new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

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

  function selectDate(date: Date) {
    setSelectedDate(toDateKey(date))
  }

  const monthLabel = visibleMonth.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section className="h-full min-h-0 w-full text-left text-white">
      {/* Contenedor principal con borde exterior claro */}
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-zinc-700/80 bg-zinc-900">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-700/80 p-3 sm:p-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Ruta regular</h1>
            <p className="truncate text-sm capitalize text-gray-400">{selectedDateLabel}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-none! bg-transparent! shadow-none! px-3 py-2 text-sm text-gray-300 transition hover:bg-zinc-800 hover:text-white"
              onClick={() => setVisibleMonth(new Date())}
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Mes anterior"
              className="rounded-none! bg-transparent! shadow-none! px-2.5 py-1.5 text-lg text-gray-300 transition hover:bg-zinc-800 hover:text-white"
              onClick={() =>
                setVisibleMonth(
                  (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
                )
              }
            >
              ‹
            </button>
            <h2 className="min-w-32 text-center text-lg capitalize">{monthLabel}</h2>
            <button
              type="button"
              aria-label="Mes siguiente"
              className="rounded-none! bg-transparent! shadow-none! px-2.5 py-1.5 text-lg text-gray-300 transition hover:bg-zinc-800 hover:text-white"
              onClick={() =>
                setVisibleMonth(
                  (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
                )
              }
            >
              ›
            </button>
          </div>
        </header>

        {/* Días de la semana con división inferior */}
        <div className="grid shrink-0 grid-cols-7 border-b border-zinc-700/80 bg-zinc-900/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Cuadrícula de celdas cuadradas sin esquinas redondeadas */}
        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 bg-zinc-800/40 gap-px">
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date)
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()

            return (
              <button
                type="button"
                key={dateKey}
                aria-label={date.toLocaleDateString('es-ES')}
                aria-pressed={selectedDate === dateKey}
                onClick={() => selectDate(date)}
                className={`flex h-full w-full flex-col items-start justify-start outline-none border-none rounded-none! shadow-none! bg-zinc-900 p-1 text-left transition hover:bg-zinc-800 ${
                  isCurrentMonth ? 'text-white' : 'text-zinc-600 opacity-40'
                } ${selectedDate === dateKey ? 'bg-blue-950/60 ring-2 ring-inset ring-blue-500' : ''}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-none text-xs ${
                    dateKey === todayKey ? 'bg-blue-900 font-bold text-white' : ''
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SnippetCalendar