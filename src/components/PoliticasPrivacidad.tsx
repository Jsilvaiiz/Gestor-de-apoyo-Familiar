import ModalInformativo from "./ModalInformativo";

interface PoliticasPrivacidadProps {
  onClose: () => void;
}

export default function PoliticasPrivacidad({
  onClose,
}: PoliticasPrivacidadProps) {
  return (
    <ModalInformativo  titulo="Política de privacidad" onClose={onClose}>
      <p>
        Esta aplicación está diseñada para guardar la información en archivos
        locales dentro de la carpeta informaciónFamilias del Escritorio.
      </p>
      <p>
        En Windows, los datos de familias guardados en familias.json se cifran
        con DPAPI para la cuenta y el equipo actuales. El archivo
        familias.xlsx y otros archivos, como los catálogos y las etiquetas del
        calendario, no están cifrados y pueden ser leídos por quien tenga acceso
        a ellos.
      </p>
      <p>
        Evita almacenar información que no sea necesaria, protege el acceso a tu
        equipo y realiza respaldos seguros. El JSON cifrado no se puede recuperar
        con otra cuenta o en otro equipo.
      </p>
      <p className="text-xs text-zinc-400">
        Aviso informativo básico; no reemplaza una política legal revisada para
        tu organización.
      </p>
    </ModalInformativo>

  );
}
