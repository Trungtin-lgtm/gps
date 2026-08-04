# -*- coding: utf-8 -*-
"""
Created on Wed Dec 18 20:08:40 2019

@author: masavoyat
"""

#!/usr/bin/python
from http.server import BaseHTTPRequestHandler,HTTPServer
from socketserver import ThreadingMixIn
from config import *


class HTTPStreamServer(ThreadingMixIn, HTTPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        self._receiverList = []

    def appendReceiver(self, receiver):
        self._receiverList.append(receiver)

    def removeReceiver(self, receiver):
        if receiver in self._receiverList:
            self._receiverList.remove(receiver)
    
    def close(self):
        for receiver in self._receiverList:
            receiver.close()
        self.server_close()
