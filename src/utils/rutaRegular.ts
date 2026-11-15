import type { Familia } from './familias'

export interface SesionProgramada {
  familia: Familia
  etapa: EtapaRutaRegular
  numeroSesion: number
  numeroMes: number
  fecha: Date
  fechaOriginal: Date
  realizada: boolean
  esAPS: boolean
  esASL: boolean
  realizadaAPS?: boolean
  realizadaASL?: boolean
  fechaOriginalASL?: Date
  numeroMesASL?: number
}

export type EtapaRutaRegular = 1 | 2 | 3 | 4
export const SESIONES_POR_ETAPA: Record<EtapaRutaRegular, number> = {
  1: 1,
  2: 5,
  3: 8,
  4: 1,
}

export interface FamiliaEnEtapa {
  familia: Familia
  etapa: EtapaRutaRegular
  numeroMes: number
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

function sumarMeses(fecha: Date, meses: number) {
  const dia = fecha.getDate()
  const primerDiaMesDestino = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + meses,
    1
  )
  const ultimoDiaMesDestino = new Date(
    primerDiaMesDestino.getFullYear(),
    primerDiaMesDestino.getMonth() + 1,
    0
  ).getDate()
  primerDiaMesDestino.setDate(Math.min(dia, ultimoDiaMesDestino))
  return primerDiaMesDestino
}

function obtenerNumeroMes(fechaInicio: Date, fecha: Date) {
  if (fecha < fechaInicio) return null

  let mesesCompletos =
    (fecha.getFullYear() - fechaInicio.getFullYear()) * 12 +
    fecha.getMonth() -
    fechaInicio.getMonth()

  if (fecha < sumarMeses(fechaInicio, mesesCompletos)) {
    mesesCompletos -= 1
  }

  const numeroMes = mesesCompletos + 1
  return numeroMes <= 25 ? numeroMes : null
}

function etapaPorMes(numeroMes: number): EtapaRutaRegular {
  if (numeroMes === 1) return 1
  if (numeroMes <= 3) return 2
  if (numeroMes <= 23) return 3
  return 4
}

