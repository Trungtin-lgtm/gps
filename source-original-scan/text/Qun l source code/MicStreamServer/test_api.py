import requests

# URL API đăng nhập Traccar
login_url = "http://14.224.137.80:9090/api/session"

# Thông tin tài khoản Traccar (thay bằng thông tin thực tế)
username = "admin"
password = "admin"

# Headers cần thiết
headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

# Dữ liệu đăng nhập (theo đúng định dạng)
data = {
    "email": username,
    "password": password
}

# Gửi yêu cầu đăng nhập
response = requests.post(login_url, headers=headers, data=data)

if response.status_code == 200:
    session_data = response.json()
    print("Đăng nhập thành công! Token:", session_data)

    # Lấy danh sách thiết bị
    devices_url = "http://14.224.137.80:9090/api/devices"
    headers = {
        "Cookie": response.headers.get("Set-Cookie")  # Dùng session cookie từ response
    }

    devices_response = requests.get(devices_url, headers=headers)
    if devices_response.status_code == 200:
        devices = devices_response.json()
        for device in devices:
            print(f"Tên: {device['name']}, Trạng thái: {device['status']}, id: {device['uniqueId']}")
    else:
        print(f"Lỗi lấy danh sách thiết bị: {devices_response.status_code}")

else:
    print(f"Lỗi đăng nhập: {response.status_code}, Nội dung: {response.text}")
