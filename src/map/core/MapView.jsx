// eslint-disable-next-line import/no-unresolved
import mapboxglRtlTextUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { googleProtocol } from 'maplibre-google-maps';
import React, {
  useRef, useLayoutEffect, useEffect, useState,
} from 'react';
import { SwitcherControl } from '../switcher/switcher';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import usePersistedState, { savePersistedState } from '../../common/util/usePersistedState';
import { mapImages } from './preloadImages';
import useMapStyles from './useMapStyles';

const element = document.createElement('div');
element.style.width = '100%';
element.style.height = '100%';
element.style.boxSizing = 'initial';

maplibregl.setRTLTextPlugin(mapboxglRtlTextUrl);
maplibregl.addProtocol('google', googleProtocol);

export const map = new maplibregl.Map({
  container: element,
});

let ready = false;
const readyListeners = new Set();

const addReadyListener = (listener) => {
  readyListeners.add(listener);
  listener(ready);
};

const removeReadyListener = (listener) => {
  readyListeners.delete(listener);
};

const updateReadyValue = (value) => {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
};

const MAP_STYLE_LOAD_TIMEOUT_MS = 8000;
let styleLoadAttempt = 0;

const localizeOpenFreeMapPlaces = () => {
  const style = map.getStyle();
  if (!style.glyphs?.startsWith('https://tiles.openfreemap.org')) {
    return;
  }

  const vietnameseName = [
    'coalesce',
    ['get', 'name:vi'],
    ['get', 'name'],
    ['get', 'name:latin'],
    ['get', 'name_en'],
  ];
  const localName = ['coalesce', ['get', 'name:vi'], ['get', 'name'], ''];
  const excludeLocalAdministrativeUnits = [
    'all',
    ['!=', ['slice', localName, 0, 7], 'Phường '],
    ['!=', ['slice', localName, 0, 3], 'Xã '],
    ['!=', ['slice', localName, 0, 9], 'Thị trấn '],
  ];

  style.layers
    .filter((layer) => layer.type === 'symbol' && layer['source-layer'] === 'place')
    .forEach((layer) => {
      map.setLayoutProperty(layer.id, 'text-field', vietnameseName);
      const existingFilter = map.getFilter(layer.id);
      map.setFilter(
        layer.id,
        existingFilter
          ? ['all', existingFilter, excludeLocalAdministrativeUnits]
          : excludeLocalAdministrativeUnits,
      );
    });

  // Keep the regional view focused on provinces and cities. Ward/commune and
  // neighbourhood labels become useful only after the user zooms in further.
  [
    ['label_other', 12],
    ['label_village', 12],
    ['label_town', 11],
  ].forEach(([layerId, minZoom]) => {
    if (map.getLayer(layerId)) {
      map.setLayerZoomRange(layerId, minZoom, 24);
    }
  });
  if (map.getLayer('label_state')) {
    map.setLayerZoomRange('label_state', 5, 11);
  }
};

const initMap = async () => {
  if (ready) return;
  if (!map.hasImage('background')) {
    Object.entries(mapImages).forEach(([key, value]) => {
      map.addImage(key, value, {
        pixelRatio: window.devicePixelRatio,
      });
    });
  }
  updateReadyValue(true);
};

map.addControl(new maplibregl.NavigationControl());

const switcher = new SwitcherControl(
  () => updateReadyValue(false),
  (styleId) => savePersistedState('selectedMapStyle', styleId),
  (styleId) => {
    styleLoadAttempt += 1;
    const attempt = styleLoadAttempt;
    const fallbackTimer = setTimeout(() => {
      if (attempt === styleLoadAttempt && !map.loaded() && styleId !== 'osm') {
        switcher.selectStyle('osm');
      }
    }, MAP_STYLE_LOAD_TIMEOUT_MS);

    map.once('styledata', () => {
      const waiting = () => {
        if (attempt !== styleLoadAttempt) {
          clearTimeout(fallbackTimer);
        } else if (!map.loaded()) {
          setTimeout(waiting, 33);
        } else {
          clearTimeout(fallbackTimer);
          localizeOpenFreeMapPlaces();
          initMap();
        }
      };
      waiting();
    });
  },
);

map.addControl(switcher);

const MapView = ({ children }) => {
  const containerEl = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  const mapStyles = useMapStyles();
  const activeMapStyles = useAttributePreference('activeMapStyles', 'locationIqStreets,locationIqDark,openFreeMap');
  const [defaultMapStyle] = usePersistedState('selectedMapStyle', usePreference('map', 'openFreeMap'));
  const mapboxAccessToken = useAttributePreference('mapboxAccessToken');
  const maxZoom = useAttributePreference('web.maxZoom');

  useEffect(() => {
    if (maxZoom) {
      map.setMaxZoom(maxZoom);
    }
  }, [maxZoom]);

  useEffect(() => {
    maplibregl.accessToken = mapboxAccessToken;
  }, [mapboxAccessToken]);

  useEffect(() => {
    const filteredStyles = mapStyles.filter((s) => s.available && activeMapStyles.includes(s.id));
    const osmStyle = mapStyles.find((style) => style.id === 'osm');
    const styles = filteredStyles.length ? [...filteredStyles] : [osmStyle];
    if (osmStyle && !styles.some((style) => style.id === 'osm')) {
      styles.push(osmStyle);
    }
    switcher.updateStyles(styles, defaultMapStyle);
  }, [mapStyles, activeMapStyles, defaultMapStyle]);

  useEffect(() => {
    const listener = (ready) => setMapReady(ready);
    addReadyListener(listener);
    return () => {
      removeReadyListener(listener);
    };
  }, []);

  useLayoutEffect(() => {
    const currentEl = containerEl.current;
    currentEl.appendChild(element);
    map.resize();
    return () => {
      currentEl.removeChild(element);
    };
  }, [containerEl]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerEl}>
      {mapReady && children}
    </div>
  );
};

export default MapView;
