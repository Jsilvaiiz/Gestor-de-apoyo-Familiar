import {create} from "zustand";
interface Snippet{
  name:String;
  code: String|null;
}
interface SnippetState {
  snippetsName: string[];
  selectedSnippet: Snippet | null;
  addSnippetName: (name: string) => void;
  setSnippetsName: (names: string[]) => void;
  setSelectedSnippet: (snippet: Snippet | null) => void;
  removeSnippetName: (name: string) => void;
}

export const useSnippetStore = create<SnippetState>((set) => ({
  snippetsName: [],
  selectedSnippet: null,
  addSnippetName: (name: string) =>
    set((state: SnippetState) => ({
      snippetsName: [...state.snippetsName, name],
    })),
  setSnippetsName: (names: string[]) => set({snippetsName: names}),
  setSelectedSnippet: (snippet) => set({selectedSnippet: snippet}),
  removeSnippetName: (name: string) =>
    set((state: SnippetState) => ({
      snippetsName: state.snippetsName.filter((n) => n !== name),
    })),
}));