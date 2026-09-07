import React from 'react';
import { TilesRenderer, TilesPlugin, TilesAttributionOverlay } from '3d-tiles-renderer/r3f';
import { GoogleCloudAuthPlugin, ReorientationPlugin, TilesFadePlugin } from '3d-tiles-renderer/plugins';

/** Grados a radianes: la reorientación del plugin trabaja en radianes. */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Modo FOTORREALISTA (opcional).
 *
 * Carga las Photorealistic 3D Tiles de Google —la misma malla fotogramétrica que
 * se ve en Google Earth— y la reorienta para que el centro de nuestra zona quede
 * en el origen, con las mismas coordenadas en metros que usa el resto de la app.
 * Así los hotspots, la cámara y el panel siguen funcionando igual.
 *
 * Requiere una clave de Google Maps Platform con la Map Tiles API habilitada:
 *
 *   .env  →  VITE_GOOGLE_TILES_KEY=AIza…
 *
 * Sin clave, la app usa la ciudad de OpenStreetMap (modo por defecto) y este
 * componente no llega a montarse.
 *
 * Ojo con la facturación: las teselas fotorrealistas se cobran por sesión/uso
 * en Google Maps Platform, y su licencia obliga a mostrar la atribución que
 * pinta <TilesAttributionOverlay />. No la quites.
 */
export default function PhotoCity({ apiKey, center, errorTarget = 12 }) {
  // el plugin espera radianes, no grados
  const lat = toRad(center[0]);
  const lon = toRad(center[1]);

  return (
    <TilesRenderer key={apiKey} errorTarget={errorTarget}>
      <TilesPlugin plugin={GoogleCloudAuthPlugin} args={{ apiToken: apiKey, autoRefreshToken: true }} />
      {/* deja el centro de la zona en el origen, con Y hacia arriba */}
      <TilesPlugin plugin={ReorientationPlugin} args={{ lat, lon, height: 0, up: '+y', recenter: true }} />
      <TilesPlugin plugin={TilesFadePlugin} args={{ fadeDuration: 400 }} />
      <TilesAttributionOverlay />
    </TilesRenderer>
  );
}


