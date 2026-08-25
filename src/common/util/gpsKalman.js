// Bo loc Kalman 2D (constant-velocity) de calibrate vi tri GPS real-time.
// Tu thich ung: dung yen -> hoi tu chum lai (khu nhieu); di chuyen -> bam theo.
// Dung HDOP (hoac accuracy) lam trong so do luong. KHONG khu duoc bias he thong.

const UERE_METERS = 5; // sai so tuong duong moi ve tinh (GPS tieu dung ~4-7m)
const DEFAULT_ACCURACY_METERS = 15;
const MAX_GAP_SECONDS = 300; // qua khoang nay coi nhu phien moi -> reset
// Nhieu qua trinh thich ung theo trang thai: dung yen -> rat nho de "ghim" vi tri
// (khu troi cham/wander); di chuyen -> lon de bam sat khong bi tre.
const PROCESS_NOISE_STATIONARY = 0.02;
const PROCESS_NOISE_MOVING = 3;
const STATIONARY_SPEED_KMH = 3; // duoi nguong nay coi la dung yen
const GATE_SIGMA = 5; // bo diem lech qua GATE_SIGMA * do lech chuan (outlier)

// Doc toc do (km/h) tu position: uu tien speed (knots) cua Traccar, roi attributes
const speedKmh = (position) => {
  const knots = Number(position?.speed);
  if (Number.isFinite(knots)) return knots * 1.852;
  const kmh = Number(position?.attributes?.speedKmh);
  return Number.isFinite(kmh) ? kmh : 0;
};

// Quy doi HDOP / accuracy -> sai so uoc luong (met)
export const estimateAccuracy = (position) => {
  const acc = Number(position?.accuracy);
  if (Number.isFinite(acc) && acc > 0) return Math.max(acc, 3);
  const hdop = Number(position?.attributes?.hdop ?? position?.attributes?.hDOP);
  if (Number.isFinite(hdop) && hdop > 0) return Math.max(hdop * UERE_METERS, 3);
  return DEFAULT_ACCURACY_METERS;
};

const parseTimeMs = (position) => {
  const value = position?.fixTime ?? position?.deviceTime ?? position?.serverTime;
  const t = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(t) ? t : Date.now();
};

export class GpsKalman {
  constructor() {
    this.reset();
  }

  reset() {
    this.s = null;
    this.lat0 = null;
    this.lon0 = null;
    this.t = null;
  }

  // position: object Traccar (co latitude, longitude, fixTime, accuracy?, attributes.hdop?)
  // Tra ve { latitude, longitude } da loc.
  update(position) {
    const lat = Number(position.latitude);
    const lon = Number(position.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { latitude: position.latitude, longitude: position.longitude };
    }
    const timeMs = parseTimeMs(position);
    const R = estimateAccuracy(position) ** 2;

    if (this.lat0 == null) { this.lat0 = lat; this.lon0 = lon; }
    const mLat = 111320;
    const mLon = 111320 * Math.cos((this.lat0 * Math.PI) / 180);
    const zx = (lon - this.lon0) * mLon;
    const zy = (lat - this.lat0) * mLat;

    const dt = this.t == null ? 0 : (timeMs - this.t) / 1000;
    if (!this.s || dt > MAX_GAP_SECONDS || dt < 0) {
      this.s = { x: zx, y: zy, vx: 0, vy: 0, Px: R, Py: R, Pvx: R, Pvy: R };
      this.t = timeMs;
      return { latitude: lat, longitude: lon };
    }
    this.t = timeMs;

    // Nhieu qua trinh thich ung: dung yen -> nho (ghim), di chuyen -> lon (bam)
    const q = speedKmh(position) >= STATIONARY_SPEED_KMH
      ? PROCESS_NOISE_MOVING
      : PROCESS_NOISE_STATIONARY;

    const axis = (pos, vel, Pp, Pv, z) => {
      let p = pos + vel * dt; // predict
      let pp = Pp + dt * dt * Pv + q * dt;
      const pv = Pv + q * dt;
      const innov = z - p;
      const S = pp + R;
      if (Math.abs(innov) > GATE_SIGMA * Math.sqrt(S)) {
        return { pos: p, vel, Pp: pp, Pv: pv }; // outlier: chi predict
      }
      const K = pp / S;
      const Kv = (dt * pv) / S;
      p += K * innov;
      const v = vel + Kv * innov;
      pp *= (1 - K);
      return { pos: p, vel: v, Pp: pp, Pv: pv * (1 - Kv) };
    };

    const rx = axis(this.s.x, this.s.vx, this.s.Px, this.s.Pvx, zx);
    const ry = axis(this.s.y, this.s.vy, this.s.Py, this.s.Pvy, zy);
    this.s = {
      x: rx.pos,
      y: ry.pos,
      vx: rx.vel,
      vy: ry.vel,
      Px: rx.Pp,
      Py: ry.Pp,
      Pvx: rx.Pv,
      Pvy: ry.Pv,
    };
    return {
      latitude: this.lat0 + this.s.y / mLat,
      longitude: this.lon0 + this.s.x / mLon,
    };
  }
}

// --- Bo loc live theo tung thiet bi (giu state giua cac lan goi) ---
const filters = new Map();

export const filterLivePositions = (positions) => {
  if (!Array.isArray(positions)) return positions;
  return positions.map((position) => {
    if (position.latitude == null || position.longitude == null) return position;
    // Backend da calibrate (co co calibrated) -> khong loc lai, tranh loc kep
    if (position.attributes && position.attributes.calibrated) return position;
    let kf = filters.get(position.deviceId);
    if (!kf) { kf = new GpsKalman(); filters.set(position.deviceId, kf); }
    const { latitude, longitude } = kf.update(position);
    return {
      ...position,
      latitude,
      longitude,
      attributes: { ...position.attributes, calibrated: true },
    };
  });
};

// Loc mot chuoi lich su (route/replay) doc lap, khong dung state toan cuc
export const filterRoutePositions = (positions) => {
  if (!Array.isArray(positions) || positions.length === 0) return positions;
  const kf = new GpsKalman();
  return positions.map((position) => {
    if (position.latitude == null || position.longitude == null) return position;
    const { latitude, longitude } = kf.update(position);
    return { ...position, latitude, longitude };
  });
};
