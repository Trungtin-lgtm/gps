# GPS MASTER — Hướng dẫn chạy hệ thống

Hệ thống gồm **2 phần chạy độc lập**, phải bật **cả hai**:

| Thành phần | Vai trò | Cổng | Thư mục |
|---|---|---|---|
| **Backend** (Traccar) | Nhận dữ liệu thiết bị, REST API, WebSocket | **9090** (web/API), **9055** (nạp dữ liệu GPS) | `C:\Users\Admin\Downloads\GPS_Server\GPS_Server` |
| **Frontend** (web React/Vite) | Giao diện bản đồ, hiển thị + calibrate realtime | **3000** | `E:\GPS\code\gps_web` |

Frontend gọi API của backend qua proxy, nên **backend phải chạy trước**.

---

## 1. Bật Backend (Traccar)

Mở **PowerShell**, chạy:

```powershell
cd "C:\Users\Admin\Downloads\GPS_Server\GPS_Server"
.\jre\bin\java.exe -jar tracker-server.jar conf\gpsmaster.xml
```

- **Giữ nguyên cửa sổ này** — đóng cửa sổ là tắt server.
- Server lên khi log ngừng cuộn và không có dòng lỗi đỏ. Kiểm tra: mở `http://localhost:9090`.
- ⚠️ **KHÔNG** double-click `start-server.bat` — file đó gọi `java` trần, mà máy không có Java cài toàn cục, sẽ báo lỗi. Bắt buộc dùng `.\jre\bin\java.exe` (Java đi kèm trong thư mục server).

## 2. Bật Frontend (web)

Mở **một cửa sổ PowerShell KHÁC**:

```powershell
cd "E:\GPS\code\gps_web"
npm start
```

- Lần đầu tiên (hoặc sau khi xoá `node_modules`) phải cài thư viện trước: `npm install`.
- **Giữ nguyên cửa sổ này** — đóng là tắt web.
- Cần file `.env` (chứa `VITE_APP_VERSION=6.6.0`) nằm trong `E:\GPS\code\gps_web`. File này đã có sẵn; nếu clone lại mã nguồn mà thiếu thì tạo lại (nếu không sẽ lỗi trang **Cài đặt → Tùy chọn**).

## 3. Truy cập

Mở trình duyệt: **http://localhost:3000** → đăng nhập.

---

## Lưu ý quan trọng

- **Thứ tự**: bật Backend (bước 1) trước, đợi lên, rồi bật Frontend (bước 2).
- Mỗi phần chạy trong **một cửa sổ PowerShell riêng** và phải **giữ mở**.
- Nếu báo **cổng đang bận** (`address already in use`, `port 9090/3000`) → server cũ vẫn đang chạy; dùng cái đang chạy hoặc tắt nó rồi bật lại.
- Sau khi **cài phần mềm mới** (JDK, Gradle…), phải **mở cửa sổ PowerShell mới** thì lệnh mới nhận (cửa sổ cũ không tự cập nhật PATH).

---

## Gửi dữ liệu GPS lên server (giao thức OsmAnd)

Thiết bị đẩy vị trí bằng HTTP GET/POST tới **cổng 9055**:

```
http://<địa-chỉ-server>:9055/?id=<uniqueId>&timestamp=<unix>&lat=<lat>&lon=<lon>&speed=<knots>&bearing=<độ>&altitude=<m>&accuracy=<m>&batt=<%>
```

- `id`: **bắt buộc**, phải trùng **Định danh (uniqueId)** đã khai của thiết bị trong app. Sai id → không có dữ liệu.
- `speed`: đơn vị **hải lý/giờ (knots)**.
- `accuracy`: sai số ước lượng (m) — dùng cho bộ lọc calibrate.
- Trả về `200 OK` là nhận thành công; `400` là id chưa đăng ký.

---

## Ghi chú về calibrate vị trí (Kalman)

- **Frontend tự calibrate vị trí realtime** trên bản đồ chính **khi trang web đang mở** (xử lý trong trình duyệt).
- **Lộ trình / Phát lại / Export** hiển thị **dữ liệu thô** (đọc thẳng từ database) — vì database vẫn lưu tọa độ gốc.
- Muốn dữ liệu **lưu sẵn đã calibrate** (mọi nơi đều sạch, kể cả export) thì cần **build lại backend** (xem mục dưới).

---

## Truy cập / nhận dữ liệu từ xa bằng ngrok

