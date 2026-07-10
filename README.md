# Dashboard de Opciones

Dashboard local para analisis de acciones y opciones. Usa datos reales de mercado desde Alpaca para precios, velas y volumen, mientras mantiene el motor de opciones en modo simulado hasta que la calidad de datos reales de opciones sea suficiente.

## Caracteristicas principales

- Modo Simulacion / Real Alpaca.
- Interfaz en Espanol / English.
- Buscador inteligente por ticker o nombre de compania.
- Watchlist personalizada.
- Screener multi-ticker.
- Score y grade para priorizar revision.
- Chart tipo TradingView con velas OHLCV, volumen y overlays.
- Signal history local en el navegador.
- Performance summary con win rate, drawdown y retornos.
- Auto evaluation rules con targets y stops virtuales.
- Export/import/backup local del historial.
- Glosario integrado.

## Estado de datos

REAL en modo Real / Alpaca:

- Precio.
- Velas OHLCV.
- Volumen.
- Timeframes desde Alpaca.

SIMULADO:

- Option chain principal.
- Call Wall.
- Put Wall.
- Max Pain.
- Expected Move.
- Probabilidades bullish / neutral / bearish.
- Niveles de opciones.

Real / Alpaca significa mercado real + opciones simuladas.

## Como correr el proyecto

Opcion facil:

1. Haz doble clic en `Start Dashboard.command`.
2. Espera a que se abran backend, frontend y navegador.
3. En la interfaz selecciona `Real / Alpaca` o `Simulacion`.

Opcion manual backend:

```bash
cd server
pnpm run dev
```

Opcion manual frontend:

```bash
VITE_DATA_PROVIDER=backend VITE_API_BASE_URL=http://localhost:4000 pnpm run dev
```

## Variables de entorno

El frontend usa `.env` en la raiz:

```bash
VITE_DATA_PROVIDER=backend
VITE_API_BASE_URL=http://localhost:4000
```

El backend usa `server/.env` para las credenciales de Alpaca. Usa `server/.env.example` como plantilla.

## Seguridad

- No subir `.env`.
- No subir `server/.env`.
- No compartir API keys.
- Usar `.env.example` y `server/.env.example` como plantillas.
- Las claves de Alpaca deben vivir solo en tu computadora.

## Limitaciones actuales

- No ejecuta ordenes.
- No hace trading real.
- No es asesoria financiera.
- El options engine sigue simulado.
- Datos reales de opciones estan bloqueados hasta que tengan calidad suficiente.

## Proximas mejoras

- Mejor proveedor de option chain real.
- Rule analytics avanzado.
- Paper trading opcional en el futuro.
- Mas simbolos en autocomplete.
- Mejoras visuales del chart.
