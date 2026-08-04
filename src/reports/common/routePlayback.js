export const ROUTE_STATUS = Object.freeze({
  MOVING: 'moving',
  STATIONARY: 'stationary',
  OFFLINE: 'offline',
});

// Kept in one place so the browser uses the same visual filtering rule for
// the route, the timeline and replay. The authoritative server-side filter
// should use the same value when it is added to the backend.
export const GPS_NOISE_RADIUS_METERS = 30;

const DEFAULT_OFFLINE_TIMEOUT_MS = 60 * 1000;
const DEFAULT_MAX_ACCURACY_METERS = 50;
const DEFAULT_MAX_INFERRED_SPEED_KPH = 160;
const DEFAULT_JUMP_RETURN_WINDOW_MS = 2 * 60 * 1000;
const MOVEMENT_CONFIRMATION_COUNT = 2;
const EARTH_RADIUS_METERS = 6371000;
const MOTION_SENSOR_KEYS = ['motion', 'ignition', 'rpm', 'throttle', 'acceleration'];
const ROUTE_ANALYSIS_VERSION = 1;

export const ROUTE_ANALYSIS_REASON = Object.freeze({
  INVALID_POSITION: 'invalid-position',
  POOR_ACCURACY: 'poor-accuracy',
  NON_INCREASING_TIME: 'non-increasing-time',
  IMPOSSIBLE_SPEED: 'impossible-speed',
  JUMP_RETURN: 'jump-return',
});

