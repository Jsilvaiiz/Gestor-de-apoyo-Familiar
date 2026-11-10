import { useEffect, useState } from "react";

import SnippetCalendar from "./components/SnippetCalendar";
import FamiliaList from "./components/FamiliaList";
import FamiliaForm from "./components/FamiliaForm";
import AdministradorEtiquetas from "./components/AdministradorEtiquetas";
import Navbar from "./components/Navbar";

import { migrarEtiquetasAntiguas } from "./utils/migrarEtiquetas";

// Vistas disponibles en la aplicación
type Vista =
  | "calendario"
  | "FamiliaList"
  | "FamiliaForm"
  | "AdministradorEtiquetas";

function App() {
  const [vista, setVista] = useState<Vista>("calendario");
  const [errorMigracion, setErrorMigracion] = useState("");

  useEffect(() => {
    void migrarEtiquetasAntiguas().catch((error) => {
      setErrorMigracion(
        "No se pudieron actualizar las etiquetas antiguas: " +
          String(error)
      );
    });
  }, []);

  // Fecha seleccionada por la usuaria
  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(() => new Date());

  // Mes que actualmente muestra el calendario
  const [mesVisible, setMesVisible] = useState(() => {
    const hoy = new Date();

    return new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );
  });

  // Regresa a la fecha y al mes actuales
  function volverAHoy() {
    const hoy = new Date();

    setFechaSeleccionada(hoy);

    setMesVisible(
      new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    );

    setVista("calendario");
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">

      {/* Barra de navegación */}
      <Navbar
        vistaActual={vista}
        fechaSeleccionada={fechaSeleccionada}
        onCambiarVista={setVista}
        onVolverAHoy={volverAHoy}
        onIrASesion={(sesion) => {
          const fecha = new Date(sesion.fecha)
          setFechaSeleccionada(fecha)
          setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
          setVista("calendario")
        }}
        onIrAEtiqueta={(fecha) => {
          setFechaSeleccionada(fecha)
          setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
          setVista("calendario")
        }}
      />

      {errorMigracion && (
        <p
          role="alert"
          className="bg-red-900/40 px-5 py-2 text-sm text-red-300"
        >
          {errorMigracion}
        </p>
      )}
      {/* Contenido principal */}
      <main className="min-h-0 flex-1 overflow-y-auto bg-zinc-800 text-white">

        {vista === "calendario" ? (
          <SnippetCalendar
            selectedDate={fechaSeleccionada}
            onSelectDate={setFechaSeleccionada}
            visibleMonth={mesVisible}
            onVisibleMonthChange={setMesVisible}
          />
        ) : vista === "FamiliaList" ? (
          <FamiliaList />
        ) : vista === "FamiliaForm" ? (
          <FamiliaForm />
        ) : vista === "AdministradorEtiquetas" ? (
          <AdministradorEtiquetas />
        ) : null}

      </main>
    </div>
  );
}

export default App;
