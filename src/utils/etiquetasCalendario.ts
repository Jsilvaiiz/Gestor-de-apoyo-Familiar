import {
  createDir,
  exists,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/api/fs'
import { desktopDir, join } from '@tauri-apps/api/path'

export interface EtiquetaCalendario {
  id: string
  fecha: string
  etiqueta: string
  comentario: string
  familiaId?: string
}

const CARPETA = 'informaciónFamilias'
const ARCHIVO = 'etiquetas-calendario.json'

function esEtiquetaCalendario(valor: unknown): valor is EtiquetaCalendario {
  if (typeof valor !== 'object' || valor === null) return false

  const etiqueta = valor as Record<string, unknown>
  return (
    typeof etiqueta.id === 'string' &&
    typeof etiqueta.fecha === 'string' &&
    typeof etiqueta.etiqueta === 'string' &&
    typeof etiqueta.comentario === 'string' &&
    (etiqueta.familiaId === undefined ||
      typeof etiqueta.familiaId === 'string')
  )
}

async function obtenerRuta() {
  const carpeta = await join(await desktopDir(), CARPETA)
  await createDir(carpeta, { recursive: true })
  return join(carpeta, ARCHIVO)
}

export async function leerEtiquetasCalendario(): Promise<EtiquetaCalendario[]> {
  const ruta = await obtenerRuta()
  if (!(await exists(ruta))) return []

  const contenido: unknown = JSON.parse(await readTextFile(ruta))
  if (
    !Array.isArray(contenido) ||
    !contenido.every(esEtiquetaCalendario)
  ) {
    throw new Error('El archivo de etiquetas del calendario no es válido')
  }

  return contenido as EtiquetaCalendario[]
}

export async function guardarEtiquetaCalendario(
  etiqueta: Omit<EtiquetaCalendario, 'id'> & { id?: string }
): Promise<EtiquetaCalendario[]> {
  const etiquetaLimpia = etiqueta.etiqueta.trim()
  const comentarioLimpio = etiqueta.comentario.trim()
  if (!etiquetaLimpia || !comentarioLimpio) {
    throw new Error('La etiqueta y el comentario son obligatorios')
  }

  const etiquetas = await leerEtiquetasCalendario()
  const etiquetaGuardada: EtiquetaCalendario = {
    ...etiqueta,
    id: etiqueta.id ?? crypto.randomUUID(),
    etiqueta: etiquetaLimpia,
    comentario: comentarioLimpio,
  }

  const indice = etiquetas.findIndex((actual) => actual.id === etiquetaGuardada.id)
  if (indice === -1) etiquetas.push(etiquetaGuardada)
  else etiquetas[indice] = etiquetaGuardada

  await writeTextFile(await obtenerRuta(), JSON.stringify(etiquetas, null, 2))
  return etiquetas
}

export async function eliminarEtiquetaCalendario(
  id: string
): Promise<EtiquetaCalendario[]> {
  const etiquetas = await leerEtiquetasCalendario()
  const restantes = etiquetas.filter((etiqueta) => etiqueta.id !== id)
  if (restantes.length === etiquetas.length) {
    throw new Error('No se encontró la etiqueta del calendario')
  }

  await writeTextFile(await obtenerRuta(), JSON.stringify(restantes, null, 2))
  return restantes
}

export async function moverEtiquetaCalendario(
  id: string,
  fecha: string
): Promise<EtiquetaCalendario[]> {
  const etiquetas = await leerEtiquetasCalendario()
  const etiqueta = etiquetas.find((actual) => actual.id === id)
  if (!etiqueta) throw new Error('No se encontró la etiqueta del calendario')

  etiqueta.fecha = fecha
  await writeTextFile(await obtenerRuta(), JSON.stringify(etiquetas, null, 2))
  return etiquetas
}
