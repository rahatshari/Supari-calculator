import { Printer } from '@capgo/capacitor-printer';
import { Capacitor } from '@capacitor/core';

interface PrintReceiptOptions {
  name: string;
  html: string;
  cssClass?: string;
}

/**
 * Robust print helper for both Native Android APK (Capacitor) and Web browsers.
 * - On Android APK: Calls Android's native PrintManager via @capgo/capacitor-printer,
 *   which brings up the system print dialog (Save as PDF, Bluetooth/Wi-Fi printer, etc.)
 * - On Web: Falls back to window.print() or hidden printable iframe.
 */
export async function printReceipt({ name, html, cssClass }: PrintReceiptOptions): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const formattedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    body {
      margin: 0;
      padding: 12px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

      await Printer.printHtml({
        name,
        html: formattedHtml,
      });
      return true;
    } catch (err) {
      console.warn('Native Printer.printHtml failed, attempting window.print fallback:', err);
    }
  }

  // Web Browser fallback
  try {
    if (cssClass) {
      document.body.classList.add(cssClass);
    }
    window.print();
    setTimeout(() => {
      if (cssClass) {
        document.body.classList.remove(cssClass);
      }
    }, 600);
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    if (cssClass) {
      document.body.classList.remove(cssClass);
    }
    return false;
  }
}
