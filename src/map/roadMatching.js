const PUBLIC_OSRM_URL = 'https://router.project-osrm.org';
const LOCAL_OSRM_PROXY_URL = '/osrm';
const PUBLIC_MAX_COORDINATES_PER_REQUEST = 10;
const PRIVATE_MAX_COORDINATES_PER_REQUEST = 80;
const CHUNK_OVERLAP = 2;
const MAX_MATCH_DISTANCE_METERS = 30;
const MIN_MATCH_CONFIDENCE = 0.5;
const CACHE_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 6000;

const resultCache = new Map();

const providerUrl = () => {
  const configuredUrl = import.meta.env?.VITE_OSRM_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (
    typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  ) {
    return LOCAL_OSRM_PROXY_URL;
  }

  return null;
};

const validPositions = (positions = []) => positions.reduce((result, position, sourceIndex) => {
  const latitude = Number(position.latitude);
  const longitude = Number(position.longitude);
  const previous = result[result.length - 1];

  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
    || (previous?.latitude === latitude && previous?.longitude === longitude)
  ) {
    return result;
  }

  result.push({
    ...position,
    latitude,
    longitude,
    sourceIndex,
  });
  return result;
}, []);

const coordinateString = (positions) => positions
  .map((position) => `${position.longitude.toFixed(6)},${position.latitude.toFixed(6)}`)
  .join(';');

const positionTimestampSeconds = (position) => {
  const value = position.fixTime
    ?? position.deviceTime
    ?? position.serverTime
    ?? position.time;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
};

const timestampQuery = (positions) => {
  const timestamps = positions.map(positionTimestampSeconds);
  const strictlyIncreasing = timestamps.every((timestamp, index) => (
    timestamp !== null
    && (index === 0 || timestamp > timestamps[index - 1])
  ));
  return strictlyIncreasing ? `&timestamps=${timestamps.join(';')}` : '';
};

