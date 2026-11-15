# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)


snippetfiles es para leer y escribir archivos

correr
npm run tauri dev

## Protección de datos de familias

En Windows, `familias.json` se cifra y descifra automáticamente con DPAPI para
la cuenta de Windows actual. Los archivos JSON antiguos se convierten al formato
cifrado cuando la aplicación los lee por primera vez. El archivo y el Excel se
guardan en `Escritorio/informaciónFamilias`.

`familias.xlsx` se crea si no existe y se actualiza al iniciar la aplicación y
cada vez que se guardan cambios de familias. El Excel no está cifrado; contiene
datos personales en texto legible. El JSON cifrado solo se puede descifrar con
la misma cuenta de Windows en el mismo equipo. Antes de cambiar de equipo o
cuenta, prepara un respaldo seguro: el JSON cifrado no se podrá abrir allí y el
Excel contiene los datos en texto claro.