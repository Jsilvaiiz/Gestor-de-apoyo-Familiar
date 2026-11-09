
import { useState } from "react";

import SnippetCalendar from "./components/SnippetCalendar";
import FamiliaList from "./components/FamiliaList";
import FamiliaForm from "./components/FamiliaForm";
import Navbar from "./components/Navbar";

type Vista = "calendario" | "FamiliaList" | "FamiliaForm";

function App() {
  const [vista, setVista] = useState<Vista>("calendario");

  // Fecha seleccionada por la usuaria
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    () => new Date()
  );

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
      />

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
        ) : (
          <FamiliaForm />
        )}

      </main>
    </div>
  );
}

export default App;
