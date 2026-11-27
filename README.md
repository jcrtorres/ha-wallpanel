# HA Wallpanel

Add-on de Home Assistant que ofrece un frontend minimalista pensado para tablets y pantallas de pared.

## Características
- Secciones con vistas que se deslizan horizontalmente, cada una a pantalla completa, sin scroll.
- Tarjetas tipo mosaico: luces, interruptores, clima, alarma, cámaras, sensores y gráficas de consumo.
- Modo edición táctil para agregar, mover, redimensionar y borrar tarjetas y vistas.
- Tema oscuro, configuración compartida entre todas las tablets.
- Se abre desde la barra lateral de Home Assistant (ingress), sin tokens.

## Instalación
1. En Home Assistant ve a Ajustes > Complementos > Tienda de complementos.
2. Menú ⋮ > Repositorios y agrega la URL de este repositorio.
3. Instala **HA Wallpanel** e inícialo.
4. Ábrelo desde la barra lateral o en modo kiosko en tu tablet.

## Tecnología
React, Vite, Tailwind, Swiper y Node.js.

## Licencia
MIT

## Estructura

```
repository.yaml          # metadatos del repositorio de add-ons
wallpanel/
  config.yaml            # definición del add-on (ingress, API de HA)
  Dockerfile             # compila el frontend y empaqueta el servidor
  DOCS.md                # uso, edición y modo kiosko (se ve en la pestaña Documentación del add-on)
  server/index.js        # Node: estáticos, /api/config, puente WebSocket, proxy de cámaras
  frontend/              # React + Vite + Tailwind + Swiper + dnd-kit
```

## Cómo funciona

- El navegador se conecta a `./ws` del add-on y el servidor abre la conexión con Home Assistant usando el `SUPERVISOR_TOKEN`, así que la tablet no guarda ningún token.
- El tablero se guarda en `/data/dashboard.json`; al guardarlo, el servidor avisa a las demás tablets para que se actualicen.
- Las imágenes de cámaras pasan por `./api/camera/<entity_id>`.

## Desarrollo local

```bash
# servidor (modo demo sin HA, o contra tu HA con HA_URL + HA_TOKEN)
cd wallpanel/server && npm i
HA_URL=http://homeassistant.local:8123 HA_TOKEN=<token> STATIC_DIR=../frontend/dist DATA_DIR=./data node index.js

# frontend con recarga en caliente (proxy de /api y /ws al puerto 8099)
cd wallpanel/frontend && npm i && npm run dev
```

Sin `HA_URL`/`HA_TOKEN`, el panel arranca en modo demo con datos simulados.
