import json
import os
import random
import requests

TRACCAR_URL = "http://localhost:9090"
USERNAME = "admin"
PASSWORD = "aipt2024@"
CONFIG_FILE = "stream_config.json"
PORT_RANGE = (9100, 9300)


def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}


def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)


def get_traccar_devices(email, password):
    """Lấy danh sách thiết bị của user cụ thể."""
    try:
        login_url = f"{TRACCAR_URL}/api/session"
        devices_url = f"{TRACCAR_URL}/api/devices"

        response = requests.post(login_url, data={"email": email, "password": password})
        if response.status_code != 200:
            print(f"❌ Login failed for {email}")
            return []

        session_cookie = response.headers.get("Set-Cookie")
        headers = {"Cookie": session_cookie}

        devices_response = requests.get(devices_url, headers=headers)
        if devices_response.status_code != 200:
            print(f"⚠️ Cannot get devices for {email}")
            return []

        return devices_response.json()
    except requests.exceptions.ConnectionError:
        print("⚠️ Server GPS chưa chạy.")
        return []


def get_all_traccar_devices(admin_email, admin_password):
    """Dùng admin để lấy toàn bộ thiết bị từ mọi user."""
    try:
        login_url = f"{TRACCAR_URL}/api/session"
        users_url = f"{TRACCAR_URL}/api/users"

        session = requests.Session()
        login = session.post(login_url, data={"email": admin_email, "password": admin_password})
        if login.status_code != 200:
            print("❌ Admin login failed.")
            return []

        users = session.get(users_url)
        if users.status_code != 200:
            print("⚠️ Cannot get user list.")
            return []

        all_devices = []
        for user in users.json():
            user_id = user["id"]
            devices_url = f"{TRACCAR_URL}/api/devices?userId={user_id}"
            resp = session.get(devices_url)
            if resp.status_code == 200:
                all_devices.extend(resp.json())
        return all_devices

    except requests.exceptions.ConnectionError:
        print("⚠️ Server GPS chưa chạy.")
        return []



def sync_config_with_devices(devices, config):
    """Đồng bộ file config:
       - Gán port cho thiết bị mới
       - Giữ nguyên port cũ
       - Xóa thiết bị không còn tồn tại
    """
    assigned_ports = {int(info["port"]) for info in config.values()}
    new_config = {}

    for device in devices:
        device_id = device["uniqueId"]
        if device_id in config:
            port = int(config[device_id]["port"])
        else:
            port = random.randint(*PORT_RANGE)
            while port in assigned_ports:
                port = random.randint(*PORT_RANGE)
            assigned_ports.add(port)
        new_config[device_id] = {"name": device["name"], "port": port}

    # Nếu thiết bị cũ không còn tồn tại -> bị loại khỏi new_config
    if new_config != config:
        print("🔄 Updating stream_config.json ...")
        save_config(new_config)

    return new_config
