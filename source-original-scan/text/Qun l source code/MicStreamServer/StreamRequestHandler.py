import queue
import struct
import time
import math
import queue
from config import *
from http.server import BaseHTTPRequestHandler
from MicStreamServer import generate_session_id, parse_cookies,sessions
from urllib.parse import parse_qs, urlparse
# import paho.mqtt.publish as publish
import random

from html_templates import login_failed_page, login_page, server_down_page

class streamRequestHandler(BaseHTTPRequestHandler):  
    def send_stream_as_wav(self, receiver):
        q = queue.Queue(10)
        receiver.registerQueue(q)
        try:
            data = q.get(timeout=1)
        except queue.Empty:
            self.send_response(204)
            self.send_header('Content-type','audio/wav')
            self.end_headers()
            receiver.unregisterQueue(q)
            return

        self.send_response(200)
        self.send_header('Content-type','audio/wav')
        self.end_headers()

        _, payloadType, _, _, samplingFreq = struct.unpack(">BBHII", data[0:12])
        sample_size = 2 if payloadType == 127 else 1

        self.wfile.write(b"RIFF")
        self.wfile.write(struct.pack('<I', 0xffffffff))
        self.wfile.write(b"WAVE")
        self.wfile.write(b"fmt ")
        self.wfile.write(struct.pack('<IHHIIHH', 16, 1, 1, samplingFreq, samplingFreq * sample_size, sample_size, sample_size * 8))
        self.wfile.write(b"data")
        self.wfile.write(struct.pack('<I', 0xffffffff))

        try:
            while True:
                data = q.get()
                if not data:
                    break
                _, pt, _, _, sf = struct.unpack(">BBHII", data[0:12])
                if pt != payloadType or sf != samplingFreq:
                    break
                self.wfile.write(data[12:])
        except Exception:
            pass
        finally:
            receiver.unregisterQueue(q)
    def stream_list_page(self, user):
        devices = get_traccar_devices(user['email'], user['password'])
        if not isinstance(devices, list):
            devices = []
        config = load_config()

        current_device_ids = {device["uniqueId"] for device in devices}

        removed_ids = set(config.keys()) - current_device_ids
        for device_id in removed_ids:
            del config[device_id]

        self.server._receiverList = [r for r in self.server._receiverList if r.name in current_device_ids]

        existing_receivers = {r.name for r in self.server._receiverList}
        assigned_ports = {int(info["port"]) for info in config.values()}

        from UDPStreamReceiver import UDPStreamReceiver
        for device in devices:
            device_id = device["uniqueId"]
            device_name = device["name"]

            if device_id not in config:
                port = random.randint(*PORT_RANGE)
                while port in assigned_ports:
                    port = random.randint(*PORT_RANGE)
                config[device_id] = {"name": device_name, "port": port}
                assigned_ports.add(port)

            if device_id not in existing_receivers:
                info = config[device_id]
                sr = UDPStreamReceiver(int(info["port"]), name=device_id, device_name=info["name"])
                # ✅ Thiết lập trạng thái ban đầu là BẬT
                sr._streaming_status = True
                self.server.appendReceiver(sr)
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

        html = """
        <!DOCTYPE html>
        <html lang=\"en\">
        <head>
            <meta charset=\"UTF-8\">
            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
            <title>GPS Master</title>
            <script>
            function toggleRecord(streamName) {
                fetch('/toggle/' + streamName)
                    .then(res => res.text())
                    .then(status => {
                        const icon = document.getElementById('icon_' + streamName);
                        if (status === 'STARTED') {
                            icon.src = "https://www.svgrepo.com/show/206450/pause.svg";
                        } else {
                            icon.src = "https://www.svgrepo.com/show/267793/tape.svg";
                        }
                    });
            }
            let streamRecorders = {}; 
            function toggleClientRecord(streamName) {
                const icon = document.getElementById('icon_client_' + streamName);
                const btn = document.getElementById('btn_client_' + streamName);

                // Nếu đang ghi thì dừng
                if (streamRecorders[streamName]) {
                    streamRecorders[streamName].controller.abort();
                    return;  // KHÔNG xóa ở đây, vì sẽ xử lý khi stream kết thúc
                }

                // Nếu chưa ghi thì bắt đầu
                const controller = new AbortController();
                const signal = controller.signal;
                const chunks = [];

                streamRecorders[streamName] = { controller, chunks };

                icon.src = "https://www.svgrepo.com/show/499765/stop.svg";
                btn.disabled = false;
                window.onbeforeunload = () => "Đang ghi âm. Bạn có chắc chắn muốn rời trang?";

                fetch(`/recordclient/${streamName}`, { signal })
                    .then(async res => {
                        if (!res.ok) throw new Error("Ghi âm thất bại");
                        const reader = res.body.getReader();

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            chunks.push(value);
                        }

                        return new Blob(chunks, { type: 'audio/wav' });
                    })
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = streamName + '_' + Date.now() + '.wav';
                        a.click();
                        URL.revokeObjectURL(url);
                    })
                    .catch(err => {
                        if (err.name === 'AbortError') {
                            // Khi abort → vẫn tạo blob từ chunks
                            const recorded = streamRecorders[streamName];
                            if (recorded?.chunks?.length) {
                                const blob = new Blob(recorded.chunks, { type: 'audio/wav' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = streamName + '_' + Date.now() + '.wav';
                                a.click();
                                URL.revokeObjectURL(url);
                            }
                        } else {
                            console.warn("Lỗi ghi âm:", err);
                        }
                    })
                    .finally(() => {
                        delete streamRecorders[streamName];
                        icon.src = "https://www.svgrepo.com/show/528952/download.svg";
                        btn.disabled = false;
                        window.onbeforeunload = null;
                    });
            }
            
            function toggleStream(streamName) {
                if (!confirm(`Bạn có chắc chắn muốn bật/tắt microphone cho thiết bị "${streamName}" không?`)) return;

                fetch('/toggle_stream/' + streamName)
                    .then(res => res.text())
                    .then(status => {
                        console.log(`[DEBUG] Server returned:`, JSON.stringify(status)); // ← Thêm dòng này

                        const icon = document.getElementById('icon_stream_' + streamName);
                        const clean = status.trim().toUpperCase();
                    if (clean === 'STARTED') {                     
                        alert(`✅ Micro của "${streamName}" đã được BẬT thành công.`);
                    } else if (clean === 'STOPPED') {
                        alert(`🛑 Micro của "${streamName}" đã được TẮT.`);
                    }else {
                            alert("⚠️ Không xác định được trạng thái từ máy chủ!");
                        }
                    })
                    .catch(err => {
                        console.error("Toggle stream error:", err);
                        alert("❌ Đã xảy ra lỗi khi bật/tắt microphone.");
                    });
            }
            </script>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; }
                h1 { color: #333; }
                table { width: 90%; margin: 20px auto; border-collapse: collapse; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                th, td { padding: 12px; border: 1px solid #ddd; text-align: center; }
                th { background-color: #007bff; color: white; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                tr:hover { background-color: #f1f1f1; }
                .icon { width: 24px; height: 24px; cursor: pointer; }
                .disabled { opacity: 0.5; pointer-events: none; }
                .record-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>GPS Master - Stream List</h1>
            <table>
                <tr>
                    <th>Thiết bị</th>
                    <th>Port</th>
                    <th>Tần số lấy mẫu</th>
                    <th>Trạng thái</th>
                    <th>Định dạng dữ liệu</th>
                    <th>Hàng đợi đã đăng ký</th>
                    <th>Phát trực tuyến</th>
                    <th>Ghi tại máy chủ</th>
                    <th>Ghi tại máy khách</th>
                    <th>IP : Port</th>
                    <th>Điều khiển</th>
                </tr>
        """

        for receiver in self.server._receiverList:
            infos = receiver.getInfos()
            status = "<span style='color:green;'>YES</span>" if infos["last_packet_time"] >= time.time() - 1 else "<span style='color:red;'>NO</span>"
            icon = "https://www.svgrepo.com/show/418116/headphone.svg" if infos["last_packet_time"] >= time.time() - 1 else "https://www.svgrepo.com/show/417789/headphone-slash.svg"
            button_class = "" if infos["last_packet_time"] >= time.time() - 1 else "disabled"
            link = f"/{infos['name']}" if infos["last_packet_time"] >= time.time() - 1 else "#"
            record_class = "" if infos["last_packet_time"] >= time.time() - 1 else "disabled"
            remote_ip, remote_port = infos.get("remote_addr", ("", ""))
            recording = receiver.is_recording()
            record_icon = "https://www.svgrepo.com/show/206450/pause.svg" if recording else "https://www.svgrepo.com/show/267793/tape.svg"
            payload_type = infos.get('payload_type')
            payload_str = receiver.PAYLOAD_TYPES_STR.get(payload_type, f"UNKNOWN({payload_type})")
            sampling_frequency = infos.get('sampling_frequency', 0)
            registered_queue = infos.get('registered_queue', 0)
            html += f"""
                <tr>
                    <td>{infos['device_name']}</td>
                    <td>{infos['port']}</td>
                    <td>{sampling_frequency}</td>
                    <td>{status}</td>
                    <td>{payload_str}</td>
                    <td>{registered_queue}</td>
                    <td><a href="{link}" class="{button_class}" target="_blank"><img src="{icon}" class="icon"></a></td>
                    <td>
                        <div style="display:flex; gap:8px; justify-content:center;">
                            <button onclick="toggleRecord('{infos['name']}')" class="record-btn" id="btn_{infos['name']}" {'disabled' if infos['last_packet_time'] < time.time() - 1 else ''}>
                                <img src="{record_icon}" class="icon" id="icon_{infos['name']}">
                            </button>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; gap:8px; justify-content:center; align-items:center;">
                            <button onclick="toggleClientRecord('{infos['name']}')" class="record-btn" id="btn_client_{infos['name']}" {'disabled' if infos['last_packet_time'] < time.time() - 1 else ''}>
                                <img src="https://www.svgrepo.com/show/528952/download.svg" class="icon" id="icon_client_{infos['name']}" data-state="idle">
                            </button>
                        </div>
                    </td>
                    <td>{remote_ip}:{remote_port}</td>
                    <td>
                        <button onclick="toggleStream('{infos['name']}')" class="record-btn">
                            <img src="{ 'https://www.svgrepo.com/show/250597/power-button-power-on.svg'}" 
                                class="icon" id="icon_stream_{infos['name']}">
                        </button>
                    </td>
                </tr>
            """
        html += "</table></body></html>"
        self.wfile.write(html.encode())

        
    def get_session_user(self):
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None
        cookies = parse_cookies(cookie_header)
        session_id = cookies.get("session_id")
        return sessions.get(session_id)
    def do_GET(self):
        if self.path.startswith("/control/"):
            device_id = self.path[len("/control/"):]
            for receiver in self.server._receiverList:
                if receiver.name == device_id:
                    self.send_response(200)
                    self.end_headers()
                    status = getattr(receiver, "_streaming_status", False)
                    self.wfile.write(b"START_STREAM" if status else b"STOP_STREAM")
                    return
            self.send_response(404)
            self.end_headers()
            return
        if self.path == "/login":
            self.respond_html(login_page())
            return

        user = self.get_session_user()
        if not user:
            self.send_response(302)
            self.send_header('Location', '/login')
            self.end_headers()
            return

        if self.path == "/":
            self.stream_list_page(user)
            return
        if self.path.startswith("/toggle_stream/"):
            device_id = self.path[len("/toggle_stream/"):]
            for receiver in self.server._receiverList:
                if receiver.name == device_id:
                    return self.toggle_mic(receiver)
        if self.path.startswith("/toggle/"):
            stream_name = self.path[len("/toggle/"):]            
            for receiver in self.server._receiverList:
                if receiver.name == stream_name:
                    return self.toggle_record(receiver)

        for receiver in self.server._receiverList:
            if self.path == ("/" + receiver.name):
                self.send_stream_as_wav(receiver)
                return
        if self.path.startswith("/recordclient/"):
            stream_name = self.path[len("/recordclient/"):]            
            for receiver in self.server._receiverList:
                if receiver.name == stream_name:
                    return self.record_stream_to_client(receiver)


        self.send_response(404)
        self.end_headers()
    def respond_html(self, html_content):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html_content.encode())

    def do_POST(self):
        if self.path == "/login":
            length = int(self.headers.get('Content-Length'))
            data = self.rfile.read(length).decode()
            fields = parse_qs(data)
            email = fields.get("email", [""])[0]
            password = fields.get("password", [""])[0]

            devices = get_traccar_devices(email, password)

            # Nếu không kết nối được với server GPS (None trả về từ ConnectionError)
            if devices is None:
                self.respond_html(server_down_page())
                return

            # Sai email/mật khẩu (server trả về lỗi login, không có cookie)
            if isinstance(devices, dict) and devices.get("error") == "login failed":
                self.respond_html(login_failed_page())
                return
            # Nếu thành công
            session_id = generate_session_id()
            sessions[session_id] = {"email": email, "password": password}
            self.send_response(302)
            self.send_header('Location', '/')
            self.send_header('Set-Cookie', f'session_id={session_id}; HttpOnly')
            self.end_headers()


    def record_stream_to_client(self, receiver):
        q = queue.Queue(10)
        receiver.registerQueue(q)

        try:
            data = q.get(timeout=1)
            if not data:
                self.send_response(204)
                self.end_headers()
                return

            _, payloadType, _, _, samplingFreq = struct.unpack(">BBHII", data[0:12])
            sample_size = 2 if payloadType == 127 else 1

            # Gửi header file WAV
            self.send_response(200)
            self.send_header('Content-Type', 'audio/wav')
            self.send_header('Content-Disposition', f'attachment; filename="{receiver.name}_{int(time.time())}.wav"')
            self.end_headers()

            # Header WAV chuẩn
            self.wfile.write(b"RIFF")
            self.wfile.write(struct.pack('<I', 0xffffffff))  # file size unknown
            self.wfile.write(b"WAVE")
            self.wfile.write(b"fmt ")
            self.wfile.write(struct.pack('<IHHIIHH', 16, 1, 1, samplingFreq, samplingFreq * sample_size, sample_size, sample_size * 8))
            self.wfile.write(b"data")
            self.wfile.write(struct.pack('<I', 0xffffffff))  # data size unknown

            start_time = time.time()
            while time.time() - start_time < 600:  # Ghi đúng 60s hoặc cho đến khi bị ngắt
                try:
                    data = q.get(timeout=1)
                    if not data:
                        break
                    self.wfile.write(data[12:])
                except queue.Empty:
                    continue  # Không có dữ liệu thì đợi tiếp
                except (ConnectionAbortedError, BrokenPipeError):
                    print(f"[INFO] Client manually stopped recording.")
                    break
                except Exception as e:
                    print(f"[ERROR] Unexpected recording error: {e}")
                    break

        except Exception as e:
            try:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Recording error: {str(e)}".encode())
            except:
                pass
        finally:
            receiver.unregisterQueue(q)
    def toggle_mic(self, receiver):
        try:
            print(f"[TOGGLE MIC] Device: {receiver.name}")
            status = getattr(receiver, "_streaming_status", False)

            # Đổi trạng thái
            if status:
                receiver._streaming_status = False
                result = b"STOPPED"
            else:
                receiver._streaming_status = True
                result = b"STARTED"

            # Gửi phản hồi đúng định dạng frontend cần
            try:
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(result)
            except ConnectionAbortedError:
                print(f"[⚠️] Client đóng kết nối sớm khi bật/tắt mic: {receiver.name}")
            except Exception as e:
                print(f"[❌] Lỗi khi gửi phản hồi toggle_mic: {e}")

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Toggle mic failed: {e}".encode())
    def toggle_record(self, receiver):
        try:
            if receiver.is_recording():
                receiver.stop_auto_recording()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"STOPPED")
            else:
                receiver.start_auto_recording()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"STARTED")
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Error: {e}".encode())
