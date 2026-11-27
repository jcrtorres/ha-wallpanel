import {
  mdiLightbulbOutline, mdiPower, mdiLockOutline, mdiLockOpenVariantOutline, mdiCctv, mdiShieldHomeOutline,
  mdiAlarmLight, mdiThermometer, mdiWaterOutline, mdiFan, mdiBlindsHorizontal, mdiDoor, mdiElevatorPassengerOutline,
  mdiPlayOutline, mdiStarFourPointsOutline, mdiTelevision, mdiPowerSocketEu, mdiHomeOutline, mdiCarOutline,
  mdiPackageVariantClosed, mdiAccountBoxOutline, mdiWeatherSunny, mdiWeatherCloudy, mdiWeatherRainy, mdiWeatherNight,
  mdiWeatherPartlyCloudy, mdiWeatherSnowy, mdiWeatherFog, mdiEmoticonHappyOutline, mdiChartBar, mdiBellOutline,
  mdiMenu, mdiPencilOutline, mdiCheck, mdiCogOutline, mdiChevronLeft, mdiChevronRight, mdiArrowExpand, mdiTrashCanOutline,
  mdiPlus, mdiGarageOpenVariant, mdiWashingMachine, mdiRobotVacuum, mdiAirConditioner, mdiSpeaker, mdiWifi, mdiCamera,
  mdiCurtains, mdiSprinklerVariant, mdiFire, mdiLeaf, mdiFlash, mdiGauge, mdiCoffeeOutline,
} from '@mdi/js';

// Iconos que se pueden elegir en las tarjetas (nombre -> path MDI).
export const ICONS: Record<string, string> = {
  bulb: mdiLightbulbOutline, power: mdiPower, lock: mdiLockOutline, unlock: mdiLockOpenVariantOutline,
  cctv: mdiCctv, camera: mdiCamera, shield: mdiShieldHomeOutline, siren: mdiAlarmLight, thermo: mdiThermometer,
  drop: mdiWaterOutline, fan: mdiFan, blinds: mdiBlindsHorizontal, curtains: mdiCurtains, door: mdiDoor,
  garage: mdiGarageOpenVariant, elevator: mdiElevatorPassengerOutline, play: mdiPlayOutline, scene: mdiStarFourPointsOutline,
  tv: mdiTelevision, speaker: mdiSpeaker, plug: mdiPowerSocketEu, home: mdiHomeOutline, car: mdiCarOutline,
  package: mdiPackageVariantClosed, visitor: mdiAccountBoxOutline, smile: mdiEmoticonHappyOutline, chart: mdiChartBar,
  bell: mdiBellOutline, washer: mdiWashingMachine, vacuum: mdiRobotVacuum, ac: mdiAirConditioner, wifi: mdiWifi,
  sprinkler: mdiSprinklerVariant, fire: mdiFire, leaf: mdiLeaf, flash: mdiFlash, gauge: mdiGauge, coffee: mdiCoffeeOutline,
};

export const UI_ICONS = {
  menu: mdiMenu, edit: mdiPencilOutline, check: mdiCheck, gear: mdiCogOutline, left: mdiChevronLeft, right: mdiChevronRight,
  resize: mdiArrowExpand, trash: mdiTrashCanOutline, plus: mdiPlus,
};

export const WEATHER_ICONS: Record<string, string> = {
  sunny: mdiWeatherSunny, 'clear-night': mdiWeatherNight, cloudy: mdiWeatherCloudy, partlycloudy: mdiWeatherPartlyCloudy,
  rainy: mdiWeatherRainy, pouring: mdiWeatherRainy, snowy: mdiWeatherSnowy, fog: mdiWeatherFog,
};

export const DOMAIN_ICON: Record<string, string> = {
  light: 'bulb', switch: 'power', fan: 'fan', lock: 'lock', cover: 'blinds', camera: 'cctv', alarm_control_panel: 'shield',
  scene: 'scene', script: 'play', media_player: 'tv', climate: 'thermo', sensor: 'chart', button: 'play', input_button: 'play',
  input_boolean: 'power', vacuum: 'vacuum',
};

export function Icon({ path, size = 28, className = '' }: { path?: string; size?: number; className?: string }) {
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}
