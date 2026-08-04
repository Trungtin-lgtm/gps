export const TIMELINE_STATUS = Object.freeze({
  MOVING: 'moving',
  STATIONARY: 'stationary',
  OFFLINE: 'offline',
});

const OFFLINE_EVENT_TYPES = new Set(['deviceOffline', 'deviceUnknown']);
const STATUS_EVENT_TYPES = new Set([
  ...OFFLINE_EVENT_TYPES,
  'deviceOnline',
  'deviceMoving',
  'deviceStopped',
]);

const STATUS_PRIORITY = {
  [TIMELINE_STATUS.OFFLINE]: 3,
  [TIMELINE_STATUS.MOVING]: 2,
  [TIMELINE_STATUS.STATIONARY]: 1,
};

export const normalizeTimestamp = (value) => {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    const timestamp = Number.isFinite(numericValue) ? numericValue : Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  return null;
};

const readTimestamp = (item, keys) => (
  keys
    .map((key) => normalizeTimestamp(item?.[key]))
    .find((timestamp) => timestamp !== null) ?? null
);

const normalizeDeviceId = (deviceId) => (
  deviceId === null || deviceId === undefined ? '' : String(deviceId)
);

const compareText = (first, second) => String(first ?? '').localeCompare(String(second ?? ''));

const getItemIdentity = (item) => [
  item?.id,
  item?.positionId,
  item?.startPositionId,
  item?.endPositionId,
].map((value) => value ?? '').join(':');

const compareItems = (first, second) => (
  (first.timestamp - second.timestamp)
  || compareText(first.item?.type, second.item?.type)
  || compareText(getItemIdentity(first.item), getItemIdentity(second.item))
);

const normalizeEvent = ({ item, timestamp }) => ({
  ...item,
  eventTime: new Date(timestamp).toISOString(),
  eventTimestamp: timestamp,
});

const createCandidate = ({
  status,
  source,
  sourceItem,
  deviceId,
  startTimestamp,
  endTimestamp,
  fromTimestamp,
  toTimestamp,
  stateEvents = [],
}) => {
  if (startTimestamp === null || endTimestamp === null) {
    return null;
  }
  const clippedStart = Math.max(startTimestamp, fromTimestamp);
  const clippedEnd = Math.min(endTimestamp, toTimestamp);
  if (clippedStart >= clippedEnd) {
    return null;
  }
  return {
    status,
    source,
    sourceItem,
    deviceId,
    startTimestamp: clippedStart,
    endTimestamp: clippedEnd,
    stateEvents,
    identity: [
      source,
      normalizeDeviceId(deviceId),
      status,
      startTimestamp,
      endTimestamp,
      getItemIdentity(sourceItem),
    ].join(':'),
  };
};

const createReportCandidates = ({
  trips,
  stops,
  fromTimestamp,
  toTimestamp,
}) => {
  const candidates = [];
  const addCandidate = (item, status, source) => {
    let startTimestamp = readTimestamp(item, ['startTime']);
    let endTimestamp = readTimestamp(item, ['endTime']);
    const duration = Number(item?.duration);
    if (startTimestamp !== null && endTimestamp === null && Number.isFinite(duration)) {
      endTimestamp = startTimestamp + duration;
    } else if (startTimestamp === null && endTimestamp !== null && Number.isFinite(duration)) {
      startTimestamp = endTimestamp - duration;
    }
    const candidate = createCandidate({
      status,
      source,
      sourceItem: item,
      deviceId: item?.deviceId,
      startTimestamp,
      endTimestamp,
      fromTimestamp,
      toTimestamp,
    });
    if (candidate) {
      candidates.push(candidate);
    }
  };

  trips.forEach((item) => addCandidate(item, TIMELINE_STATUS.MOVING, 'trip'));
  stops.forEach((item) => addCandidate(item, TIMELINE_STATUS.STATIONARY, 'stop'));
  return candidates;
};

