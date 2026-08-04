import { parse, stringify } from 'wellknown';
import circle from '@turf/circle';

export const loadImage = (url) => new Promise((imageLoaded) => {
  const image = new Image();
  image.onload = () => imageLoaded(image);
  image.src = url;
});

const canvasTintImage = (image, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * devicePixelRatio;
  canvas.height = image.height * devicePixelRatio;
  canvas.style.width = `${image.width}px`;
  canvas.style.height = `${image.height}px`;

  const context = canvas.getContext('2d');

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.globalAlpha = 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas;
};

export const prepareIcon = (background, icon, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = background.width * devicePixelRatio;
  canvas.height = background.height * devicePixelRatio;
  canvas.style.width = `${background.width}px`;
  canvas.style.height = `${background.height}px`;

  const context = canvas.getContext('2d');
  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (icon) {
    const iconRatio = 0.5;
    const imageWidth = canvas.width * iconRatio;
    const imageHeight = canvas.height * iconRatio;
    context.drawImage(canvasTintImage(icon, color), (canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const prepareStatusMarker = (color, selected = false) => {
  const size = 48;
  const scale = devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = size * scale;
  canvas.height = size * scale;
  const context = canvas.getContext('2d');
  context.scale(scale, scale);

  if (selected) {
    context.beginPath();
    context.arc(24, 21, 19, 0, Math.PI * 2);
    context.fillStyle = `${color}33`;
    context.fill();
  }

  context.save();
  context.shadowColor = 'rgba(15, 23, 42, 0.28)';
  context.shadowBlur = 5;
  context.shadowOffsetY = 2;
  context.beginPath();
  context.moveTo(24, 43);
  context.bezierCurveTo(20, 37, 10, 29, 10, 19);
  context.arc(24, 19, 14, Math.PI, 0);
  context.bezierCurveTo(38, 29, 28, 37, 24, 43);
  context.closePath();
  context.fillStyle = '#ffffff';
  context.fill();
  context.restore();

  context.beginPath();
  context.moveTo(24, 39);
  context.bezierCurveTo(20, 34, 14, 27, 14, 19);
  context.arc(24, 19, 10, Math.PI, 0);
  context.bezierCurveTo(34, 27, 28, 34, 24, 39);
  context.closePath();
  context.fillStyle = color;
  context.fill();

  context.beginPath();
  context.arc(24, 19, 4, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const reverseCoordinates = (it) => {
  if (!it) {
    return it;
  } if (Array.isArray(it)) {
    if (it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number') {
      return [it[1], it[0]];
    }
    return it.map((it) => reverseCoordinates(it));
  }
  return {
    ...it,
    coordinates: reverseCoordinates(it.coordinates),
  };
};

export const geofenceToFeature = (theme, item) => {
  let geometry;
  if (item.area.indexOf('CIRCLE') > -1) {
    const coordinates = item.area.replace(/CIRCLE|\(|\)|,/g, ' ').trim().split(/ +/);
    const options = { steps: 32, units: 'meters' };
    const polygon = circle([Number(coordinates[1]), Number(coordinates[0])], Number(coordinates[2]), options);
    geometry = polygon.geometry;
  } else {
    geometry = reverseCoordinates(parse(item.area));
  }
  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes.color || theme.palette.geometry.main,
    },
  };
};

export const geometryToArea = (geometry) => stringify(reverseCoordinates(geometry));

export const findFonts = (map) => {
  const { glyphs } = map.getStyle();
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
};
