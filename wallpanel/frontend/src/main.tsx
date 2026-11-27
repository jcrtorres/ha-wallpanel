import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { BridgeClient, DemoClient } from './ha/client';
import { HassContext } from './ha/hooks';
import { detectMode, loadConfig } from './storage';
import { defaultConfig } from './defaultConfig';

(async () => {
  const [mode, cfg] = await Promise.all([detectMode(), loadConfig()]);
  const hass = mode === 'ha' ? new BridgeClient() : new DemoClient();
  hass.connect();
  createRoot(document.getElementById('root')!).render(
    <HassContext.Provider value={hass}>
      <App initial={cfg ?? defaultConfig()} />
    </HassContext.Provider>,
  );
})();