const distanceMeters = (first, second) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude)
      * Math.cos(secondLatitude)
      * Math.sin(longitudeDelta / 2) ** 2
  );
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const fetchJson = async (url, signal) => {
  const requestController = new AbortController();
  const abortRequest = () => requestController.abort();
  const timeout = setTimeout(abortRequest, REQUEST_TIMEOUT_MS);
  signal?.addEventListener('abort', abortRequest, { once: true });

  try {
    const response = await fetch(url, { signal: requestController.signal });
    if (!response.ok) {
      throw Error(`OSRM ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 'Ok') {
      throw Error(data.message || data.code || 'OSRM error');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError' && !signal?.aborted) {
      throw Error('OSRM request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
};

const createSnappedPosition = (position, location, details = {}) => ({
  ...position,
  longitude: Number(location[0]),
  latitude: Number(location[1]),
  roadMatched: true,
  ...details,
});

const matchChunk = async (baseUrl, positions, signal) => {
  const coordinates = coordinateString(positions);
  const radiuses = positions.map(() => MAX_MATCH_DISTANCE_METERS).join(';');
  // Keep one tracepoint per source sample. OSRM's tidy=true is useful for
  // repairing malformed traces, but it can remove/reorder samples and would
  // desynchronise the route dots and replay marker.
  const query = `overview=full&geometries=geojson&tidy=false&gaps=split&radiuses=${
    radiuses
  }${timestampQuery(positions)}`;
  const url = `${baseUrl}/match/v1/driving/${coordinates}?${query}`;
  const data = await fetchJson(url, signal);
  const matchings = data.matchings || [];
  const tracepoints = data.tracepoints || [];

  const acceptedMatchingIndexes = new Set();
  matchings.forEach((matching, matchingIndex) => {
    const matchingTracepoints = tracepoints
      .map((tracepoint, tracepointIndex) => ({ tracepoint, tracepointIndex }))
      .filter(({ tracepoint }) => tracepoint?.matchings_index === matchingIndex);
    const confidence = Number(matching.confidence);
    const geometry = matching.geometry?.coordinates;
    const allTracepointsValid = matchingTracepoints.length >= 2
      && matchingTracepoints.every(({ tracepoint, tracepointIndex }) => {
        const { location } = tracepoint;
        return Array.isArray(location)
          && location.length >= 2
          && distanceMeters(positions[tracepointIndex], {
            longitude: Number(location[0]),
            latitude: Number(location[1]),
          }) <= MAX_MATCH_DISTANCE_METERS;
      });

    if (
      Number.isFinite(confidence)
      && confidence >= MIN_MATCH_CONFIDENCE
      && geometry?.length > 1
      && allTracepointsValid
    ) {
      acceptedMatchingIndexes.add(matchingIndex);
    }
  });

  const geometries = matchings
    .filter((matching, matchingIndex) => acceptedMatchingIndexes.has(matchingIndex))
    .map((matching) => matching.geometry.coordinates);
  const snappedPositions = tracepoints
    .map((tracepoint, tracepointIndex) => {
      if (
        !tracepoint
        || !acceptedMatchingIndexes.has(tracepoint.matchings_index)
        || !Array.isArray(tracepoint.location)
      ) {
        return null;
      }
      const { [tracepoint.matchings_index]: matching } = matchings;
      const snappedCoordinate = {
        longitude: Number(tracepoint.location[0]),
        latitude: Number(tracepoint.location[1]),
      };
      return createSnappedPosition(positions[tracepointIndex], tracepoint.location, {
        matchDistance: distanceMeters(positions[tracepointIndex], snappedCoordinate),
        matchConfidence: Number(matching.confidence),
      });
    })
    .filter(Boolean);
  const confidences = [...acceptedMatchingIndexes]
    .map((matchingIndex) => Number(matchings[matchingIndex].confidence));

  return {
    geometries,
    snappedPositions,
    confidences,
  };
};

const remember = (key, value) => {
  resultCache.set(key, value);
  if (resultCache.size > CACHE_LIMIT) {
    resultCache.delete(resultCache.keys().next().value);
  }
};

const createChunks = (positions, maxCoordinates) => {
  const chunks = [];
  let start = 0;

  while (start < positions.length - 1) {
    const end = Math.min(start + maxCoordinates, positions.length);
    chunks.push(positions.slice(start, end));
    if (end === positions.length) {
      break;
    }
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
};

const matchPositionsToRoad = async (positions, signal) => {
  const baseUrl = providerUrl();
  const normalizedPositions = validPositions(positions);

  if (!baseUrl) {
    return {
      status: 'unavailable',
      geometries: [],
      snappedPositions: [],
      reason: 'provider-unavailable',
    };
  }
  // Two isolated points are not enough to prove the historical road taken.
  // Never replace a failed/insufficient Match with Route because Route would
  // calculate a new fastest path rather than recover the actual GPS history.
  if (normalizedPositions.length < 3) {
    return {
      status: 'insufficient',
      geometries: [],
      snappedPositions: [],
      reason: 'not-enough-positions-for-map-match',
    };
  }

  const key = `${baseUrl}:${coordinateString(normalizedPositions)}`;
  if (resultCache.has(key)) {
    return resultCache.get(key);
  }

  // Sequential requests avoid flooding public/self-hosted OSRM on long histories.
  const {
    geometries,
    snappedBySourceIndex,
    confidences,
    failedChunks,
  } = await createChunks(
    normalizedPositions,
    [PUBLIC_OSRM_URL, LOCAL_OSRM_PROXY_URL].includes(baseUrl)
      ? PUBLIC_MAX_COORDINATES_PER_REQUEST
      : PRIVATE_MAX_COORDINATES_PER_REQUEST,
  ).reduce(async (previous, chunk) => {
    const accumulator = await previous;
    try {
      const chunkResult = await matchChunk(baseUrl, chunk, signal);
      if (!chunkResult.geometries.length || chunkResult.snappedPositions.length < 2) {
        accumulator.failedChunks += 1;
      } else {
        accumulator.geometries.push(...chunkResult.geometries);
        chunkResult.snappedPositions.forEach((position) => {
          accumulator.snappedBySourceIndex.set(position.sourceIndex, position);
        });
        accumulator.confidences.push(...chunkResult.confidences);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      accumulator.failedChunks += 1;
    }
    return accumulator;
  }, Promise.resolve({
    geometries: [],
    snappedBySourceIndex: new Map(),
    confidences: [],
    failedChunks: 0,
  }));

  const snappedPositions = [...snappedBySourceIndex.values()]
    .sort((first, second) => first.sourceIndex - second.sourceIndex);
  if (!geometries.length || snappedPositions.length < 2) {
    return {
      status: 'failed',
      geometries: [],
      snappedPositions: [],
      reason: 'no-confident-road-match',
      matchedCount: 0,
      totalCount: normalizedPositions.length,
    };
  }

  const complete = failedChunks === 0
    && snappedPositions.length === normalizedPositions.length;
  if (!complete) {
    return {
      status: 'failed',
      geometries: [],
      snappedPositions: [],
      reason: 'incomplete-road-match',
      matchedCount: snappedPositions.length,
      totalCount: normalizedPositions.length,
      failedChunks,
    };
  }

  const result = {
    status: 'matched',
    geometries,
    snappedPositions,
    confidence: confidences.length
      ? Math.min(...confidences)
      : null,
    matchedCount: snappedPositions.length,
    totalCount: normalizedPositions.length,
    failedChunks,
  };

  remember(key, result);
  return result;
};

export default matchPositionsToRoad;
