import paho.mqtt.client as mqtt
import socket

BROKER = "192.168.1.118"          # Địa chỉ MQTT Broker
PORT = 1883                    # Cổng MQTT
TOPIC = "mic-control/636110"  # Thay bằng deviceId thực tế của bạn

# Callback khi kết nối thành công
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] ✅ Kết nối thành công")
        client.subscribe(TOPIC)
        print(f"[MQTT] ✅ Đã đăng ký topic: {TOPIC}")
    else:
        print(f"[MQTT] ❌ Kết nối thất bại, mã lỗi: {rc}")

# Callback khi nhận được message từ broker
def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"[MQTT] 📩 Nhận lệnh từ {msg.topic}: {payload}")

    if payload == "START":
        print("🔊 Bắt đầu ghi âm (START)")
        # TODO: Gọi hàm ghi âm thật
    elif payload == "STOP":
        print("🔇 Dừng ghi âm (STOP)")
        # TODO: Gọi hàm dừng ghi âm thật
    else:
        print("⚠️ Lệnh không hợp lệ")

try:
    # Khởi tạo client với protocol mới
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"[MQTT] 🔌 Đang kết nối tới {BROKER}:{PORT} ...")
    client.connect(BROKER, PORT, 60)
    client.loop_forever()

except socket.timeout:
    print("❌ Timeout khi cố gắng kết nối đến MQTT Broker.")
except Exception as e:
    print(f"❌ Lỗi kết nối MQTT: {e}")
