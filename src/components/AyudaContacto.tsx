import { Mail } from "lucide-react";
import ModalInformativo from "./ModalInformativo";

interface AyudaContactoProps {
  onClose: () => void;
}

export default function AyudaContacto({ onClose }: AyudaContactoProps) {
  return (
    <ModalInformativo titulo="Ayuda y contacto" onClose={onClose}>
      <p>
        Si encuentras un problema o tienes una consulta sobre la aplicación,
        puedes contactar al desarrollador por correo:
      </p>
      <a
        href="mailto:joaquin.silva@mail.udp.cl"
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
      >
        <Mail size={17} aria-hidden="true" />
        joaquin.silva@mail.udp.cl
      </a>
    </ModalInformativo>
  );
}
