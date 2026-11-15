import { createDir, exists, readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";
import { leerFamilias } from "./familias";
import { obtenerDirectorioFamilias } from "./rutasFamilias";

const NOMBRE_ARCHIVO = "familias.xlsx";
const NOMBRE_HOJA = "Familias";

export async function sincronizarFamiliasExcel(): Promise<void> {
  const directorio = await obtenerDirectorioFamilias();
  await createDir(directorio, { recursive: true });

  const rutaExcel = await join(directorio, NOMBRE_ARCHIVO);
  const familias = await leerFamilias();
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();

  if (await exists(rutaExcel)) {
    const contenido = await readBinaryFile(rutaExcel);
    await libro.xlsx.load(Uint8Array.from(contenido).buffer);
  }

  const hoja = libro.getWorksheet(NOMBRE_HOJA) ?? libro.addWorksheet(NOMBRE_HOJA);
  hoja.spliceRows(1, hoja.rowCount);
  hoja.addRow([
    "ID",
    "Nombre",
    "Representante",
    "Teléfono",
    "Dirección",
    "Fecha de ingreso",
    "Archivada",
    "Etiquetas",
    "Sesiones reprogramadas",
    "Sesiones realizadas",
    "Observaciones",
  ]);

  for (const familia of familias) {
    hoja.addRow([
      familia.id,
      familia.nombre,
      familia.representante,
      familia.telefono,
      familia.direccion,
      familia.fechaInicio ?? "",
      familia.archivada ? "Sí" : "No",
      (familia.etiquetas ?? []).join(", "),
      JSON.stringify(familia.sesionesReprogramadas ?? []),
      (familia.sesionesRealizadas ?? []).join(", "),
      JSON.stringify(familia.observaciones ?? []),
    ]);
  }

  const contenido = await libro.xlsx.writeBuffer();
  await writeBinaryFile(rutaExcel, Array.from(new Uint8Array(contenido)));
}
