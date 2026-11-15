import ModalInformativo from "./ModalInformativo";

interface TerminosUsoProps {
  onClose: () => void;
}

export default function TerminosUso({ onClose }: TerminosUsoProps) {
  return (
    <ModalInformativo titulo="Términos de uso" onClose={onClose}>
      <p>
        Utiliza la aplicación para gestionar información de manera responsable
        y solo con autorización para hacerlo. Eres responsable de revisar los
        datos ingresados y de proteger el acceso al equipo y a los archivos
        generados.
      </p>
      <p>
        La aplicación ofrece herramientas de organización; no sustituye el
        criterio profesional ni garantiza por sí sola la conservación de los
        datos. Mantén respaldos seguros y verifica que puedas acceder a ellos.
      </p>
      <p>
        El Excel y otros archivos locales que no estén cifrados pueden exponer
        información. Compártelos únicamente con personas autorizadas.
      </p>
      <p className="text-xs text-zinc-400">
        Texto informativo básico; estos términos deben revisarse antes de
        utilizarlos como documento legal u organizacional.
      </p>
    </ModalInformativo>
  );
}
