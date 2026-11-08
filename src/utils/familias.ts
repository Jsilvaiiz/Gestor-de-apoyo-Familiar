
import {
  readTextFile,
  writeTextFile,
  createDir,
  exists,
  BaseDirectory,
} from "@tauri-apps/api/fs";

export interface Familia {
  id: string;
  nombre: string;
  representante: string;
  telefono: string;
  direccion: string;
  fechaInicio?: string;
  archivada?: boolean;
}

const CARPETA = "familias";
const ARCHIVO = "familias/familias.json";


export async function leerFamilias(): Promise<Familia[]> {
  const existe = await exists(ARCHIVO, {
    dir: BaseDirectory.AppData,
  });

  if (!existe) {
    return [];
  }

  const contenido = await readTextFile(ARCHIVO, {
    dir: BaseDirectory.AppData,
  });

  const familias = JSON.parse(contenido);

  if (!Array.isArray(familias)) {
    throw new Error("El archivo de familias no es válido");
  }

  return familias as Familia[];
}


export async function guardarFamilia(
  familia: Familia
): Promise<void> {
  await createDir(CARPETA, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });

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

  await writeTextFile(
    ARCHIVO,
    JSON.stringify(familias, null, 2),
    { dir: BaseDirectory.AppData }
  );
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

  await writeTextFile(
    ARCHIVO,
    JSON.stringify(familias, null, 2),
    { dir: BaseDirectory.AppData }
  );
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

  await writeTextFile(
    ARCHIVO,
    JSON.stringify(familias, null, 2),
    { dir: BaseDirectory.AppData }
  );
}

