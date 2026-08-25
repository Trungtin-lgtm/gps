import { useId, useEffect } from 'react';
import { map } from './core/MapView';
import { findFonts } from './core/mapUtil';

// Lop phu the hien day du chu quyen Viet Nam doi voi hai quan dao
// Hoang Sa (Paracel) va Truong Sa (Spratly): khung khoanh vung net dut
// + nhan tieng Viet. Hien o muc thu phong rong (nhin tong the Bien Dong),
// tu dong an khi nguoi dung phong to de theo doi phuong tien.
const territory = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Quần đảo Hoàng Sa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [111.1, 15.7], [113.0, 15.7], [113.0, 17.2], [111.1, 17.2], [111.1, 15.7],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Quần đảo Trường Sa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [111.3, 6.5], [117.8, 6.5], [117.8, 12.0], [111.3, 12.0], [111.3, 6.5],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Quần đảo Hoàng Sa' },
      geometry: { type: 'Point', coordinates: [112.05, 16.5] },
    },
    {
      type: 'Feature',
      properties: { name: 'Quần đảo Trường Sa' },
      geometry: { type: 'Point', coordinates: [113.6, 9.4] },
    },
  ],
};

const MapVietnamTerritory = () => {
  const id = useId();

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: territory,
    });
    map.addLayer({
      source: id,
      id: 'vn-territory-line',
      type: 'line',
      maxzoom: 8,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'line-color': '#C62828',
        'line-width': 1.4,
        'line-dasharray': [3, 2],
      },
    });
    map.addLayer({
      source: id,
      id: 'vn-territory-label',
      type: 'symbol',
      maxzoom: 10,
      filter: ['==', '$type', 'Point'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': findFonts(map),
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#C62828',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });

    return () => {
      if (map.getLayer('vn-territory-label')) {
        map.removeLayer('vn-territory-label');
      }
      if (map.getLayer('vn-territory-line')) {
        map.removeLayer('vn-territory-line');
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id]);

  return null;
};

export default MapVietnamTerritory;
