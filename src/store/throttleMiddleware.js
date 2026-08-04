import { batch } from 'react-redux';

// UI_THROTTLE_COALESCED_PATCH
// This middleware protects the web UI from rendering too often when many GPS
// devices send positions at the same time. The server/database still receives
// all positions; this only coalesces realtime Redux updates shown in the browser.
const interval = 2000;

const mergeById = (items, idField) => {
  const map = new Map();
  items.forEach((item) => {
    if (item && item[idField] !== undefined) {
      map.set(item[idField], item);
    }
  });
  return Array.from(map.values());
};

export default () => (next) => {
  let pendingDevices = [];
  let pendingPositions = [];
  let scheduled = false;

  const flush = () => {
    scheduled = false;

    const devices = pendingDevices;
    const positions = pendingPositions;
    pendingDevices = [];
    pendingPositions = [];

    batch(() => {
      if (devices.length) {
        next({
          type: 'devices/update',
          payload: mergeById(devices, 'id'),
        });
      }
      if (positions.length) {
        next({
          type: 'positions/update',
          payload: mergeById(positions, 'deviceId'),
        });
      }
    });
  };

  return (action) => {
    if (action.type === 'devices/update') {
      pendingDevices.push(...action.payload);
    } else if (action.type === 'positions/update') {
      pendingPositions.push(...action.payload);
    } else {
      return next(action);
    }

    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, interval);
    }

    return null;
  };
};
