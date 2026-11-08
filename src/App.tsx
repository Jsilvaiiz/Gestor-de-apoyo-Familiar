import React from 'react';
import SnippetEdit from './components/SnippetEditor';
import SnippetForm from './components/SnippetForm';
import SnippetList from './components/SnippetList';
import SnippetCalendar from './components/SnippetCalendar';
import FamiliaList from "./components/FamiliaList";

import FamiliaForm from './components/FamiliaForm'; // Importa el componente FamiliaForm, by seba


function App() {
  return (
    <>
    <div className="bg-neutral-950 text-white h-screen text-center grid grid-cols-12">
      <div className ="col-span-2 bg-zinc-900 text-white  ">

        <SnippetForm />
        <SnippetList />

      </div>
      {/*
      <div className="col-span-10 bg-gray-900 text-white h-screen items-center justify-center text-center">
        <SnippetCalendar />
        
      </div>
      */}
      <div className="col-span-10 bg-gray-900 text-white h-screen overflow-y-auto">
        <FamiliaForm />
        <FamiliaList />
      </div> 

    </div>

    </>
  );
}

export default App;