const readMotion = (position) => {
  const motion = position?.attributes?.motion;
  if (typeof motion === 'boolean') {
    return motion;
  }
  if (typeof motion === 'number') {
    return motion !== 0;
  }
  if (typeof motion === 'string') {
    const normalized = motion.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  const speed = Number(position?.speed);
  return Number.isFinite(speed) && speed > 0;
};

const createPositionCandidates = ({
  positions,
  reportCandidates,
  fromTimestamp,
  toTimestamp,
}) => {
  const devicesWithReports = new Set(
    reportCandidates.map((candidate) => normalizeDeviceId(candidate.deviceId)),
  );
  const positionsByDevice = new Map();

  positions.forEach((position) => {
    const timestamp = readTimestamp(position, ['fixTime', 'deviceTime', 'serverTime', 'time']);
    const deviceKey = normalizeDeviceId(position?.deviceId);
    if (
      timestamp !== null
      && timestamp >= fromTimestamp
      && timestamp <= toTimestamp
      && !devicesWithReports.has(deviceKey)
    ) {
      if (!positionsByDevice.has(deviceKey)) {
        positionsByDevice.set(deviceKey, []);
      }
      positionsByDevice.get(deviceKey).push({ item: position, timestamp });
    }
  });

  const candidates = [];
  positionsByDevice.forEach((devicePositions) => {
    devicePositions.sort(compareItems);
    let current = null;

    devicePositions.forEach(({ item, timestamp }) => {
      const status = readMotion(item)
        ? TIMELINE_STATUS.MOVING
        : TIMELINE_STATUS.STATIONARY;
      if (!current) {
        current = { status, sourceItem: item, startTimestamp: timestamp };
      } else if (current.status !== status) {
        const candidate = createCandidate({
          status: current.status,
          source: 'position',
          sourceItem: current.sourceItem,
          deviceId: current.sourceItem?.deviceId,
          startTimestamp: current.startTimestamp,
          endTimestamp: timestamp,
          fromTimestamp,
          toTimestamp,
        });
        if (candidate) {
          candidates.push(candidate);
        }
        current = { status, sourceItem: item, startTimestamp: timestamp };
      }
    });

    if (current) {
      const candidate = createCandidate({
        status: current.status,
        source: 'position',
        sourceItem: current.sourceItem,
        deviceId: current.sourceItem?.deviceId,
        startTimestamp: current.startTimestamp,
        endTimestamp: toTimestamp,
        fromTimestamp,
        toTimestamp,
      });
      if (candidate) {
        candidates.push(candidate);
      }
    }
  });

  return candidates;
};

const createOfflineCandidates = ({
  events,
  fromTimestamp,
  toTimestamp,
}) => {
  const eventsByDevice = new Map();

  events.forEach((event) => {
    if (OFFLINE_EVENT_TYPES.has(event?.type) || event?.type === 'deviceOnline') {
      const timestamp = readTimestamp(event, ['eventTime', 'time', 'serverTime', 'fixTime']);
      if (timestamp !== null && timestamp <= toTimestamp) {
        const deviceKey = normalizeDeviceId(event?.deviceId);
        if (!eventsByDevice.has(deviceKey)) {
          eventsByDevice.set(deviceKey, []);
        }
        eventsByDevice.get(deviceKey).push({ item: event, timestamp });
      }
    }
  });

  const candidates = [];
  eventsByDevice.forEach((deviceEvents) => {
    deviceEvents.sort(compareItems);
    let openingEvent = null;

    deviceEvents.forEach((event) => {
      if (OFFLINE_EVENT_TYPES.has(event.item.type)) {
        if (!openingEvent) {
          openingEvent = event;
        }
      } else if (openingEvent) {
        const candidate = createCandidate({
          status: TIMELINE_STATUS.OFFLINE,
          source: 'event',
          sourceItem: openingEvent.item,
          deviceId: openingEvent.item?.deviceId,
          startTimestamp: openingEvent.timestamp,
          endTimestamp: event.timestamp,
          fromTimestamp,
          toTimestamp,
          stateEvents: [normalizeEvent(openingEvent), normalizeEvent(event)],
        });
        if (candidate) {
          candidates.push(candidate);
        }
        openingEvent = null;
      }
    });

    if (openingEvent) {
      const candidate = createCandidate({
        status: TIMELINE_STATUS.OFFLINE,
        source: 'event',
        sourceItem: openingEvent.item,
        deviceId: openingEvent.item?.deviceId,
        startTimestamp: openingEvent.timestamp,
        endTimestamp: toTimestamp,
        fromTimestamp,
        toTimestamp,
        stateEvents: [normalizeEvent(openingEvent)],
      });
      if (candidate) {
        candidates.push(candidate);
      }
    }
  });

  return candidates;
};

const compareCandidates = (first, second) => (
  (STATUS_PRIORITY[second.status] - STATUS_PRIORITY[first.status])
  || (first.startTimestamp - second.startTimestamp)
  || (first.endTimestamp - second.endTimestamp)
  || compareText(first.identity, second.identity)
);

const resolveCandidates = (candidates) => {
  const candidatesByDevice = new Map();
  candidates.forEach((candidate) => {
    const deviceKey = normalizeDeviceId(candidate.deviceId);
    if (!candidatesByDevice.has(deviceKey)) {
      candidatesByDevice.set(deviceKey, []);
    }
    candidatesByDevice.get(deviceKey).push(candidate);
  });

  const segments = [];
  candidatesByDevice.forEach((deviceCandidates) => {
    const boundaries = [...new Set(
      deviceCandidates.flatMap((candidate) => [
        candidate.startTimestamp,
        candidate.endTimestamp,
      ]),
    )].sort((first, second) => first - second);

    boundaries.slice(0, -1).forEach((startTimestamp, index) => {
      const endTimestamp = boundaries[index + 1];
      const active = deviceCandidates
        .filter((candidate) => (
          candidate.startTimestamp <= startTimestamp
          && candidate.endTimestamp >= endTimestamp
        ))
        .sort(compareCandidates);
      if (!active.length || startTimestamp >= endTimestamp) {
        return;
      }

      const winner = active[0];
      const previous = segments[segments.length - 1];
      if (
        previous
        && previous.candidate === winner
        && previous.endTimestamp === startTimestamp
      ) {
        previous.endTimestamp = endTimestamp;
      } else {
        segments.push({
          candidate: winner,
          startTimestamp,
          endTimestamp,
        });
      }
    });
  });

  return segments.map(({ candidate, startTimestamp, endTimestamp }) => ({
    key: [
      normalizeDeviceId(candidate.deviceId),
      candidate.status,
      startTimestamp,
      endTimestamp,
    ].join(':'),
    status: candidate.status,
    deviceId: candidate.deviceId,
    startTime: new Date(startTimestamp).toISOString(),
    endTime: new Date(endTimestamp).toISOString(),
    startTimestamp,
    endTimestamp,
    duration: endTimestamp - startTimestamp,
    events: [],
    stateEvents: candidate.stateEvents,
    source: candidate.source,
    sourceItem: candidate.sourceItem,
  }));
};

const compareRows = (first, second) => (
  (first.startTimestamp - second.startTimestamp)
  || compareText(normalizeDeviceId(first.deviceId), normalizeDeviceId(second.deviceId))
  || (first.endTimestamp - second.endTimestamp)
  || (STATUS_PRIORITY[second.status] - STATUS_PRIORITY[first.status])
  || compareText(first.key, second.key)
);

const findRowAtTimestamp = (rows, timestamp) => {
  let low = 0;
  let high = rows.length - 1;
  let result = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (rows[middle].startTimestamp <= timestamp) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  if (result >= 0 && timestamp < rows[result].endTimestamp) {
    return rows[result];
  }
  if (
    result >= 0
    && result === rows.length - 1
    && timestamp === rows[result].endTimestamp
  ) {
    return rows[result];
  }
  return null;
};

const attachBusinessEvents = ({
  rows,
  events,
  fromTimestamp,
  toTimestamp,
}) => {
  const rowsByDevice = new Map();
  rows.forEach((row) => {
    const deviceKey = normalizeDeviceId(row.deviceId);
    if (!rowsByDevice.has(deviceKey)) {
      rowsByDevice.set(deviceKey, []);
    }
    rowsByDevice.get(deviceKey).push(row);
  });
  rowsByDevice.forEach((deviceRows) => deviceRows.sort(compareRows));

  events
    .filter((event) => !STATUS_EVENT_TYPES.has(event?.type))
    .map((item) => ({
      item,
      timestamp: readTimestamp(item, ['eventTime', 'time', 'serverTime', 'fixTime']),
    }))
    .filter(({ timestamp }) => (
      timestamp !== null
      && timestamp >= fromTimestamp
      && timestamp <= toTimestamp
    ))
    .sort(compareItems)
    .forEach((event) => {
      const deviceRows = rowsByDevice.get(normalizeDeviceId(event.item?.deviceId)) || [];
      const row = findRowAtTimestamp(deviceRows, event.timestamp);
      if (row) {
        row.events.push(normalizeEvent(event));
      }
    });
};

/**
 * Builds a chronological device-status timeline without mutating any input.
 *
 * Report trips/stops are preferred. Positions are used only for devices that
 * have no valid report interval in the requested range. Offline/unknown events
 * override every motion interval until the following online event (or `to`).
 */
const buildStatusTimeline = ({
  trips = [],
  stops = [],
  events = [],
  positions = [],
  from,
  to,
} = {}) => {
  const fromTimestamp = normalizeTimestamp(from);
  const toTimestamp = normalizeTimestamp(to);
  if (
    fromTimestamp === null
    || toTimestamp === null
    || fromTimestamp >= toTimestamp
  ) {
    return [];
  }

  const reportCandidates = createReportCandidates({
    trips,
    stops,
    fromTimestamp,
    toTimestamp,
  });
  const positionCandidates = createPositionCandidates({
    positions,
    reportCandidates,
    fromTimestamp,
    toTimestamp,
  });
  const offlineCandidates = createOfflineCandidates({
    events,
    fromTimestamp,
    toTimestamp,
  });
  const rows = resolveCandidates([
    ...reportCandidates,
    ...positionCandidates,
    ...offlineCandidates,
  ]).sort(compareRows);

  attachBusinessEvents({
    rows,
    events,
    fromTimestamp,
    toTimestamp,
  });
  return rows;
};

export default buildStatusTimeline;
