
import { useState } from "react";
import { guardarFamilia } from "../utils/familias";

export default function FamiliaForm() {
  const [nombre, setNombre] = useState("");
  const [representante, setRepresentante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [primerMesASL, setPrimerMesASL] = useState<4 | 5 | 6>(5);

  
    const registrarFamilia = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        await guardarFamilia({
        id: crypto.randomUUID(),
        nombre,
        representante,
        telefono,
        direccion,
        fechaInicio,
        primerMesASL,
        });

        setMensaje("Familia registrada correctamente");
        setEsError(false);

        setNombre("");
        setRepresentante("");
        setTelefono("");
        setDireccion("");
        setFechaInicio("");
        setPrimerMesASL(5);
    } catch (error) {
        const mensaje =
        error instanceof Error ? error.message : String(error);

        setMensaje("No se pudo guardar: " + mensaje);
        setEsError(true);
    }
    };


  return (
    <div className="p-6 bg-zinc-900 text-white">
      <h2 className="text-2xl font-bold mb-6">
        Registrar familia
      </h2>

      <form onSubmit={registrarFamilia} className="flex flex-col gap-4">
        <input
          className="p-2 bg-zinc-800 rounded"
          placeholder="Nombre de la familia"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          className="p-2 bg-zinc-800 rounded"
          placeholder="Representante familiar"
          value={representante}
          onChange={(e) => setRepresentante(e.target.value)}
          required
        />

        <input
          className="p-2 bg-zinc-800 rounded"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <input
          className="p-2 bg-zinc-800 rounded"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />

        <label className="text-left text-sm text-gray-300">
        Fecha de ingreso
        <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            style={{ colorScheme: "dark" }}
            className="block w-full mt-2 p-3 bg-zinc-800 text-white rounded cursor-pointer"
            required
        />
        </label>

        <label className="text-left text-sm text-gray-300">
          Primer mes de visita ASL
          <select
            value={primerMesASL}
            onChange={(e) => {
              const valor = e.target.value;
              setPrimerMesASL(valor === "4" ? 4 : valor === "6" ? 6 : 5);
            }}
            className="mt-2 block w-full rounded bg-zinc-800 p-2"
          >
            <option value={4}>Mes 4</option>
            <option value={5}>Mes 5 (predeterminado)</option>
            <option value={6}>Mes 6</option>
          </select>
        </label>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded"
        >
          Registrar familia
        </button>

        {mensaje && (
        <p
            role="status"
            className={`mt-3 rounded-lg p-3 text-sm ${
            esError
                ? "bg-red-900/30 text-red-300"
                : "bg-green-900/30 text-green-300"
            }`}
        >
            {mensaje}
        </p>
        )}
      </form>
    </div>
  );
}