function agregarDias(fecha: Date, dias: number) {
  const resultado = new Date(fecha)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

export function calcularEtapasRutaRegular(
  familias: Familia[],
  lunesDeSemana: Date
): FamiliaEnEtapa[] {
  const domingoDeSemana = new Date(lunesDeSemana)
  domingoDeSemana.setDate(domingoDeSemana.getDate() + 6)

  return familias.flatMap((familia) => {
    if (familia.archivada === true || !familia.fechaInicio) return []

    const fechaInicio = parseDateKey(familia.fechaInicio)
    if (!fechaInicio) return []

    const numeroMes = obtenerNumeroMes(fechaInicio, domingoDeSemana)
    if (numeroMes === null) return []

    return [{ familia, etapa: etapaPorMes(numeroMes), numeroMes }]
  })
}

export function calcularSesionesRutaRegular(
  familias: Familia[]
): Map<string, SesionProgramada[]> {
  const visitas = new Map<string, SesionProgramada>()
  const agregarSesion = (
    familia: Familia,
    fechaOriginal: Date,
    etapa: EtapaRutaRegular,
    numeroSesion: number,
    numeroMes: number,
    tipo: 'APS' | 'ASL'
  ) => {
    const fechaOriginalKey = toDateKey(fechaOriginal)
    const reprogramaciones =
      tipo === 'APS'
        ? familia.sesionesReprogramadas
        : familia.sesionesASLReprogramadas
    const fechaReprogramada = reprogramaciones?.find(
      (sesion) => sesion.fechaOriginal === fechaOriginalKey
    )
    const fecha = fechaReprogramada
      ? parseDateKey(fechaReprogramada.fechaNueva) ?? fechaOriginal
      : fechaOriginal
    const clave = `${familia.id}:${toDateKey(fecha)}`
    const existente = visitas.get(clave)
    const realizada =
      tipo === 'APS'
        ? familia.sesionesRealizadas?.includes(fechaOriginalKey) ?? false
        : familia.sesionesASLRealizadas?.includes(fechaOriginalKey) ?? false

    if (existente) {
      if (tipo === 'APS') {
        existente.esAPS = true
        existente.realizadaAPS = realizada
        existente.numeroSesion = numeroSesion
        existente.numeroMes = numeroMes
        existente.etapa = etapa
        existente.fechaOriginal = new Date(fechaOriginal)
      } else {
        existente.esASL = true
        existente.realizadaASL = realizada
        existente.fechaOriginalASL = new Date(fechaOriginal)
        existente.numeroMesASL = numeroMes
      }
      existente.realizada =
        (!existente.esAPS || existente.realizadaAPS === true) &&
        (!existente.esASL || existente.realizadaASL === true)
      return
    }

    visitas.set(clave, {
      familia,
      etapa,
      numeroSesion: tipo === 'APS' ? numeroSesion : 0,
      numeroMes,
      fecha: new Date(fecha),
      fechaOriginal: new Date(fechaOriginal),
      realizada,
      esAPS: tipo === 'APS',
      esASL: tipo === 'ASL',
      realizadaAPS: tipo === 'APS' ? realizada : undefined,
      realizadaASL: tipo === 'ASL' ? realizada : undefined,
      fechaOriginalASL: tipo === 'ASL' ? new Date(fechaOriginal) : undefined,
      numeroMesASL: tipo === 'ASL' ? numeroMes : undefined,
    })
  }

  for (const familia of familias) {
    if (familia.archivada === true || !familia.fechaInicio) continue

    const fechaInicio = parseDateKey(familia.fechaInicio)
    if (!fechaInicio) continue

    agregarSesion(familia, fechaInicio, 1, 1, 1, 'APS')

    const inicioEtapaDos = sumarMeses(fechaInicio, 1)
    for (let indiceSesion = 0; indiceSesion < SESIONES_POR_ETAPA[2]; indiceSesion += 1) {
      const fechaSesion = agregarDias(inicioEtapaDos, indiceSesion * 14)
      agregarSesion(
        familia,
        fechaSesion,
        2,
        SESIONES_POR_ETAPA[1] + indiceSesion + 1,
        obtenerNumeroMes(fechaInicio, fechaSesion) ?? 2,
        'APS'
      )
    }

    const mesesEtapaTres = [4, 6, 8, 10, 13, 16, 19, 22]
    for (const [indiceSesion, numeroMes] of mesesEtapaTres.entries()) {
      agregarSesion(
        familia,
        sumarMeses(fechaInicio, numeroMes - 1),
        3,
        SESIONES_POR_ETAPA[1] + SESIONES_POR_ETAPA[2] + indiceSesion + 1,
        numeroMes,
        'APS'
      )
    }

    agregarSesion(
      familia,
      sumarMeses(fechaInicio, 23),
      4,
      SESIONES_POR_ETAPA[1] +
        SESIONES_POR_ETAPA[2] +
        SESIONES_POR_ETAPA[3] +
        1,
      24,
      'APS'
    )

    const mesesASL = [familia.primerMesASL ?? 5, 8, 13, 19, 24] as const
    for (const numeroMes of mesesASL) {
      const fechaASL = sumarMeses(fechaInicio, numeroMes - 1)
      agregarSesion(
        familia,
        fechaASL,
        etapaPorMes(numeroMes),
        0,
        numeroMes,
        'ASL'
      )
    }
  }

  const sesiones = new Map<string, SesionProgramada[]>()
  for (const visita of visitas.values()) {
    const semanaKey = toDateKey(mondayOf(visita.fecha))
    const sesionesSemana = sesiones.get(semanaKey) ?? []
    sesionesSemana.push(visita)
    sesiones.set(semanaKey, sesionesSemana)
  }

  return sesiones
}
