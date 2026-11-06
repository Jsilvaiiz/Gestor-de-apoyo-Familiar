import React from 'react'
import {writeFile} from '@tauri-apps/api/fs'
import {join} from '@tauri-apps/api/path'
import {useState} from 'react'
import {useSnippetStore} from '../store/snippetStore'
import {ensureSnippetsDirectory} from '../utils/snippets'

function SnippetForm() {
  const[snippetName, setSnippetName] = useState("")
  const addSnippetName = useSnippetStore((state) => state.addSnippetName)
  return (
    <>
    <form onSubmit={async (e)=>{
      e.preventDefault()

      if (snippetName.trim() === "") {
        alert("El nombre del snippet no puede estar vacío")
        return
      }
      const directory = await ensureSnippetsDirectory()
      await writeFile(await join(directory, snippetName), "{}")
      setSnippetName("")
      addSnippetName(snippetName)
    }}>
      <input type="text" placeholder="Escribe algo" className= "border border-zinc-500! rounded-none! shadow-none! bg-transparent! text-white placeholder:text-gray-500 focus:outline-none"
      onChange={(e) => setSnippetName(e.target.value)} 
      value = {snippetName}
      />
      <button className = "hidden">save</button>
    </form>
    </>
  )
}

export default SnippetForm
