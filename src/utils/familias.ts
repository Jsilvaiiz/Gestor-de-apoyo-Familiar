
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

export interface Familia {
  id: string;
  nombre: string;
  representante: string;
  telefono: string;
  direccion: string;
  fechaInicio?: string;
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
