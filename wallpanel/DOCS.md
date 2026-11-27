# Panel de pared

Panel minimalista para tablets de pared, conectado a Home Assistant.

## Uso

- **Secciones**: pestañas en la barra superior (el botón ☰ pasa a la siguiente).
- **Vistas**: cada sección tiene varias vistas a pantalla completa. Cámbialas **deslizando** a izquierda o derecha, con los puntos de abajo o con las flechas del teclado.
- **Inactividad**: tras unos segundos sin tocar la pantalla vuelve a la primera vista (se configura en Ajustes ⚙).

## Editar el tablero

Pulsa el lápiz ✎ de la barra superior:

- **Tarjetas**: toca una para editarla. Mantén pulsado y arrastra para reordenar. ⤢ cambia el tamaño y 🗑 la borra. "+ Añadir tarjeta" crea una nueva.
- **Vistas**: usa los botones sobre la rejilla (renombrar, mover, añadir, borrar).
- **Secciones**: toca la sección activa para renombrarla, moverla o borrarla. "+ Sección" crea una.

Mientras editas, el deslizamiento con el dedo está desactivado para poder arrastrar las tarjetas; cambia de vista con los puntos.

El tablero se guarda en `/data/dashboard.json` del add-on y se sincroniza al instante con todas las tablets abiertas. En Ajustes puedes exportarlo e importarlo en JSON.

## Tipos de tarjeta

| Tipo | Uso |
|---|---|
| Entidad (automático) | Luces, interruptores, ventiladores (toggle), cerraduras, persianas, alarma (teclado), cámaras, escenas, scripts, botones, termostatos, sensores |
| Temperatura grande | Temperatura, humedad y un valor extra (p. ej. calidad del aire) |
| Clima exterior | Entidad `weather.*` |
| Gráfico de barras | Varios sensores; opcionalmente compara con un atributo del periodo anterior |
| Número con ▲▼ + acción | `input_number`/`number` con un script o escena al tocar (p. ej. ascensor) |

## Tablet en modo kiosko

**Opción recomendada (ingress)**: inicia sesión en Home Assistant en la tablet con un usuario dedicado y abre el panel "Panel de pared" de la barra lateral. Con Fully Kiosk Browser, usa como página de inicio la URL que aparece en el navegador al abrir el panel (algo como `http://IP_HA:8123/xxxxxxxx_wallpanel`).

**Puerto directo (opcional)**: en la pestaña *Red* del add-on puedes asignar un puerto a `8099/tcp` y abrir `http://IP_HA:PUERTO/` sin la interfaz de HA. ⚠️ Ese acceso **no tiene autenticación**: cualquiera en tu red podría controlar tu casa. Úsalo solo en una red de confianza o VLAN aislada.
