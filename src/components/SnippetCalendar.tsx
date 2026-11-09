import { useMemo } from 'react'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

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

  const monthLabel = visibleMonth.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })
  const selectedDateKey = toDateKey(selectedDate)

  return (
    <section className="h-full min-h-0 w-full text-left text-white">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-zinc-700/80 bg-zinc-900">
        <header className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-b border-zinc-700/80 p-3 sm:p-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mes anterior"
              className="rounded-none! bg-transparent! shadow-none! px-2.5 py-1.5 text-lg text-gray-300 transition hover:bg-zinc-800 hover:text-white"
              onClick={() =>
                onVisibleMonthChange(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
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
                onVisibleMonthChange(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                )
              }
            >
              ›
            </button>
          </div>
        </header>

        <div className="grid shrink-0 grid-cols-7 border-b border-zinc-700/80 bg-zinc-800/40">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 bg-zinc-800/40 gap-px">
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date)
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()

            return (
              <button
                type="button"
                key={dateKey}
                aria-label={date.toLocaleDateString('es-ES')}
                aria-pressed={selectedDateKey === dateKey}
                onClick={() => onSelectDate(date)}
                style={dateKey === todayKey ? { backgroundColor: '#0C3956 ' } : undefined}
                className={`flex h-full w-full flex-col items-start justify-start outline-none border-none rounded-none! shadow-none! !bg-zinc-800 p-1 text-left transition hover:bg-zinc-800 ${
                  isCurrentMonth ? 'text-white' : 'text-zinc-400 opacity-40'
                } ${selectedDateKey === dateKey ? 'bg-blue-950/60 ring-2 ring-inset ring-blue-500' : ''}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-none text-xs ${
                    dateKey === todayKey ? ' font-bold text-white' : ''
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