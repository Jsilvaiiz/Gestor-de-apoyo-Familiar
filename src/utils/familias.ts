
import {
  readTextFile,
  writeTextFile,
  createDir,
  exists,
} from "@tauri-apps/api/fs";
import { desktopDir, join } from "@tauri-apps/api/path";

export interface Observacion {
  id: string;
  texto: string;
  fechaCreacion: string;
}

export interface SesionReprogramada {
  fechaOriginal: string;
  fechaNueva: string;
}

export interface Familia {
  id: string;
  nombre: string;
  representante: string;
  telefono: string;
  direccion: string;
  fechaInicio?: string;
  sesionesReprogramadas?: SesionReprogramada[];
  archivada?: boolean;
  etiquetas?: string[];
  observaciones?: Observacion[];
}

const CARPETA = "informaciónFamilias";

async function obtenerArchivoFamilias(): Promise<string> {
  return join(await desktopDir(), CARPETA, "familias.json");
}

async function escribirFamilias(familias: Familia[]): Promise<void> {
  const directorio = await join(await desktopDir(), CARPETA);
  await createDir(directorio, { recursive: true });
  await writeTextFile(
    await join(directorio, "familias.json"),
    JSON.stringify(familias, null, 2)
  );
}

function esFechaValida(fecha: string): boolean {
  const partes = fecha.split("-").map(Number);
  if (partes.length !== 3 || partes.some((parte) => !Number.isInteger(parte))) {
    return false;
  }

  const [year, month, day] = partes;
  const valor = new Date(year, month - 1, day);
  return (
    valor.getFullYear() === year &&
    valor.getMonth() === month - 1 &&
    valor.getDate() === day
  );
}


export async function leerFamilias(): Promise<Familia[]> {
  const archivo = await obtenerArchivoFamilias();
  const existe = await exists(archivo);

  if (!existe) {
    return [];
  }

  const contenido = await readTextFile(archivo);

  const familias = JSON.parse(contenido);

  if (!Array.isArray(familias)) {
    throw new Error("El archivo de familias no es válido");
  }

  return familias as Familia[];
}


export async function guardarFamilia(
  familia: Familia
): Promise<void> {
  const familias = await leerFamilias();

  const duplicada = familias.some(
    (f) =>
      f.nombre.trim().toLowerCase() ===
      familia.nombre.trim().toLowerCase()
  );

  if (duplicada) {
    throw new Error("Esta familia ya está registrada");
  }

  familias.push(familia);

  await escribirFamilias(familias);
}


export async function editarFamilia(
  familiaActualizada: Familia
): Promise<void> {
  const familias = await leerFamilias();

  const indice = familias.findIndex(
    (f) => f.id === familiaActualizada.id
  );

  if (indice === -1) {
    throw new Error("No se encontró la familia");
  }

  const duplicada = familias.some(
    (f) =>
      f.id !== familiaActualizada.id &&
      f.nombre.trim().toLowerCase() ===
        familiaActualizada.nombre.trim().toLowerCase()
  );

  if (duplicada) {
    throw new Error("Ya existe otra familia con ese nombre");
  }

  familias[indice] = familiaActualizada;

  await escribirFamilias(familias);
}


export async function cambiarEstadoFamilia(
  id: string,
  archivar: boolean
): Promise<void> {
  const familias = await leerFamilias();

  const familia = familias.find((f) => f.id === id);

  if (!familia) {
    throw new Error("No se encontró la familia");
  }

  familia.archivada = archivar;

  await escribirFamilias(familias);
}

export async function reprogramarSesionFamilia(
  id: string,
  fechaOriginal: string,
  fechaNueva: string
): Promise<Familia> {
  if (!esFechaValida(fechaOriginal) || !esFechaValida(fechaNueva)) {
    throw new Error("La fecha de la sesión no es válida");
  }

  const familias = await leerFamilias();
  const indice = familias.findIndex((familia) => familia.id === id);

  if (indice === -1) {
    throw new Error("No se encontró la familia");
  }

  const familia = familias[indice];
  const sesionesReprogramadas = (familia.sesionesReprogramadas ?? []).filter(
    (sesion) => sesion.fechaOriginal !== fechaOriginal
  );

  if (fechaOriginal !== fechaNueva) {
    sesionesReprogramadas.push({ fechaOriginal, fechaNueva });
  }

  const familiaActualizada = { ...familia, sesionesReprogramadas };
  familias[indice] = familiaActualizada;
  await escribirFamilias(familias);

  return familiaActualizada;
}
