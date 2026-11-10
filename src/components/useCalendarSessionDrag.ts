import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  calcularSesionesRutaRegular,
  type EtapaRutaRegular,
  type SesionProgramada,
} from '../utils/rutaRegular'
import {
  reprogramarSesionFamilia,
  type Familia,
} from '../utils/familias'

interface SesionArrastrada {
  familiaId: string
  etapa: EtapaRutaRegular
  fechaOriginal: string
}

interface ArrastrePuntero {
  pointerId: number
  sesion: SesionArrastrada
  xInicial: number
  yInicial: number
  iniciado: boolean
  fechaDestino: string | null
}

export interface TarjetaArrastrada {
  nombre: string
  etapa: EtapaRutaRegular
  x: number
  y: number
}

interface UseCalendarSessionDragOptions {
  familias: Familia[]
  onFamiliaActualizada: (familia: Familia) => void
  onError: (mensaje: string) => void
  onMoveComplete: () => void
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useCalendarSessionDrag({
  familias,
  onFamiliaActualizada,
  onError,
  onMoveComplete,
}: UseCalendarSessionDragOptions) {
  const [fechaDestinoArrastre, setFechaDestinoArrastre] = useState<string | null>(null)
  const [tarjetaArrastrada, setTarjetaArrastrada] = useState<TarjetaArrastrada | null>(null)
  const arrastrePunteroRef = useRef<ArrastrePuntero | null>(null)
  const ignorarSiguienteClickRef = useRef(false)
  const familiasRef = useRef(familias)
  const callbacksRef = useRef({ onFamiliaActualizada, onError, onMoveComplete })

  familiasRef.current = familias
  callbacksRef.current = { onFamiliaActualizada, onError, onMoveComplete }

  useEffect(() => {
    function obtenerFechaBajoPuntero(event: PointerEvent) {
      return document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-calendar-date]')
        ?.dataset.calendarDate ?? null
    }

    function moverPuntero(event: PointerEvent) {
      const arrastre = arrastrePunteroRef.current
      if (!arrastre || event.pointerId !== arrastre.pointerId) return

      if (
        !arrastre.iniciado &&
        Math.hypot(event.clientX - arrastre.xInicial, event.clientY - arrastre.yInicial) < 10
      ) {
        return
      }

      arrastre.iniciado = true
      arrastre.fechaDestino = obtenerFechaBajoPuntero(event)
      setFechaDestinoArrastre(arrastre.fechaDestino)
      setTarjetaArrastrada((tarjeta) =>
        tarjeta ? { ...tarjeta, x: event.clientX, y: event.clientY } : tarjeta
      )
      event.preventDefault()
    }

    function terminarArrastre(event: PointerEvent) {
      const arrastre = arrastrePunteroRef.current
      if (!arrastre || event.pointerId !== arrastre.pointerId) return

      arrastrePunteroRef.current = null
      setFechaDestinoArrastre(null)
      setTarjetaArrastrada(null)
      if (!arrastre.iniciado) return
      ignorarSiguienteClickRef.current = true

      const fechaDestino = obtenerFechaBajoPuntero(event) ?? arrastre.fechaDestino
      if (!fechaDestino) {
        callbacksRef.current.onError('Suelta la sesión sobre un día del calendario.')
        return
      }

      void (async () => {
        try {
          const sesionesActuales = calcularSesionesRutaRegular(familiasRef.current)
          const sesionExiste = [...sesionesActuales.values()].flat().some(
            (sesion) =>
              sesion.familia.id === arrastre.sesion.familiaId &&
              sesion.etapa === arrastre.sesion.etapa &&
              toDateKey(sesion.fechaOriginal) === arrastre.sesion.fechaOriginal
          )
          if (!sesionExiste) {
            throw new Error('La sesión ya no está disponible')
          }

          const familiaActualizada = await reprogramarSesionFamilia(
            arrastre.sesion.familiaId,
            arrastre.sesion.fechaOriginal,
            fechaDestino
          )
          callbacksRef.current.onFamiliaActualizada(familiaActualizada)
          callbacksRef.current.onMoveComplete()
        } catch (error) {
          callbacksRef.current.onError(`No se pudo mover la sesión: ${String(error)}`)
        }
      })()
    }

    function cancelarArrastre(event: PointerEvent) {
      const arrastre = arrastrePunteroRef.current
      if (!arrastre || event.pointerId !== arrastre.pointerId) return
      arrastrePunteroRef.current = null
      setFechaDestinoArrastre(null)
      setTarjetaArrastrada(null)
    }

    window.addEventListener('pointermove', moverPuntero, { passive: false })
    window.addEventListener('pointerup', terminarArrastre)
    window.addEventListener('pointercancel', cancelarArrastre)
    return () => {
      window.removeEventListener('pointermove', moverPuntero)
      window.removeEventListener('pointerup', terminarArrastre)
      window.removeEventListener('pointercancel', cancelarArrastre)
    }
  }, [])

  function iniciarArrastre(
    sesion: SesionProgramada,
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    if (event.button !== 0) return
    event.stopPropagation()
    arrastrePunteroRef.current = {
      pointerId: event.pointerId,
      sesion: {
        familiaId: sesion.familia.id,
        etapa: sesion.etapa,
        fechaOriginal: toDateKey(sesion.fechaOriginal),
      },
      xInicial: event.clientX,
      yInicial: event.clientY,
      iniciado: false,
      fechaDestino: null,
    }
    setTarjetaArrastrada({
      nombre: sesion.familia.nombre,
      etapa: sesion.etapa,
      x: event.clientX,
      y: event.clientY,
    })
  }

  function debeIgnorarClick() {
    const ignorar = ignorarSiguienteClickRef.current
    ignorarSiguienteClickRef.current = false
    return ignorar
  }

  return {
    fechaDestinoArrastre,
    tarjetaArrastrada,
    iniciarArrastre,
    debeIgnorarClick,
  }
}
