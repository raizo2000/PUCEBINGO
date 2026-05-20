# PUCESE Bingo

Aplicación web profesional de bingo para eventos grandes. Permite administrar partidas en vivo, generar miles de cartillas con seriales únicos, exportar PDF para impresión y validar ganadores.

## Características

- **Partida en vivo**: sorteo aleatorio sin repetición, pausa, reinicio, tablero visible a distancia
- **Números configurables**: 75, 90, 100, 120 o valor personalizado
- **Generador masivo**: miles de cartillas, 4 por hoja/jugador, procesamiento por lotes
- **Modos**: clásico BINGO (columnas B-I-N-G-O) o libre (5×5 sin restricción de columna)
- **Seriales únicos**: formato `BG-2026-0000001`, persisten al reiniciar la partida
- **PDF**: una página por jugador, carta o A4, códigos QR opcionales, barra de progreso
- **Validador**: busca por serial, ID de cartilla o jugador; detecta líneas y cartilla llena
- **Persistencia**: `localStorage` (partida) + IndexedDB (cartillas)

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- jsPDF, idb, qrcode

## Requisitos

- Node.js 20.19+ (recomendado) o 22+
- npm

## Instalación

```bash
git clone <tu-repositorio>
cd pucesebingo
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Despliegue en Vercel

1. Sube el proyecto a GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com), **Add New Project** e importa el repositorio.
3. Vercel detecta Next.js automáticamente.
4. Deploy.

También puedes usar la CLI:

```bash
npm i -g vercel
vercel
```

> **Nota**: Toda la lógica corre en el cliente (localStorage + IndexedDB). No se requiere base de datos externa para el funcionamiento básico.

## Estructura del proyecto

```
src/
├── app/              # Rutas: /, /generar, /validar, /admin
├── components/       # UI: partida, generador, validador, admin
├── context/          # Estado global (BingoProvider)
└── lib/              # Lógica: cartillas, bingo, PDF, storage, validación
```

## Uso rápido

1. **Generar** → indica cantidad de cartillas, elige modo y descarga el PDF.
2. **Partida** → configura máximo de números, sortea con el botón grande.
3. **Validar** → ingresa serial o código; comprueba bingo contra números sorteados.
4. **Admin** → reinicia partida o borra cartillas si necesitas un evento nuevo.

## Rendimiento

- Generación de cartillas en lotes con `async generator` y `setTimeout(0)` para no bloquear el UI.
- Guardado en IndexedDB por lotes de 100 cartillas.
- PDF: QR en lotes + páginas en lotes con actualización de progreso.

Para PDFs de más de ~500 páginas, usa un navegador actual (Chrome/Edge) y cierra pestañas innecesarias.

## Licencia

Uso interno / educativo PUCESE.
