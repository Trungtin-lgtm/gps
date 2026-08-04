cmd: java -jar tracker-server.jar conf\gpsmaster.xml


Hướng dẫn càặt:
Mở CMD mới và gõ:

java -version
where java


Nếu đều lỗi → chưa cài hoặc PATH sai.

Cài Java (khuyến nghị LTS)

Cài OpenJDK 17 (Temurin/Adoptium) 64-bit. https://www.openlogic.com/openjdk-downloads
17.0.16+8	Windows	x86 64-bit	JDK	.msi


Sau khi cài xong, ghi lại thư mục, ví dụ:

C:\Program Files\Eclipse Adoptium\jdk-17.x.x\


Thiết lập biến môi trường

Mở System Properties → Advanced → Environment Variables…

Ở mục System variables:

Tạo/đặt JAVA_HOME = đường dẫn JDK, ví dụ
C:\Program Files\Eclipse Adoptium\jdk-17.0.11

Sửa Path → Add:
%JAVA_HOME%\bin

Kéo mục này lên gần đầu danh sách (không bắt buộc nhưng tốt).

Đóng hết CMD đang mở và mở CMD mới, chạy:

java -version


Thấy phiên bản hiện ra là OK.