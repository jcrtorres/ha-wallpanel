import type { DashboardConfig } from './types';

export const uid = () => Math.random().toString(36).slice(2, 9);

// Tablero de ejemplo inspirado en la imagen de referencia.
export const defaultConfig = (): DashboardConfig => ({
  version: 1,
  updatedAt: 0,
  idleReturnSec: 120,
  sections: [
    {
      id: 'inicio', name: 'Inicio', views: [
        {
          id: uid(), name: 'Principal', tiles: [
            { id: uid(), type: 'climate-big', w: 2, h: 2, entity: 'sensor.salon_temperatura', humidity: 'sensor.salon_humedad', extra: 'sensor.pm25', label: 'Calidad del aire' },
            { id: uid(), type: 'bars', w: 4, h: 2, label: 'Consumo', compareAttr: 'last_period', entities: [
              { entity: 'sensor.consumo_electricidad', label: 'Electricidad' },
              { entity: 'sensor.consumo_calefaccion', label: 'Calefacción' },
              { entity: 'sensor.consumo_agua', label: 'Agua' },
              { entity: 'sensor.consumo_gas', label: 'Gas' },
              { entity: 'sensor.consumo_agua_caliente', label: 'Agua caliente' },
            ] },
            { id: uid(), type: 'weather', w: 2, h: 2, entity: 'weather.casa', label: 'Buen momento para ventilar' },
            { id: uid(), type: 'number', w: 1, h: 2, entity: 'input_number.piso_ascensor', action: 'script.llamar_ascensor', label: 'Ascensor', cta: 'Llamar', accent: 'copper', unit: 'F' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'camera.entrada', label: 'Ver visitante', icon: 'visitor', mode: 'icon' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'light.todas', label: 'Apagado general', icon: 'bulb' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'switch.modo_salida', label: 'Modo salida', icon: 'home' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'lock.puerta_principal', label: 'Puerta', icon: 'lock' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'sensor.paquetes', label: 'Paquetes', icon: 'package', accent: 'teal' },
            { id: uid(), type: 'entity', w: 1, h: 1, entity: 'alarm_control_panel.casa', label: 'Alarma', icon: 'shield' },
          ],
        },
        {
          id: uid(), name: 'Iluminación', tiles: [
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'light.salon', label: 'Salón', icon: 'bulb' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'light.cocina', label: 'Cocina', icon: 'bulb' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'light.dormitorio', label: 'Dormitorio', icon: 'bulb' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'cover.persianas_salon', label: 'Persianas salón', icon: 'blinds' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'fan.ventilacion', label: 'Ventilación', icon: 'fan' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'scene.cine', label: 'Escena cine', icon: 'scene', accent: 'teal' },
          ],
        },
        {
          id: uid(), name: 'Seguridad', tiles: [
            { id: uid(), type: 'entity', w: 4, h: 4, entity: 'camera.entrada', label: 'Entrada' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'alarm_control_panel.casa', label: 'Alarma', icon: 'shield' },
            { id: uid(), type: 'entity', w: 2, h: 2, entity: 'lock.puerta_principal', label: 'Puerta principal', icon: 'lock' },
          ],
        },
      ],
    },
    {
      id: 'clima', name: 'Clima', views: [
        {
          id: uid(), name: 'Clima', tiles: [
            { id: uid(), type: 'entity', w: 3, h: 4, entity: 'climate.salon', label: 'Termostato salón' },
            { id: uid(), type: 'entity', w: 3, h: 2, entity: 'sensor.salon_humedad', label: 'Humedad', icon: 'drop' },
            { id: uid(), type: 'entity', w: 3, h: 2, entity: 'sensor.pm25', label: 'PM2.5', icon: 'smile' },
          ],
        },
      ],
    },
  ],
});
