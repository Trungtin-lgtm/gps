# -*- coding: utf-8 -*-
"""
Created on Thu Dec 19 13:52:52 2019

@author: masavoyat
"""
import os
import queue
import socket
import threading
import zlib
import struct
import time

class UDPStreamReceiver:
    _BUFFER_SIZE = 1024
    PAYLOAD_TYPES_STR = {127: "RAW_16BIT", 126: "RAW_8BIT", 125: "ZIP_16BIT", 124: "ZIP_8BIT", 0: "UNKNOWN"}
    def __init__(self, udp_port, udp_ip="", name=None, device_name=None):
        self.name = name if name else str(udp_port)  # Vẫn giữ ID làm đường dẫn
        self.device_name = device_name if device_name else self.name  # Lưu tên thiết bị
        self._thread = threading.Thread(target=self._main_loop)
        self._registeredQueueList = list()
        self._registeredQueueListLock = threading.Lock()
        self._sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((udp_ip, udp_port))
        self._thread.start()
        self._infos = dict()
        self._infosLock = threading.Lock()
        self._infos["name"] = self.name
        self._infos["port"] = udp_port
        self._infos["ip"] = udp_ip
        self._infos["sampling_frequency"] = 0
        self._infos["payload_type"] = 0
        self._infos["registered_queue"] = 0
        self._infos["last_packet_time"] = 0
        self._is_recording = False
        self._recording_thread = None
        
    def getInfos(self):
        self._infosLock.acquire()
        infos = self._infos.copy()
        infos["device_name"] = self.device_name  # Thêm tên thiết bị
        self._infosLock.release()
        return infos
        
    def registerQueue(self, q):
        self._registeredQueueListLock.acquire()
        self._registeredQueueList.append(q)
        self._registeredQueueListLock.release()
        
    def unregisterQueue(self, q):
        self._registeredQueueListLock.acquire()
        if q in self._registeredQueueList:
            self._registeredQueueList.remove(q)
        self._registeredQueueListLock.release()
        
    def _main_loop(self):
        while True:
            try:
                data, addr = self._sock.recvfrom(UDPStreamReceiver._BUFFER_SIZE)
                _, payloadType, _, _, samplingFreq = struct.unpack(">BBHII", data[0:12])

                # Cập nhật lại địa chỉ IP và port nếu thiết bị reconnect
                self._infosLock.acquire()
                if self._infos.get("remote_addr") != addr:
                    self._infos["remote_addr"] = addr

                self._infos["sampling_frequency"] = samplingFreq
                self._infos["payload_type"] = payloadType
                self._infos["registered_queue"] = len(self._registeredQueueList)
                self._infos["last_packet_time"] = time.time()
                self._infosLock.release()
                # Payload ZIP compressed
                if payloadType == 125 or payloadType == 124:
                    header = list(data[:12])
                    header[1] += 2 # payload is now raw
                    data = bytes(header) + zlib.decompress(data[12:])
            except:
                data = None # Send None data to advertise socket is dead
            self._registeredQueueListLock.acquire()
            for q in self._registeredQueueList:
                if q.full():
                    q.get_nowait()
                q.put_nowait(data)
            self._registeredQueueListLock.release()
            if not data:
                continue
    
    def close(self):
        self._registeredQueueListLock.acquire()
        self._sock.close()
        self._registeredQueueListLock.release()
    
    def start_auto_recording(self):
        if self._is_recording:
            return
        self._is_recording = True
        self._recording_thread = threading.Thread(target=self._record_loop, daemon=True)
        self._recording_thread.start()

    def stop_auto_recording(self):
        self._is_recording = False
    def is_recording(self):
        return self._is_recording

    def _record_loop(self):
        while self._is_recording:
            timestamp = int(time.time())
            folder = os.path.join("record", self.name)
            os.makedirs(folder, exist_ok=True)
            filename = os.path.join(folder, f"{timestamp}.wav")
            q = queue.Queue(10)
            self.registerQueue(q)
            try:
                with open(filename, "wb") as wf:
                    data = q.get(timeout=1)
                    if not data:
                        continue
                    _, payloadType, _, _, samplingFreq = struct.unpack(">BBHII", data[0:12])
                    sample_size = 2 if payloadType == 127 else 1

                    # Write WAV header
                    wf.write(b"RIFF")
                    wf.write(struct.pack('<I', 0xffffffff))
                    wf.write(b"WAVE")
                    wf.write(b"fmt ")
                    wf.write(struct.pack('<I', 16))
                    wf.write(struct.pack('<H', 1))
                    wf.write(struct.pack('<H', 1))
                    wf.write(struct.pack('<I', samplingFreq))
                    wf.write(struct.pack('<I', samplingFreq * sample_size))
                    wf.write(struct.pack('<H', sample_size))
                    wf.write(struct.pack('<H', sample_size * 8))
                    wf.write(b"data")
                    wf.write(struct.pack('<I', 0xffffffff))

                    start = time.time()
                    while time.time() - start < 60 and self._is_recording:
                        try:
                            data = q.get(timeout=1)
                            if not data:
                                break
                            wf.write(data[12:])
                        except queue.Empty:
                            break
            except Exception as e:
                print(f"[{self.name}] Recording error: {e}")
            finally:
                self.unregisterQueue(q)            
    def send_data_to_device(self, payload: bytes):
        self._infosLock.acquire()
        addr = self._infos.get("remote_addr")
        self._infosLock.release()
        if addr:
            send_addr = (addr[0], 9999)
            self._sock.sendto(payload, send_addr)
            print(f"[{self.name}] Sent: {payload} to {send_addr}")