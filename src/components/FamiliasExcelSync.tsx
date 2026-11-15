import { useEffect, useState } from "react";
import { sincronizarFamiliasExcel } from "../utils/familiasExcel";

export default function FamiliasExcelSync() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cola = Promise.resolve();
    let desmontado = false;

    function sincronizar() {
      cola = cola
        .then(async () => {
          await sincronizarFamiliasExcel();
          if (!desmontado) {
            setError("");
          }
        })
        .catch((cause: unknown) => {
          if (!desmontado) {
            setError(`No se pudo actualizar familias.xlsx: ${String(cause)}`);
          }
        });
    }

    window.addEventListener("familias-actualizadas", sincronizar);
    sincronizar();

    return () => {
      desmontado = true;
      window.removeEventListener("familias-actualizadas", sincronizar);
    };
  }, []);

  if (!error) {
    return null;
  }

  return (
    <p role="alert" className="bg-red-900/40 px-5 py-2 text-sm text-red-300">
      {error}
    </p>
  );
}
