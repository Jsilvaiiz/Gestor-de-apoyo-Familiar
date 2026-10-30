import React from 'react'
import {writeFile, readTextFile} from '@tauri-apps/api/fs'
import {desktopDir} from '@tauri-apps/api/path'
import {useState} from 'react'

function SnippetForm() {
  const[snippetName, setSnippetName] = useState("")
  return (
    <>
    <form onSubmit={async (e)=>{
      e.preventDefault()

      if (snippetName.trim() === "") {
        alert("El nombre del snippet no puede estar vacío")
        return
      }
      //if snippet(){} // lo continuo despues
      const desktopPath = await desktopDir()
      console.log(desktopPath)
      //alert("Alerta")
      await writeFile(`${desktopPath}/informaciónFamilias/${snippetName}.css`, "{}")
      setSnippetName("")
      //desktopDir().
    }}>
      <input type="text" placeholder="Escribe algo" className= "bg-zinc-900 text-white placeholder:text-gray-500 border-none focus:outline-none"
      onChange={(e) => setSnippetName(e.target.value)} 
      value = {snippetName}
      />
      <button className = "hidden">save</button>
    </form>
    </>
  )
}

export default SnippetForm
