/*
 * Kalman position calibration handler (constant-velocity, adaptive).
 * Dung yen -> ghim vi tri (khu troi cham); di chuyen -> bam theo.
 * Trong so do luong lay tu HDOP/accuracy. KHONG khu duoc bias he thong.
 */
package org.traccar.handler;

import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.traccar.model.Position;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Singleton
public class KalmanHandler extends BasePositionHandler {

    private static final double UERE_METERS = 5;
    private static final double DEFAULT_ACCURACY_METERS = 15;
    private static final long MAX_GAP_SECONDS = 300;
    private static final double Q_STATIONARY = 0.02;
    private static final double Q_MOVING = 3;
    private static final double STATIONARY_SPEED_KMH = 3;
    private static final double GATE_SIGMA = 5;

    private static final class State {
        private boolean init;
        private double lat0;
        private double lon0;
        private double x;
        private double y;
        private double vx;
        private double vy;
        private double px;
        private double py;
        private double pvx;
        private double pvy;
        private long time;
    }

    private final Map<Long, State> states = new ConcurrentHashMap<>();

    @Inject
    public KalmanHandler() {
    }

    private static double estimateAccuracy(Position position) {
        double accuracy = position.getAccuracy();
        if (accuracy > 0) {
            return Math.max(accuracy, 3);
        }
        if (position.hasAttribute(Position.KEY_HDOP)) {
            double hdop = position.getDouble(Position.KEY_HDOP);
            if (hdop > 0) {
                return Math.max(hdop * UERE_METERS, 3);
            }
        }
        return DEFAULT_ACCURACY_METERS;
    }

    private static double[] axis(
            double pos, double vel, double pp, double pv,
            double z, double dt, double q, double r) {
        double p = pos + vel * dt;
        double ppNext = pp + dt * dt * pv + q * dt;
        double pvNext = pv + q * dt;
        double innovation = z - p;
        double s = ppNext + r;
        if (Math.abs(innovation) > GATE_SIGMA * Math.sqrt(s)) {
            return new double[] {p, vel, ppNext, pvNext};
        }
        double k = ppNext / s;
        double kv = dt * pvNext / s;
        double pNew = p + k * innovation;
        double vNew = vel + kv * innovation;
        return new double[] {pNew, vNew, ppNext * (1 - k), pvNext * (1 - kv)};
    }

    @Override
    public void onPosition(Position position, Callback callback) {
        double latitude = position.getLatitude();
        double longitude = position.getLongitude();
        if (position.getFixTime() == null || (latitude == 0 && longitude == 0)) {
            callback.processed(false);
            return;
        }

        State state = states.computeIfAbsent(position.getDeviceId(), key -> new State());
        double accuracy = estimateAccuracy(position);
        double r = accuracy * accuracy;
        long timeMs = position.getFixTime().getTime();

        if (!state.init) {
            state.lat0 = latitude;
            state.lon0 = longitude;
        }
        double mLat = 111320;
        double mLon = 111320 * Math.cos(state.lat0 * Math.PI / 180);
        double zx = (longitude - state.lon0) * mLon;
        double zy = (latitude - state.lat0) * mLat;

        double dt = state.init ? (timeMs - state.time) / 1000.0 : 0;
        if (!state.init || dt > MAX_GAP_SECONDS || dt < 0) {
            state.x = zx;
            state.y = zy;
            state.vx = 0;
            state.vy = 0;
            state.px = r;
            state.py = r;
            state.pvx = r;
            state.pvy = r;
            state.time = timeMs;
            state.init = true;
            callback.processed(false);
            return;
        }
        state.time = timeMs;

        double q = position.getSpeed() * 1.852 >= STATIONARY_SPEED_KMH ? Q_MOVING : Q_STATIONARY;
        double[] rx = axis(state.x, state.vx, state.px, state.pvx, zx, dt, q, r);
        double[] ry = axis(state.y, state.vy, state.py, state.pvy, zy, dt, q, r);
        state.x = rx[0];
        state.vx = rx[1];
        state.px = rx[2];
        state.pvx = rx[3];
        state.y = ry[0];
        state.vy = ry[1];
        state.py = ry[2];
        state.pvy = ry[3];

        position.setLatitude(state.lat0 + state.y / mLat);
        position.setLongitude(state.lon0 + state.x / mLon);
        position.set("calibrated", true);
        callback.processed(false);
    }

}
