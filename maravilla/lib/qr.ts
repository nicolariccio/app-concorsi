import "server-only";
import QRCode from "qrcode";

/** QR scuro su chiaro con il margine bianco necessario per la lettura. */
export function qrSvg(testo: string): Promise<string> {
  return QRCode.toString(testo, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#0E1F11", light: "#F4EFE3" } });
}
