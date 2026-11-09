
import {
  leerFamilias,
  editarFamilia,
} from "./familias";

import { leerEtiquetas } from "./etiquetas";

// Evita ejecutar dos migraciones simultáneamente.
let migracionEnCurso: Promise<void> | null = null;

function realizarMigracion(): Promise<void> {
  return (async () => {
    const etiquetas = await leerEtiquetas();
    const familias = await leerFamilias();

    // Buscar etiquetas por su ID o nombre.
    const porId = new Set(
      etiquetas.map((etiqueta) => etiqueta.id)
    );

    const porNombre = new Map(
      etiquetas.map((etiqueta) => [
        etiqueta.nombre.trim().toLowerCase(),
        etiqueta.id,
      ])
    );

    for (const familia of familias) {
      const anteriores = familia.etiquetas ?? [];

      if (anteriores.length === 0) continue;

      // Convertir nombres reconocidos a IDs.
      const nuevas = Array.from(
        new Set(
          anteriores.map((valor) => {
            if (porId.has(valor)) return valor;

            const id = porNombre.get(
              valor.trim().toLowerCase()
            );

            // Si no encontramos coincidencia,
            // conservamos el valor original.
            return id ?? valor;
          })
        )
      );

      // Evitar guardar si no hubo cambios.
      const cambio =
        anteriores.length !== nuevas.length ||
        anteriores.some(
          (valor, indice) => valor !== nuevas[indice]
        );

      if (!cambio) continue;

      await editarFamilia({
        ...familia,
        etiquetas: nuevas,
      });
    }
  })();
}

export function migrarEtiquetasAntiguas(): Promise<void> {
  if (!migracionEnCurso) {
    migracionEnCurso = realizarMigracion().catch((error) => {
      // Permite reintentar si hubo un error.
      migracionEnCurso = null;
      throw error;
    });
  }

  return migracionEnCurso;
}
