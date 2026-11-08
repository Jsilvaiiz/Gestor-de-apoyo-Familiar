
import { useEffect, useState } from "react";
import {
  leerFamilias,
  editarFamilia,
  cambiarEstadoFamilia,
  type Familia,
} from "../utils/familias";

export default function FamiliaList() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Familia | null>(null);
  const [mensajeEdicion, setMensajeEdicion] = useState("");
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [notificacion, setNotificacion] = useState("");

  async function cargarFamilias() {
    try {
      const datos = await leerFamilias();
      setFamilias(datos);
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
  cargarFamilias();

  const actualizar = () => {
    cargarFamilias();
  };

  window.addEventListener("familias-actualizadas", actualizar);

  return () => {
    window.removeEventListener("familias-actualizadas", actualizar);
  };
}, []);

  const filtradas = familias.filter((familia) => {
    const coincideBusqueda =
        `${familia.nombre} ${familia.representante}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const coincideEstado = mostrarArchivadas
        ? familia.archivada === true
        : familia.archivada !== true;

    return coincideBusqueda && coincideEstado;
    });


async function guardarEdicion() {
  if (!editando) return;

  try {
    await editarFamilia(editando);
    setEditando(null);
    setMensajeEdicion("");
    await cargarFamilias();
  } catch (error) {
    setMensajeEdicion(String(error));
  }
}


async function cambiarEstado(id: string, archivar: boolean) {
  try {
    await cambiarEstadoFamilia(id, archivar);

    await cargarFamilias();

    setEditando(null);
    setMensajeEdicion("");

    setNotificacion(
      archivar
        ? "Familia archivada correctamente"
        : "Familia restaurada correctamente"
    );
  } catch (error) {
    setNotificacion(
      "No se pudo cambiar el estado: " + String(error)
    );
  }
}


  return (
    <section className="p-6 text-white text-left">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Familias registradas</h2>
        {notificacion && (
        <div
            role="status"
            className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-gray-200"
        >
            {notificacion}
        </div>
        )}

      </div>

        {/* Botón para alternar entre familias activas y archivadas */}
        <button
        type="button"
        onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
        className="mb-4 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded"
        >
        {mostrarArchivadas
            ? "Ver familias activas"
            : "Ver familias archivadas"}
        </button>

        

      <input
        type="text"
        placeholder="Buscar familia o representante..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full p-3 mb-4 bg-zinc-800 rounded"
      />

      {error && <p className="text-red-400">{error}</p>}

      {filtradas.length === 0 ? (
        <p className="text-gray-400">
          No hay familias para mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {filtradas.map((familia) => (
            <article
              key={familia.id}
              className="bg-zinc-800 p-4 rounded-lg"
            >
              <h3 className="font-semibold">{familia.nombre}</h3>
              <p>Representante: {familia.representante}</p>
              <p>Teléfono: {familia.telefono || "Sin registrar"}</p>
              <p>Dirección: {familia.direccion || "Sin registrar"}</p>
              <p>Fecha de ingreso: {familia.fechaInicio? familia.fechaInicio.split("-").reverse().join("/"): "Sin registrar"}</p>


            {editando?.id === familia.id ? (
            <div className="mt-4 space-y-2">
                {(
                [
                    ["nombre", "Nombre"],
                    ["representante", "Representante"],
                    ["telefono", "Teléfono"],
                    ["direccion", "Dirección"],
                ] as const
                ).map(([campo, etiqueta]) => (
                <label key={campo} className="block text-sm">
                    {etiqueta}
                    <input
                    className="block w-full bg-zinc-900 p-2 rounded mt-1"
                    value={editando[campo]}
                    onChange={(e) =>
                        setEditando({
                        ...editando,
                        [campo]: e.target.value,
                        })
                    }
                    />
                </label>
                ))}

                
                {/* Campo para editar la fecha de ingreso */}
                <label className="block text-sm">
                Fecha de ingreso
                <input
                    type="date"
                    value={editando.fechaInicio ?? ""}
                    onChange={(e) =>
                    setEditando({
                        ...editando,
                        fechaInicio: e.target.value,
                    })
                    }
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    style={{ colorScheme: "dark" }}
                    className="block w-full bg-zinc-900 p-2 rounded mt-1"
                />
                </label>

                {/* Mensaje de error de edición */}
                {mensajeEdicion && (
                <p className="text-red-400">{mensajeEdicion}</p>
                )}


                <div className="flex gap-2">
                <button
                    type="button"
                    onClick={guardarEdicion}
                    className="bg-blue-600 px-3 py-2 rounded"
                >
                    Guardar cambios
                </button>

                <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="bg-zinc-700 px-3 py-2 rounded"
                >
                    Cancelar
                </button>
                </div>
            </div>
            ) : (
            <button
                type="button"
                onClick={() => {
                setEditando({ ...familia });
                setMensajeEdicion("");
                }}
                className="mt-3 bg-zinc-700 px-3 py-2 rounded"
            >
                Editar
            </button>
            )}
            <button
                type="button"
                onClick={() =>
                    cambiarEstado(familia.id, !familia.archivada)
                }
                className={`mt-3 ml-2 px-3 py-2 rounded ${
                    familia.archivada
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-amber-700 hover:bg-amber-600"
                }`}
                >
                {familia.archivada ? "Restaurar" : "Archivar"}
            </button>

            </article>

    
          ))}
        </div>
      )}
    </section>
  );
}
