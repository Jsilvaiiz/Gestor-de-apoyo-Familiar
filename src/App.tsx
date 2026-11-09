import React, { useState } from 'react';
import SnippetCalendar from './components/SnippetCalendar';
import FamiliaList from "./components/FamiliaList";
import FamiliaForm from "./components/FamiliaForm";
import Navbar from './components/Navbar';


function App() {

  const [vista, setVista] = useState<'calendario' | 'FamiliaList' | 'FamiliaForm'>('calendario');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => new Date());
  const [mesVisible, setMesVisible] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  function volverAHoy() {
    const hoy = new Date();
    setFechaSeleccionada(hoy);
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setVista('calendario');
  }

  return (
    <>
    <div className="flex h-screen flex-col bg-neutral-950 text-white text-center">
      <Navbar
        vistaActual={vista}
        onCambiarVista={(vista) =>
          setVista(vista === 'FamiliaForm' ? 'FamiliaForm' : vista)
        }
        onVolverAHoy={volverAHoy}
      />

      <main className="min-h-0 flex-1 overflow-y-auto bg-zinc-800 text-white">
        {vista === 'calendario' ? (
          <SnippetCalendar
            selectedDate={fechaSeleccionada}
            onSelectDate={setFechaSeleccionada}
            visibleMonth={mesVisible}
            onVisibleMonthChange={setMesVisible}
          />
        ) : vista === 'FamiliaList' ? (
          <FamiliaList />
        ) : (
          <FamiliaForm />
        )}
      </main>

    </div>

    </>
  );
}

export default App;
