import assert from 'node:assert/strict';
import test from 'node:test';
// Node's built-in test runner requires the explicit extension.
/* eslint-disable import/extensions */
import {
  analyzeRoutePositions,
  prepareDeviceRoute,
  ROUTE_ANALYSIS_REASON,
  ROUTE_STATUS,
} from './routePlayback.js';
/* eslint-enable import/extensions */

const startTime = Date.parse('2026-07-28T00:00:00Z');

const position = ({
  index,
  latitude = 20.97,
  longitude = 105.84,
  accuracy = 5,
  speed = 0,
  motion = false,
}) => ({
  id: index + 1,
  deviceId: 1,
  fixTime: new Date(startTime + index * 10000).toISOString(),
  serverTime: new Date(startTime + index * 10000).toISOString(),
  latitude,
  longitude,
  accuracy,
  speed,
  valid: true,
  attributes: { motion },
});

const onlineDevice = {
  id: 1,
  status: 'online',
  attributes: {},
};

test('groups valid stationary samples inside 30 metres and preserves replay timestamps', () => {
  const positions = [
    position({ index: 0 }),
    position({ index: 1, latitude: 20.97008 }),
    position({ index: 2, longitude: 105.84012 }),
  ];

  const result = prepareDeviceRoute({
    positions,
    device: onlineDevice,
    now: startTime + 25000,
  });

  assert.equal(result.status, ROUTE_STATUS.STATIONARY);
  assert.equal(result.displayPositions.length, 1);
  assert.equal(result.replayPositions.length, 3);
  assert.deepEqual(
    result.replayPositions.map((item) => item.fixTime),
    positions.map((item) => item.fixTime),
  );
  assert.equal(result.noisePositions.length, 0);
});

test('removes a jump that immediately returns to the previous 30 metre area', () => {
  const positions = [
    position({ index: 0 }),
    position({ index: 1, longitude: 105.843 }),
    position({ index: 2, longitude: 105.84005 }),
  ];

  const result = prepareDeviceRoute({
    positions,
    device: onlineDevice,
    now: startTime + 25000,
  });

  assert.equal(result.noisePositions.length, 1);
  assert.equal(
    result.noisePositions[0].attributes.routeAnalysis.reason,
    ROUTE_ANALYSIS_REASON.JUMP_RETURN,
  );
  assert.equal(result.replayPositions.length, 2);
  assert.equal(result.displayPositions.length, 1);
});

test('removes a point that implies an impossible vehicle speed', () => {
  const positions = [
    position({ index: 0 }),
    position({ index: 1, latitude: 21.07, motion: true, speed: 50 }),
  ];

  const analysis = analyzeRoutePositions({
    positions,
    device: onlineDevice,
  });

  assert.equal(analysis.cleanPositions.length, 1);
  assert.equal(analysis.noisePositions.length, 1);
  assert.equal(
    analysis.noisePositions[0].attributes.routeAnalysis.reason,
    ROUTE_ANALYSIS_REASON.IMPOSSIBLE_SPEED,
  );
});

test('removes a position whose reported accuracy exceeds the configured limit', () => {
  const positions = [
    position({ index: 0 }),
    position({ index: 1, accuracy: 80 }),
  ];

  const analysis = analyzeRoutePositions({
    positions,
    device: onlineDevice,
  });

  assert.equal(analysis.cleanPositions.length, 1);
  assert.equal(
    analysis.noisePositions[0].attributes.routeAnalysis.reason,
    ROUTE_ANALYSIS_REASON.POOR_ACCURACY,
  );
});

test('removes invalid coordinates without changing the raw sample count', () => {
  const invalid = position({ index: 1, latitude: 0, longitude: 0 });
  const positions = [
    position({ index: 0 }),
    invalid,
  ];

  const analysis = analyzeRoutePositions({
    positions,
    device: onlineDevice,
  });

  assert.equal(analysis.rawPositions.length, 2);
  assert.equal(analysis.cleanPositions.length, 1);
  assert.equal(analysis.noisePositions.length, 1);
  assert.equal(
    analysis.noisePositions[0].attributes.routeAnalysis.reason,
    ROUTE_ANALYSIS_REASON.INVALID_POSITION,
  );
});

test('uses a device-specific accuracy threshold when configured', () => {
  const positions = [
    position({ index: 0, accuracy: 5 }),
    position({ index: 1, accuracy: 25 }),
  ];

  const analysis = analyzeRoutePositions({
    positions,
    device: {
      ...onlineDevice,
      attributes: { gpsMaxAccuracyMeters: 20 },
    },
  });

  assert.equal(analysis.settings.maxAccuracyMeters, 20);
  assert.equal(analysis.cleanPositions.length, 1);
  assert.equal(
    analysis.noisePositions[0].attributes.routeAnalysis.reason,
    ROUTE_ANALYSIS_REASON.POOR_ACCURACY,
  );
});

test('requires continued spatial movement and then reports moving', () => {
  const positions = [
    position({ index: 0, motion: true, speed: 10 }),
    position({
      index: 1,
      latitude: 20.9704,
      motion: true,
      speed: 10,
    }),
    position({
      index: 2,
      latitude: 20.9708,
      motion: true,
      speed: 10,
    }),
  ];

  const result = prepareDeviceRoute({
    positions,
    device: onlineDevice,
    now: startTime + 25000,
  });

  assert.equal(result.status, ROUTE_STATUS.MOVING);
  assert.equal(result.displayPositions.length, 3);
  assert.equal(result.replayPositions.length, 3);
  assert.equal(result.noisePositions.length, 0);
});

test('keeps clean route history while current device state is offline', () => {
  const positions = [
    position({ index: 0, motion: true, speed: 10 }),
    position({
      index: 1,
      latitude: 20.9704,
      motion: true,
      speed: 10,
    }),
    position({
      index: 2,
      latitude: 20.9708,
      motion: true,
      speed: 10,
    }),
  ];

  const result = prepareDeviceRoute({
    positions,
    device: { ...onlineDevice, status: 'offline' },
    now: startTime + 25000,
  });

  assert.equal(result.status, ROUTE_STATUS.OFFLINE);
  assert.equal(result.displayPositions.length, 3);
  assert.equal(result.replayPositions.length, 3);
});