Mặc định server chỉ chạy trong máy (`localhost`). Muốn **thiết bị GPS ở mạng khác gửi về**, hoặc **xem web từ xa**, dùng **ngrok** để tạo một địa chỉ public trỏ về cổng trên máy.

### Bước 1 — Cài ngrok

```powershell
winget install Ngrok.Ngrok
```

Mở **cửa sổ PowerShell mới** sau khi cài, kiểm tra:

```powershell
ngrok version
```

### Bước 2 — Gắn authtoken (chỉ làm một lần)

1. Tạo tài khoản miễn phí tại https://dashboard.ngrok.com
2. Vào mục **Your Authtoken**, copy token, rồi chạy:

```powershell
ngrok config add-authtoken <TOKEN_CUA_BAN>
```

### Bước 3 — Mở cổng ra internet

Chạy trong một cửa sổ PowerShell riêng (giữ mở). Chọn cổng theo nhu cầu:

```powershell
# Cho thiết bị GPS gửi dữ liệu từ xa (cổng nạp 9055)
ngrok http 9055 --scheme=http --domain=overact-dolly-cobalt.ngrok-free.dev
```

```powershell
# Cho xem web / gọi API từ xa (backend 9090)
ngrok http 9090
```

ngrok sẽ hiện dòng `Forwarding  https://xxxx-xx-xx.ngrok-free.app -> http://localhost:9055`. Dùng URL `https://xxxx...ngrok-free.app` đó thay cho `localhost`:

- **Thiết bị gửi vị trí**: `https://xxxx.ngrok-free.app/?id=<uniqueId>&lat=...&lon=...&speed=...`
- **Xem web** (nếu mở 9090): mở `https://xxxx.ngrok-free.app` trên trình duyệt.

### Chạy nhiều cổng cùng lúc (tùy chọn)

Tạo file cấu hình rồi bật một lần. Xem đường dẫn file config bằng `ngrok config check`, mở nó và thêm:

```yaml
version: "3"
tunnels:
  gps:
    proto: http
    addr: 9055
  web:
    proto: http
    addr: 9090
```

Rồi chạy:

```powershell
ngrok start --all
```

### Lưu ý

- **URL đổi mỗi lần khởi động lại** (bản miễn phí). Bản trả phí mới có domain cố định.
- Bản free có thể **giới hạn số tunnel** đồng thời — nếu `ngrok start --all` báo lỗi, chạy **từng cổng một** ở các cửa sổ khác nhau, hoặc chỉ mở cổng đang cần.
- Bản free chèn **trang cảnh báo** khi mở bằng **trình duyệt** (không ảnh hưởng thiết bị gửi request thô). Muốn bỏ khi gọi API, thêm header `ngrok-skip-browser-warning`.
- **Không nên** đưa cổng nạp dữ liệu ra internet lâu dài mà không kiểm soát — ai biết URL đều có thể gửi vị trí giả. Chỉ bật khi cần, tắt khi xong.
- Muốn mở **frontend dev (cổng 3000)** qua ngrok: Vite chặn host lạ, phải thêm `allowedHosts: ['.ngrok-free.app']` vào phần `server` trong `vite.config.js`. Đơn giản hơn là mở cổng **9090** (backend phục vụ sẵn web).

---

## (Tùy chọn) Build lại Backend đã tích hợp calibrate

Chỉ cần khi muốn backend tự calibrate + lưu. Yêu cầu **JDK 17** (đã cài tại `C:\Program Files\Eclipse Adoptium\jdk-17...`).

```powershell
# Trong PowerShell MỚI, kiểm tra: java -version  và  javac -version  đều là 17
cd "E:\GPS\code\gps_web\source-original-scan\source_master\Source GPS Master\traccar"
.\gradlew.bat assemble
# Kết quả: target\tracker-server.jar
```

Sau đó sao lưu và thay jar trong `GPS_Server`, rồi khởi động lại backend (bước 1):

```powershell
cd "C:\Users\Admin\Downloads\GPS_Server\GPS_Server"
copy tracker-server.jar tracker-server.jar.bak
copy "E:\GPS\code\gps_web\source-original-scan\source_master\Source GPS Master\traccar\target\tracker-server.jar" tracker-server.jar
```

> Nếu `gradlew` báo thiếu `gradle-wrapper.jar`, file này đã được khôi phục sẵn tại `traccar\gradle\wrapper\`. Lần build đầu Gradle sẽ tải bản 8.8 + thư viện (cần Internet, vài phút).
