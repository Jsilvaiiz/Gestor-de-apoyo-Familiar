// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ContenidoDescifrado {
    contenido: String,
    cifrado: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SobreCifrado {
    formato: String,
    datos: String,
}

#[tauri::command]
fn cifrar_datos(contenido: String) -> Result<String, String> {
    #[cfg(windows)]
    {
        let datos = proteger_con_dpapi(contenido.as_bytes())?;
        let sobre = SobreCifrado {
            formato: "DPAPI1".to_string(),
            datos: bytes_a_hex(&datos),
        };
        return serde_json::to_string(&sobre).map_err(|error| error.to_string());
    }

    #[cfg(not(windows))]
    {
        let _ = contenido;
        Err("El cifrado de datos está disponible solo en Windows".to_string())
    }
}

#[tauri::command]
fn descifrar_datos(contenido: String) -> Result<ContenidoDescifrado, String> {
    let valor: serde_json::Value =
        serde_json::from_str(&contenido).unwrap_or(serde_json::Value::Null);

    if valor.get("formato").and_then(|v| v.as_str()) != Some("DPAPI1") {
        return Ok(ContenidoDescifrado {
            contenido,
            cifrado: false,
        });
    }

    let sobre: SobreCifrado = serde_json::from_value(valor).map_err(|error| error.to_string())?;
    if sobre.formato != "DPAPI1" {
        return Err("El formato del contenido cifrado no es compatible".to_string());
    }
    let datos = hex_a_bytes(&sobre.datos)?;

    #[cfg(windows)]
    {
        let texto = proteger_con_dpapi_inverso(&datos)?;
        let contenido = String::from_utf8(texto).map_err(|error| error.to_string())?;
        return Ok(ContenidoDescifrado {
            contenido,
            cifrado: true,
        });
    }

    #[cfg(not(windows))]
    {
        let _ = datos;
        Err("El descifrado de datos está disponible solo en Windows".to_string())
    }
}

fn bytes_a_hex(datos: &[u8]) -> String {
    datos.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn hex_a_bytes(hex: &str) -> Result<Vec<u8>, String> {
    if hex.len() % 2 != 0 {
        return Err("El contenido cifrado está dañado".to_string());
    }

    (0..hex.len())
        .step_by(2)
        .map(|indice| {
            u8::from_str_radix(&hex[indice..indice + 2], 16)
                .map_err(|error| format!("El contenido cifrado está dañado: {error}"))
        })
        .collect()
}

#[cfg(windows)]
#[repr(C)]
struct DataBlob {
    cb_data: u32,
    pb_data: *mut u8,
}

#[cfg(windows)]
#[link(name = "Crypt32")]
extern "system" {
    fn CryptProtectData(
        data_in: *const DataBlob,
        description: *const u16,
        optional_entropy: *const DataBlob,
        reserved: *const std::ffi::c_void,
        prompt: *const std::ffi::c_void,
        flags: u32,
        data_out: *mut DataBlob,
    ) -> i32;
    fn CryptUnprotectData(
        data_in: *const DataBlob,
        description: *mut *mut u16,
        optional_entropy: *const DataBlob,
        reserved: *const std::ffi::c_void,
        prompt: *const std::ffi::c_void,
        flags: u32,
        data_out: *mut DataBlob,
    ) -> i32;
}

#[cfg(windows)]
#[link(name = "Kernel32")]
extern "system" {
    fn LocalFree(memory: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
}

#[cfg(windows)]
fn proteger_con_dpapi(datos: &[u8]) -> Result<Vec<u8>, String> {
    transformar_con_dpapi(datos, true)
}

#[cfg(windows)]
fn proteger_con_dpapi_inverso(datos: &[u8]) -> Result<Vec<u8>, String> {
    transformar_con_dpapi(datos, false)
}

#[cfg(windows)]
fn transformar_con_dpapi(datos: &[u8], proteger: bool) -> Result<Vec<u8>, String> {
    let longitud = u32::try_from(datos.len())
        .map_err(|_| "El contenido es demasiado grande para cifrar".to_string())?;
    let entrada = DataBlob {
        cb_data: longitud,
        pb_data: datos.as_ptr() as *mut u8,
    };
    let mut salida = DataBlob {
        cb_data: 0,
        pb_data: std::ptr::null_mut(),
    };

    let resultado = unsafe {
        if proteger {
            CryptProtectData(
                &entrada,
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                1,
                &mut salida,
            )
        } else {
            CryptUnprotectData(
                &entrada,
                std::ptr::null_mut(),
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                1,
                &mut salida,
            )
        }
    };

    if resultado == 0 {
        return Err(format!(
            "Windows no pudo {} los datos: {}",
            if proteger { "cifrar" } else { "descifrar" },
            std::io::Error::last_os_error()
        ));
    }

    if salida.pb_data.is_null() {
        return Err("Windows devolvió datos cifrados vacíos".to_string());
    }

    let bytes =
        unsafe { std::slice::from_raw_parts(salida.pb_data, salida.cb_data as usize).to_vec() };
    unsafe {
        LocalFree(salida.pb_data as *mut std::ffi::c_void);
    }
    Ok(bytes)
}

#[cfg(all(test, windows))]
mod tests {
    use super::{cifrar_datos, descifrar_datos};

    #[test]
    fn los_datos_se_cifran_y_descifran_con_dpapi() {
        let originales = r#"[{"nombre":"dato confidencial"}]"#;
        let cifrados = cifrar_datos(originales.to_string()).expect("debe cifrar");

        assert!(!cifrados.contains("dato confidencial"));
        let descifrados = descifrar_datos(cifrados).expect("debe descifrar");
        assert!(descifrados.cifrado);
        assert_eq!(descifrados.contenido, originales);
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            cifrar_datos,
            descifrar_datos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
