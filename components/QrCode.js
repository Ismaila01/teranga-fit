import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCode({ value, size = 220 }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2, margin: 1, errorCorrectionLevel: "M",
      color: { dark: "#17181B", light: "#FFFFFF" },
    }).then(setSrc).catch(() => setSrc(""));
  }, [value, size]);

  return src
    ? <img src={src} alt="QR code" width={size} height={size} className="qrImg" />
    : <div style={{ width: size, height: size }} />;
}
