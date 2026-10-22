import React from 'react';
import snippetEdit from './components/SnippetEdit';
import snippetForm from './components/SnippetForm';
import snippetItem from './components/SnippetItem';
import snippetList from './components/SnippetList';

function App() {
  return (
    <div className="App" style={{ color: 'blue' }} >
        <snippetEdit />
        <snippetForm />
        <snippetItem />
        <snippetList />
        
        <h1>Hola mundo!</h1>
        <h2>Cómo Están?</h2>
    </div>
  );
}

export default App;
