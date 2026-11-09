
import {
  createDir,
  exists,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/api/fs";

import { desktopDir, join } from "@tauri-apps/api/path";

export interface Etiqueta {
  id: string;
  nombre: string;
  color: string;
  activa: boolean;
}

// Carpeta utilizada por el proyecto
const CARPETA = "informaciónFamilias";
const ARCHIVO = "etiquetas.json";

// Obtener la ubicación del archivo
async function obtenerRuta() {
  const carpeta = await join(await desktopDir(), CARPETA);

  await createDir(carpeta, { recursive: true });

  return join(carpeta, ARCHIVO);
}

// Leer las etiquetas guardadas
export async function leerEtiquetas(): Promise<Etiqueta[]> {
  const ruta = await obtenerRuta();

  if (!(await exists(ruta))) {
    return [];
  }

  const contenido = await readTextFile(ruta);
  const datos: unknown = JSON.parse(contenido);

  if (!Array.isArray(datos)) {
    throw new Error("El archivo de etiquetas no es válido");
  }

  return datos as Etiqueta[];
}

// Guardar el catálogo completo
export async function guardarEtiquetas(
  etiquetas: Etiqueta[]
): Promise<void> {
  const ruta = await obtenerRuta();

  await writeTextFile(
    ruta,
    JSON.stringify(etiquetas, null, 2)
  );
}

// Crear una etiqueta nueva
export async function crearEtiqueta(
  nombre: string,
  color: string
): Promise<void> {
  const etiquetas = await leerEtiquetas();
  const nombreLimpio = nombre.trim();

  if (!nombreLimpio) {
    throw new Error("La etiqueta necesita un nombre");
  }

  const duplicada = etiquetas.some(
    (e) =>
      e.nombre.toLowerCase() === nombreLimpio.toLowerCase()
  );

  if (duplicada) {
    throw new Error("Ya existe una etiqueta con ese nombre");
  }

  etiquetas.push({
    id: crypto.randomUUID(),
    nombre: nombreLimpio,
    color,
    activa: true,
  });

  await guardarEtiquetas(etiquetas);
}
