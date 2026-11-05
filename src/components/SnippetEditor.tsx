import React, { useEffect, useState } from 'react'
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {useSnippetStore} from '../store/snippetStore'
import {writeTextFile} from '@tauri-apps/api/fs'
import {join} from '@tauri-apps/api/path'
import {ensureSnippetsDirectory} from '../utils/snippets'
import {desktopDir} from '@tauri-apps/api/path'
loader.config({ monaco });

function SnippetEditor() {
 const selectedSnippet = useSnippetStore((state) => state.selectedSnippet)
 const [text,setText] = useState<string|undefined>("")

  useEffect(() => {

    if (!selectedSnippet) return;
      const saveText = setTimeout(async () => {
        console.log("Saving text to file:", text)
        const desktopPath = await desktopDir()
        await writeTextFile(
          `${desktopPath}/informaciónFamilias/${selectedSnippet.name}`
          , text || ""

        );
      }, 1000)

      return () => {clearTimeout(saveText)
      }
  }, [selectedSnippet, text])

  return (
  <>
    {selectedSnippet ? (
      <Editor
      theme = "vs-dark"
      defaultLanguage="javascript"
      options = {{
        fontSize: 20,
      }}
      onChange={(value) => setText(value)}
      value = {selectedSnippet.code == null ? "" : String(selectedSnippet.code)}
    />
  ) : (
      <h1>No snippet selected</h1>
    )}
  </>
  );
}

export default SnippetEditor