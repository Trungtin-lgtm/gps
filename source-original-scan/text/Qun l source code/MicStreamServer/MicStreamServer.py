from http.cookies import SimpleCookie
import logging
import HTTPStreamServer,StreamRequestHandler
import random
import json
import os

from config import (
    PASSWORD, USERNAME,
    get_traccar_devices,
    get_all_traccar_devices,
    sync_config_with_devices,
    load_config
)
TRACCAR_URL = "http://localhost:9090"
CONFIG_FILE = "stream_config.json"
PORT_RANGE = (9100, 9300)
SERVER_PORT = 9091
sessions = {}  # session_id -> {email, password}
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("MicStreamServer")
def _atomic_write_json(path: str, data: dict) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)
def load_config() -> dict:
    if not os.path.exists(CONFIG_FILE):
        return {}
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception as e:
        logger.warning("Config file is corrupted or unreadable (%s). Using empty config.", e)
        return {}
def save_config(config: dict) -> None:
    try:
        _atomic_write_json(CONFIG_FILE, config)
    except Exception as e:
        logger.error("Failed to save config: %s", e)
def generate_session_id():
    return str(random.randint(100000, 999999))

def parse_cookies(cookie_header):
    cookie = SimpleCookie()
    cookie.load(cookie_header)
    return {k: v.value for k, v in cookie.items()}

def assign_ports(devices, config):
    assigned_ports = {int(info["port"]) for info in config.values()}
    for device in devices:
        device_id = device["uniqueId"]
        if device_id not in config:
            port = random.randint(*PORT_RANGE)
            while port in assigned_ports:
                port = random.randint(*PORT_RANGE)
            config[device_id] = {"name": device["name"], "port": port}
            assigned_ports.add(port)
    return config

def main():
    config = load_config()
        # ✅ Tự động cập nhật thiết bị từ tài khoản ADMIN
    # 1️⃣ Lấy toàn bộ thiết bị từ tất cả tài khoản
    try:
        all_devices = get_all_traccar_devices(USERNAME, PASSWORD)
    except Exception as e:
        logger.error("Failed to fetch devices from Server: %s", e)
        all_devices = []
    if isinstance(all_devices, list):
        config = sync_config_with_devices(all_devices, config)
    bind_host = "0.0.0.0"
    server = HTTPStreamServer.HTTPStreamServer((bind_host, SERVER_PORT), StreamRequestHandler.streamRequestHandler)

    # Stream receivers will be created dynamically upon user login in the web UI
    print(f"MicStreamServer running at http://localhost:{SERVER_PORT}")
    logger.info("MicStreamServer listening on http://%s:%d", bind_host, SERVER_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        server.shutdown()
        server.server_close()
    except Exception as e:
        logger.exception("Unhandled server error: %s", e)
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