export const routeTimestamp = (position) => {
  const value = position?.fixTime
    ?? position?.deviceTime
    ?? position?.serverTime
    ?? position?.time;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const receivedTimestamp = (position) => {
  const value = position?.serverTime
    ?? position?.fixTime
    ?? position?.deviceTime
    ?? position?.time;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const validPosition = (position) => {
  const latitude = Number(position?.latitude);
  const longitude = Number(position?.longitude);
  return (
    position?.valid !== false
    && Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && (latitude !== 0 || longitude !== 0)
    && routeTimestamp(position) !== null
  );
};

export const distanceInMeters = (first, second) => {
  if (!validPosition(first) || !validPosition(second)) {
    return 0;
  }
  const latitudeDelta = (Number(second.latitude) - Number(first.latitude)) * (Math.PI / 180);
  const longitudeDelta = (Number(second.longitude) - Number(first.longitude)) * (Math.PI / 180);
  const firstLatitude = Number(first.latitude) * (Math.PI / 180);
  const secondLatitude = Number(second.latitude) * (Math.PI / 180);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const booleanValue = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return null;
};

const sensorValue = (position, key) => {
  const value = position?.attributes?.[key];
  if (key === 'motion' || key === 'ignition') {
    return booleanValue(value);
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const sensorChanged = (first, second) => MOTION_SENSOR_KEYS.some((key) => {
  const previous = sensorValue(first, key);
  const current = sensorValue(second, key);
  return previous !== null && current !== null && previous !== current;
});

const sensorIndicatesMovement = (position) => {
  if (sensorValue(position, 'motion') === true) {
    return true;
  }
  const speed = Number(position?.speed);
  return Number.isFinite(speed) && speed > 0;
};

const positiveDeviceSetting = (device, key, fallback) => {
  const value = Number(device?.attributes?.[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const analysisSettings = (device) => ({
  maxAccuracyMeters: positiveDeviceSetting(
    device,
    'gpsMaxAccuracyMeters',
    DEFAULT_MAX_ACCURACY_METERS,
  ),
  maxInferredSpeedKph: positiveDeviceSetting(
    device,
    'gpsMaxSpeedKph',
    DEFAULT_MAX_INFERRED_SPEED_KPH,
  ),
  jumpReturnWindowMs: positiveDeviceSetting(
    device,
    'gpsJumpReturnWindowMs',
    DEFAULT_JUMP_RETURN_WINDOW_MS,
  ),
});

const clonePosition = (position, index) => ({
  ...position,
  id: position.id ?? `${position.deviceId}:${routeTimestamp(position)}:${index}`,
  latitude: Number(position.latitude),
  longitude: Number(position.longitude),
  attributes: position.attributes || {},
});

const withAnalysis = (position, analysis) => ({
  ...position,
  attributes: {
    ...position.attributes,
    routeAnalysis: {
      version: ROUTE_ANALYSIS_VERSION,
      ...analysis,
    },
  },
});

const positionAccuracy = (position) => {
  const value = Number(position?.accuracy);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const inferredSpeedKph = (first, second) => {
  const elapsedMs = routeTimestamp(second) - routeTimestamp(first);
  if (elapsedMs <= 0) {
    return null;
  }
  return (distanceInMeters(first, second) / (elapsedMs / 1000)) * 3.6;
};

const markNoise = (position, reason, details = {}) => withAnalysis(position, {
  valid: false,
  noise: true,
  status: 'noise',
  reason,
  ...details,
});

const markClean = (position, details = {}) => withAnalysis(position, {
  valid: true,
  noise: false,
  reason: null,
  ...details,
});

const preliminaryAnalysis = (positions, settings) => positions.map((position) => {
  if (!validPosition(position)) {
    return markNoise(position, ROUTE_ANALYSIS_REASON.INVALID_POSITION);
  }

  const accuracy = positionAccuracy(position);
  if (accuracy !== null && accuracy > settings.maxAccuracyMeters) {
    return markNoise(position, ROUTE_ANALYSIS_REASON.POOR_ACCURACY, {
      accuracy,
      maxAccuracyMeters: settings.maxAccuracyMeters,
    });
  }

  return markClean(position, { accuracy });
});

const markJumpReturnNoise = (positions, settings) => positions.map((position, index) => {
  if (position.attributes.routeAnalysis.noise || index === 0 || index === positions.length - 1) {
    return position;
  }

  const previous = positions[index - 1];
  const next = positions[index + 1];
  if (
    previous.attributes.routeAnalysis.noise
    || next.attributes.routeAnalysis.noise
    || sensorIndicatesMovement(position)
  ) {
    return position;
  }

  const elapsedMs = routeTimestamp(next) - routeTimestamp(previous);
  const distanceFromPrevious = distanceInMeters(previous, position);
  const distanceToNext = distanceInMeters(position, next);
  const returnDistance = distanceInMeters(previous, next);

  if (
    elapsedMs > 0
    && elapsedMs <= settings.jumpReturnWindowMs
    && distanceFromPrevious >= GPS_NOISE_RADIUS_METERS
    && distanceToNext >= GPS_NOISE_RADIUS_METERS
    && returnDistance < GPS_NOISE_RADIUS_METERS
  ) {
    return markNoise(position, ROUTE_ANALYSIS_REASON.JUMP_RETURN, {
      distanceFromPrevious,
      distanceToNext,
      returnDistance,
    });
  }

  return position;
});

const markSequentialNoise = (positions, settings) => {
  let previousClean = null;

  return positions.map((position) => {
    if (position.attributes.routeAnalysis.noise) {
      return position;
    }
    if (!previousClean) {
      previousClean = position;
      return position;
    }

    const elapsedMs = routeTimestamp(position) - routeTimestamp(previousClean);
    if (elapsedMs <= 0) {
      return markNoise(position, ROUTE_ANALYSIS_REASON.NON_INCREASING_TIME, {
        elapsedMs,
      });
    }

    const distanceFromPrevious = distanceInMeters(previousClean, position);
    const calculatedSpeedKph = inferredSpeedKph(previousClean, position);
    if (
      calculatedSpeedKph !== null
      && calculatedSpeedKph > settings.maxInferredSpeedKph
    ) {
      return markNoise(position, ROUTE_ANALYSIS_REASON.IMPOSSIBLE_SPEED, {
        distanceFromPrevious,
        calculatedSpeedKph,
        maxInferredSpeedKph: settings.maxInferredSpeedKph,
      });
    }

    const analyzed = markClean(position, {
      distanceFromPrevious,
      calculatedSpeedKph,
    });
    previousClean = analyzed;
    return analyzed;
  });
};

export const analyzeRoutePositions = ({
  positions = [],
  device,
}) => {
  const settings = analysisSettings(device);
  const sourcePositions = positions
    .map(clonePosition)
    .sort((first, second) => {
      const firstTimestamp = routeTimestamp(first);
      const secondTimestamp = routeTimestamp(second);
      if (firstTimestamp === null && secondTimestamp === null) {
        return 0;
      }
      if (firstTimestamp === null) {
        return 1;
      }
      if (secondTimestamp === null) {
        return -1;
      }
      return firstTimestamp - secondTimestamp;
    });
  const preliminary = preliminaryAnalysis(sourcePositions, settings);
  const withoutJumpReturns = markJumpReturnNoise(preliminary, settings);
  const analyzedPositions = markSequentialNoise(withoutJumpReturns, settings);

  return {
    rawPositions: sourcePositions,
    analyzedPositions,
    cleanPositions: analyzedPositions.filter(
      (position) => !position.attributes.routeAnalysis.noise,
    ),
    noisePositions: analyzedPositions.filter(
      (position) => position.attributes.routeAnalysis.noise,
    ),
    settings,
  };
};

const createCluster = (position, index) => ({
  anchor: position,
  positions: [position],
  latitudeSum: Number(position.latitude),
  longitudeSum: Number(position.longitude),
  index,
});

const addToCluster = (cluster, position) => {
  cluster.positions.push(position);
  cluster.latitudeSum += Number(position.latitude);
  cluster.longitudeSum += Number(position.longitude);
};

const clusterRepresentative = (cluster) => {
  const last = cluster.positions.at(-1);
  return {
    ...last,
    id: `cluster:${last.deviceId}:${cluster.index}:${routeTimestamp(last)}`,
    latitude: cluster.latitudeSum / cluster.positions.length,
    longitude: cluster.longitudeSum / cluster.positions.length,
    attributes: {
      ...last.attributes,
      routeCluster: true,
      routeClusterIndex: cluster.index,
      sampleCount: cluster.positions.length,
      startTime: cluster.positions[0].fixTime,
      lastTime: last.fixTime,
    },
  };
};

const createClusters = (positions) => {
  const clusters = [];
  positions.forEach((position) => {
    const cluster = clusters.at(-1);
    if (!cluster || distanceInMeters(cluster.anchor, position) >= GPS_NOISE_RADIUS_METERS) {
      clusters.push(createCluster(position, clusters.length));
    } else {
      addToCluster(cluster, position);
    }
  });
  return clusters;
};

const confirmedClusterIndexes = (clusters) => {
  const indexes = new Set(clusters.length ? [0] : []);
  let candidateCount = 0;
  let movingConfirmed = false;
  let candidateSensorEvidence = false;

  for (let index = 1; index < clusters.length; index += 1) {
    const previous = clusters[index - 1].positions.at(-1);
    const current = clusters[index].positions[0];
    const distance = distanceInMeters(previous, current);
    const sensorEvidence = sensorIndicatesMovement(current) || sensorChanged(previous, current);

    if (distance < GPS_NOISE_RADIUS_METERS) {
      candidateCount = 0;
      movingConfirmed = false;
      candidateSensorEvidence = false;
    } else {
      candidateCount += 1;
      candidateSensorEvidence = candidateSensorEvidence || sensorEvidence;
      const continuityAnchor = clusters[Math.max(
        0,
        index - MOVEMENT_CONFIRMATION_COUNT,
      )].anchor;
      const hasSpatialContinuity = candidateCount >= MOVEMENT_CONFIRMATION_COUNT
        && distanceInMeters(continuityAnchor, current) >= GPS_NOISE_RADIUS_METERS;

      // A single jump is never enough. Confirm after two consecutive spatial
      // samples, supported either by sensor evidence or by continued GPS travel.
      if (
        candidateCount >= MOVEMENT_CONFIRMATION_COUNT
        && (candidateSensorEvidence || hasSpatialContinuity)
      ) {
        movingConfirmed = true;
        const firstConfirmedIndex = Math.max(0, index - MOVEMENT_CONFIRMATION_COUNT);
        for (
          let confirmedIndex = firstConfirmedIndex;
          confirmedIndex <= index;
          confirmedIndex += 1
        ) {
          indexes.add(confirmedIndex);
        }
      } else if (movingConfirmed) {
        indexes.add(index);
      }

      if (movingConfirmed) {
        indexes.add(index);
      }
    }
  }

  const lastIndex = clusters.length - 1;
  if (lastIndex > 0 && (movingConfirmed || clusters[lastIndex].positions.length > 1)) {
    indexes.add(lastIndex);
  }
  return indexes;
};

const offlineTimeout = (device) => {
  const configured = Number(
    device?.attributes?.offlineTimeoutMs ?? device?.attributes?.offlineTimeout,
  );
  if (Number.isFinite(configured) && configured > 0) {
    return configured < 1000 ? configured * 1000 : configured;
  }
  return DEFAULT_OFFLINE_TIMEOUT_MS;
};

const isOffline = ({ device, latestPosition, now }) => {
  const serverStatus = String(device?.status || '').toLowerCase();
  if (serverStatus === 'offline' || serverStatus === 'unknown') {
    return true;
  }
  const latestReceived = receivedTimestamp(latestPosition);
  return latestReceived === null || now - latestReceived > offlineTimeout(device);
};

const currentStatus = ({ clusters, device, latestPosition, now }) => {
  if (isOffline({ device, latestPosition, now })) {
    return ROUTE_STATUS.OFFLINE;
  }
  if (clusters.length < 2) {
    return ROUTE_STATUS.STATIONARY;
  }

  const lastCluster = clusters.at(-1);
  const previousCluster = clusters.at(-2);
  const previous = previousCluster.positions.at(-1);
  const current = lastCluster.positions.at(-1);
  const lastDistance = distanceInMeters(previous, current);
  const confirmed = confirmedClusterIndexes(clusters);
  const currentMotion = sensorIndicatesMovement(current);

  // A transition from motion=true to motion=false is a sensor change, but it
  // is evidence that the device has stopped, not that it is still moving.
  // Repeated samples inside the same sub-30 m cluster therefore take
  // precedence over the preceding moving cluster.
  if (lastCluster.positions.length > 1 && !currentMotion) {
    return ROUTE_STATUS.STATIONARY;
  }
  if (lastDistance >= GPS_NOISE_RADIUS_METERS && confirmed.has(clusters.length - 1)) {
    return ROUTE_STATUS.MOVING;
  }
  return ROUTE_STATUS.STATIONARY;
};

const appendLatestPosition = (positions, livePosition) => {
  if (!validPosition(livePosition)) {
    return positions;
  }
  const latest = positions.at(-1);
  if (latest && routeTimestamp(livePosition) <= routeTimestamp(latest)) {
    return positions;
  }
  return [...positions, clonePosition(livePosition, positions.length)]
    .sort((first, second) => routeTimestamp(first) - routeTimestamp(second));
};

export const prepareDeviceRoute = ({
  positions = [],
  device,
  livePosition,
  now = Date.now(),
}) => {
  const historyAnalysis = analyzeRoutePositions({ positions, device });
  // Report positions are the historical truth for the selected time range.
  // A newer live position is used only to calculate the current device status;
  // appending it to the report would draw a false straight line from the end of
  // the selected history to the device's current location.
  const historyPositions = historyAnalysis.cleanPositions;
  const statusSourcePositions = appendLatestPosition(
    historyAnalysis.rawPositions.filter(validPosition),
    livePosition,
  );
  const statusAnalysis = analyzeRoutePositions({
    positions: statusSourcePositions,
    device,
  });
  const statusPositions = statusAnalysis.cleanPositions;
  const clusters = createClusters(historyPositions);
  const statusClusters = createClusters(statusPositions);
  const confirmed = confirmedClusterIndexes(clusters);
  const representatives = clusters.map(clusterRepresentative);
  let previousVisible = representatives[0];
  const replayPositions = clusters.flatMap((cluster, index) => {
    const priorVisible = previousVisible;
    if (confirmed.has(index)) {
      previousVisible = representatives[index];
    }
    const movedFromPrior = index > 0
      && confirmed.has(index)
      && distanceInMeters(priorVisible, previousVisible) >= GPS_NOISE_RADIUS_METERS;
    const clusterHasMotion = cluster.positions.some(sensorIndicatesMovement);
    const routeStatus = movedFromPrior
      && (cluster.positions.length === 1 || clusterHasMotion)
      ? ROUTE_STATUS.MOVING
      : ROUTE_STATUS.STATIONARY;

    return cluster.positions.map((position) => ({
      ...position,
      latitude: previousVisible.latitude,
      longitude: previousVisible.longitude,
      attributes: {
        ...position.attributes,
        routeAnalysis: {
          ...position.attributes.routeAnalysis,
          status: routeStatus,
        },
        routeCluster: true,
        routeClusterIndex: index,
        routeDisplayClusterIndex: previousVisible.attributes.routeClusterIndex,
        routeStatus,
        sampleCount: cluster.positions.length,
        startTime: cluster.positions[0].fixTime,
        lastTime: cluster.positions.at(-1).fixTime,
      },
    }));
  });
  const displayPositions = representatives.filter((_, index) => confirmed.has(index));
  const latestPosition = statusPositions.at(-1);

  return {
    rawPositions: historyAnalysis.rawPositions,
    analyzedPositions: historyAnalysis.analyzedPositions,
    noisePositions: historyAnalysis.noisePositions,
    replayPositions,
    displayPositions,
    status: currentStatus({
      clusters: statusClusters,
      device,
      latestPosition,
      now,
    }),
    lastPosition: latestPosition || null,
  };
};

export const prepareDeviceRoutes = ({
  positions = [],
  devices = {},
  livePositions = {},
  now = Date.now(),
}) => {
  const byDevice = new Map();
  positions.forEach((position) => {
    if (!byDevice.has(position.deviceId)) {
      byDevice.set(position.deviceId, []);
    }
    byDevice.get(position.deviceId).push(position);
  });

  return [...byDevice.entries()]
    .map(([deviceId, devicePositions]) => ({
      deviceId,
      key: `device:${deviceId}`,
      ...prepareDeviceRoute({
        positions: devicePositions,
        device: devices[deviceId],
        livePosition: livePositions[deviceId],
        now,
      }),
    }))
    .sort((first, second) => (
      String(devices[first.deviceId]?.name || first.deviceId)
        .localeCompare(String(devices[second.deviceId]?.name || second.deviceId))
    ));
};
