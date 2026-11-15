import { desktopDir, join } from "@tauri-apps/api/path";

export const CARPETA_FAMILIAS = "informaciónFamilias";

export async function obtenerDirectorioFamilias(): Promise<string> {
  return join(await desktopDir(), CARPETA_FAMILIAS);
}

export async function obtenerArchivoFamilias(): Promise<string> {
  return join(await obtenerDirectorioFamilias(), "familias.json");
}
