import React from 'react'
import {useSnippetStore} from '../store/snippetStore'
import {twMerge} from 'tailwind-merge'
import {readTextFile, removeFile} from '@tauri-apps/api/fs'
import {join} from '@tauri-apps/api/path'
import {ensureSnippetsDirectory} from '../utils/snippets'
import {desktopDir} from '@tauri-apps/api/path'
import { Trash2, X } from 'lucide-react'

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
        "hover:bg-neutral-800 hover:cursor-pointer flex justify-between",
        SelectedSnippet?.name === snippetName ? "bg-zinc-800 shadow-none" : ""
      )}
      onClick={async () => {
        const directory = await ensureSnippetsDirectory()
        const filePath = await join(directory, snippetName)
        const snippet = await readTextFile(filePath);
        setSelectedSnippet({ name: snippetName, code: snippet });
      }}
      >
      <h1>{snippetName}</h1>
      <div className = " px-1 py-1 flex gap-0 shadow-none! rounded-none! hover:border-none!">
        <button
        type="button"
        aria-label="Eliminar snippet"
        title="Eliminar"
        style={{ outline: 'none', boxShadow: 'none' }}
        className="rounded-none bg-transparent! shadow-none! focus:outline-none! outline-none! focus:ring-0! p-1.5 text-gray-400 transition hover:bg-neutral-900! "
          onClick ={(e)=>{
            e.stopPropagation()
            handleDelete(snippetName)
            
          }}

          >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Cerrar snippet"
          title="Cerrar"

          className="!outline-none focus:!outline-none focus-visible:!outline-none rounded-none foucs:!ring-0 bg-transparent! shadow-none! p-1.5 text-gray-400 transition hover:bg-neutral-900! "
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSnippet(null);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default SnippetItem
