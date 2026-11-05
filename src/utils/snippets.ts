import { createDir } from '@tauri-apps/api/fs'
import { desktopDir, join } from '@tauri-apps/api/path'

const SNIPPETS_DIRECTORY = 'informaciónFamilias'

export async function ensureSnippetsDirectory() {
  const path = await join(await desktopDir(), SNIPPETS_DIRECTORY)
  await createDir(path, { recursive: true })
  return path
}
