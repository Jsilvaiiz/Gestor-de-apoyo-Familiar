
import {
  readTextFile,
  writeTextFile,
  createDir,
  exists,
} from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { obtenerArchivoFamilias, obtenerDirectorioFamilias } from "./rutasFamilias";

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
  sesionesRealizadas?: string[];
  archivada?: boolean;
  etiquetas?: string[];
  observaciones?: Observacion[];
}

async function escribirFamilias(familias: Familia[]): Promise<void> {
  const directorio = await obtenerDirectorioFamilias();
  await createDir(directorio, { recursive: true });
  const contenido = await invoke<string>("cifrar_datos", {
    contenido: JSON.stringify(familias, null, 2),
  });
  await writeTextFile(await obtenerArchivoFamilias(), contenido);
  window.dispatchEvent(new Event("familias-actualizadas"));
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
  const descifrado = await invoke<{ contenido: string; cifrado: boolean }>(
    "descifrar_datos",
    { contenido }
  );
  const familias = JSON.parse(descifrado.contenido);

  if (!Array.isArray(familias)) {
    throw new Error("El archivo de familias no es válido");
  }

  if (!descifrado.cifrado) {
    await escribirFamilias(familias as Familia[]);
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

export async function editarObservacionFamilia(
  familiaId: string,
  observacionId: string,
  texto: string
): Promise<Familia> {
  const textoActualizado = texto.trim();
  if (!textoActualizado) {
    throw new Error("El comentario no puede quedar vacío");
  }
  if (textoActualizado.length > 2000) {
    throw new Error("El comentario no puede superar los 2000 caracteres");
  }

  const familias = await leerFamilias();
  const indiceFamilia = familias.findIndex((familia) => familia.id === familiaId);
  if (indiceFamilia === -1) {
    throw new Error("La familia ya no existe");
  }

  const familia = familias[indiceFamilia];
  const observaciones = familia.observaciones ?? [];
  const indiceObservacion = observaciones.findIndex(
    (observacion) => observacion.id === observacionId
  );
  if (indiceObservacion === -1) {
    throw new Error("El comentario ya no existe");
  }

  const observacionesActualizadas = [...observaciones];
  observacionesActualizadas[indiceObservacion] = {
    ...observacionesActualizadas[indiceObservacion],
    texto: textoActualizado,
  };
  const familiaActualizada = {
    ...familia,
    observaciones: observacionesActualizadas,
  };
  familias[indiceFamilia] = familiaActualizada;
  await escribirFamilias(familias);

  return familiaActualizada;
}

export async function actualizarEstadoSesionFamilia(
  familiaId: string,
  fechaOriginal: string,
  realizada: boolean
): Promise<Familia> {
  if (!esFechaValida(fechaOriginal)) {
    throw new Error("La fecha original de la sesión no es válida");
  }

  const familias = await leerFamilias();
  const indiceFamilia = familias.findIndex((familia) => familia.id === familiaId);
  if (indiceFamilia === -1) {
    throw new Error("No se encontró la familia");
  }

  const familia = familias[indiceFamilia];
  const sesionesRealizadas = new Set(familia.sesionesRealizadas ?? []);
  if (realizada) {
    sesionesRealizadas.add(fechaOriginal);
  } else {
    sesionesRealizadas.delete(fechaOriginal);
  }

  const familiaActualizada = {
    ...familia,
    sesionesRealizadas: [...sesionesRealizadas],
  };
  familias[indiceFamilia] = familiaActualizada;
  await escribirFamilias(familias);
  return familiaActualizada;
}
