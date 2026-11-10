import type { Familia } from './familias'

export interface SesionProgramada {
  familia: Familia
  etapa: EtapaRutaRegular
  numeroMes: number
  fecha: Date
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
  const sesiones = new Map<string, SesionProgramada[]>()
  const agregarSesion = (
    familia: Familia,
    fecha: Date,
    etapa: EtapaRutaRegular,
    numeroMes: number
  ) => {
    const semanaKey = toDateKey(mondayOf(fecha))
    const sesionesSemana = sesiones.get(semanaKey) ?? []
    sesionesSemana.push({ familia, etapa, numeroMes, fecha: new Date(fecha) })
    sesiones.set(semanaKey, sesionesSemana)
  }

  for (const familia of familias) {
    if (familia.archivada === true || !familia.fechaInicio) continue

    const fechaInicio = parseDateKey(familia.fechaInicio)
    if (!fechaInicio) continue

    agregarSesion(familia, fechaInicio, 1, 1)

    const inicioEtapaDos = sumarMeses(fechaInicio, 1)
    for (let indiceSesion = 0; indiceSesion < SESIONES_POR_ETAPA[2]; indiceSesion += 1) {
      const fechaSesion = agregarDias(inicioEtapaDos, indiceSesion * 14)
      agregarSesion(
        familia,
        fechaSesion,
        2,
        obtenerNumeroMes(fechaInicio, fechaSesion) ?? 2
      )
    }

    const mesesEtapaTres = [4, 6, 8, 10, 13, 16, 19, 22]
    for (const numeroMes of mesesEtapaTres) {
      agregarSesion(familia, sumarMeses(fechaInicio, numeroMes - 1), 3, numeroMes)
    }

    agregarSesion(familia, sumarMeses(fechaInicio, 23), 4, 24)
  }

  return sesiones
}
