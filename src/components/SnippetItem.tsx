import React from 'react'
import {useSnippetStore} from '../store/snippetStore'
import {twMerge} from 'tailwind-merge'
import {readTextFile, removeFile} from '@tauri-apps/api/fs'
import {join} from '@tauri-apps/api/path'
import {ensureSnippetsDirectory} from '../utils/snippets'
import {desktopDir} from '@tauri-apps/api/path'

interface Props{
  snippetName: string
}
function SnippetItem({snippetName}: Props) {
  const setSelectedSnippet = useSnippetStore((state) => state.setSelectedSnippet);

  const SelectedSnippet = useSnippetStore((state) => state.selectedSnippet)
  const removeSnippetName = useSnippetStore((state) => state.removeSnippetName)

  const handleDelete = async (snippetName: string) => {
    const accept = await window.confirm(`¿Estás seguro de que deseas eliminar el snippet "${snippetName}"? Esta acción no se puede deshacer.`);
    if(!accept) return;

    const desktopPath = await desktopDir()
    const filePath = await join(desktopPath, "informaciónFamilias", `${snippetName}`)
    await removeFile(filePath)
    removeSnippetName(snippetName)

  }

  return (
    <div
      //className = "bg-zinc-900 text-white p-4 rounded-md shadow-md"
      //className ={SelectedSnippet === snippetName ? "bg-blue-500" : "bg-zinc-900"}
      className = {twMerge(
        "hover:bg-neutral-700 hover:cursor-pointer flex justify-between",
        SelectedSnippet?.name === snippetName ? "bg-sky-700 shadow-lg" : ""
      )}
      onClick={async () => {
        const directory = await ensureSnippetsDirectory()
        const filePath = await join(directory, snippetName)
        const snippet = await readTextFile(filePath);
        setSelectedSnippet({ name: snippetName, code: snippet });
      }}
      >
      <h1>{snippetName}</h1>
      <div className = "px-1 py-1 flex gap-2 border-olive-800 rounded-none">
        <button
          onClick ={(e)=>{
            e.stopPropagation()
            handleDelete(snippetName)
            
          }}

          >
          Eliminar
        </button>

        <button>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default SnippetItem
