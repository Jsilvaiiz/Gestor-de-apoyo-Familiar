import React, { useEffect } from 'react'
import {readDir} from '@tauri-apps/api/fs'
import {useSnippetStore} from '../store/snippetStore'
import SnippetItem from './SnippetItem'
import {ensureSnippetsDirectory} from '../utils/snippets'

function SnippetList() {
  const setSnippetsName = useSnippetStore((state) => state.setSnippetsName)
  //const addSnippetName = useSnippetStore((state) => state.addSnippetName)
  const snippetsName = useSnippetStore((state) => state.snippetsName)

  useEffect(() => {
    async function loadFiles() {
      const directory = await ensureSnippetsDirectory()
      const result = await readDir(directory)
      const filenames = result.map(file => file.name!)
      setSnippetsName(filenames)
    }
    loadFiles().catch((error: unknown) => {
      console.error('No se pudieron cargar los snippets.', error)
    })
  }, [])

  return (
    <div>
      {snippetsName.map(snippetName => (
        <SnippetItem key={snippetName} snippetName={snippetName} />
      ))}

    </div>
  )
}

export default SnippetList
