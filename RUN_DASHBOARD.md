# Como abrir el Dashboard de Opciones

## Opcion facil

1. Haz doble clic en `Start Dashboard.command`.
2. Espera que se abran las ventanas de backend y frontend.
3. Espera que abra el navegador.
4. Selecciona el modo:
   - `Simulacion`
   - `Real / Alpaca`
5. Confirma en la interfaz:
   - Precios y velas reales cuando estes en `Real / Alpaca`.
   - Opciones simuladas.

El launcher fuerza el archivo `.env` de la raiz a:

```bash
VITE_DATA_PROVIDER=backend
VITE_API_BASE_URL=http://localhost:4000
```

## Opcion manual

Backend:

```bash
cd server
pnpm run dev
```

Frontend:

```bash
VITE_DATA_PROVIDER=backend VITE_API_BASE_URL=http://localhost:4000 pnpm run dev
```

Luego abre el puerto que muestre Vite, normalmente:

```text
http://localhost:5173
```

## Si Real / Alpaca falla

- Revisa que el backend este prendido.
- Revisa que `server/.env` exista.
- Las claves de Alpaca van en `server/.env`.
- Nunca subas `server/.env` a GitHub.

## Seguridad

- El dashboard no ejecuta trades.
- El dashboard no envia ordenes.
- Los niveles de opciones siguen simulados.
- `server/.env` debe quedarse solo en tu computadora.
