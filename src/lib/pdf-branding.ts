/** Frase institucional en el encabezado de cada hoja del PDF */
export const PDF_SHEET_MOTTO = "Excelencia, Memoria y Esperanza";

/** Logo PUCE Esmeraldas (colocar en /public) */
export const PDF_LOGO_PATH = "/logou.png";

/** Proporción del archivo logou.png (456×244) */
export const PDF_LOGO_ASPECT = 244 / 456;

let logoDataUrlCache: string | null | undefined;

/** Carga el logo una vez como data URL para jsPDF */
export async function loadPdfLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;

  try {
    const res = await fetch(PDF_LOGO_PATH);
    if (!res.ok) {
      logoDataUrlCache = null;
      return null;
    }
    const blob = await res.blob();
    logoDataUrlCache = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    return logoDataUrlCache;
  } catch {
    logoDataUrlCache = null;
    return null;
  }
}
