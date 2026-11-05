import React from 'react';
import SnippetEdit from './components/SnippetEditor';
import SnippetForm from './components/SnippetForm';
import SnippetList from './components/SnippetList';

function App() {
  return (
    <>
    <div className="bg-neutral-950  text-white h-screen text-center grid grid-cols-12">
      <div className ="col-span-3 bg-zinc-900 text-white ">

        <SnippetForm />
        <SnippetList />

      </div>

      <div className="col-span-9 bg-gray-900 text-white h-screen items-center justify-center text-center">
        <SnippetEdit />

      </div> 

    </div>

    </>
  );
}

export default App;
