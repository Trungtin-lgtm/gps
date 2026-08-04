/*
 * Copyright 2024 Anton Tananaev (anton@traccar.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.traccar.protocol;

import io.netty.channel.Channel;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import org.traccar.BaseHttpProtocolDecoder;
import org.traccar.Protocol;
import org.traccar.model.Position;
import org.traccar.session.DeviceSession;

import java.io.StringReader;
import java.net.SocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.TimeZone;

import io.netty.buffer.Unpooled;
import io.netty.util.CharsetUtil;
import java.text.SimpleDateFormat;  
import java.text.ParseException;


public class ValtrackProtocolDecoder extends BaseHttpProtocolDecoder {

    public ValtrackProtocolDecoder(Protocol protocol) {
        super(protocol);
    }

    // @Override
    // protected Object decode(
    //         Channel channel, SocketAddress remoteAddress, Object msg) throws Exception {

    //     FullHttpRequest request = (FullHttpRequest) msg;
    //     String content = request.content().toString(StandardCharsets.UTF_8);
    //     System.out.println("📥 Received HTTP content: " + content);
    //     JsonObject object = Json.createReader(new StringReader(content)).readObject();
    //     JsonArray messages = object.getJsonArray("resource");

    //     List<Position> positions = new LinkedList<>();
    //     for (int i = 0; i < messages.size(); i++) {

    //         JsonObject message = messages.getJsonObject(i);
    //         String id = message.getString("devid");
    //         System.out.println("🚗 Device ID: " + id);
    //         System.out.println("📍 Latitude: " + message.getString("lat"));
    //         System.out.println("📍 Longitude: " + message.getString("lon"));
    //         System.out.println("💨 Speed: " + message.getString("speed"));
    //         System.out.println("🔋 Battery: " + message.getString("vbat"));
    //         DeviceSession deviceSession = getDeviceSession(channel, remoteAddress, id);
    //         if (deviceSession == null) {
    //             continue;
    //         }

    //         Position position = new Position(getProtocolName());
    //         position.setDeviceId(deviceSession.getDeviceId());
    //         position.setValid(true);
            
           
    //         position.setTime(new Date());
    //         position.setLatitude(Double.parseDouble(message.getString("lat")));
    //         position.setLongitude(Double.parseDouble(message.getString("lon")));
    //         String speed = message.getString("speed");
    //         if (!speed.isEmpty()) {
    //             position.setSpeed(Double.parseDouble(speed));
    //         }

    //         position.set(Position.KEY_BATTERY, Double.parseDouble(message.getString("vbat")));
    //         double batteryVoltage = Double.parseDouble(message.getString("vbat"));
    //         position.set(Position.KEY_BATTERY, batteryVoltage);

    //         // Tính % pin từ 3.0V (0%) đến 4.2V (100%)
    //         double batteryPercent = Math.max(0, Math.min(100, (batteryVoltage - 3.0) / (4.2 - 3.0) * 100));
    //         int batteryPercent_int = (int) batteryPercent;
    //         position.set(Position.KEY_BATTERY_LEVEL, batteryPercent_int);
    //         positions.add(position);

    //     }

    //     // sendResponse(channel, HttpResponseStatus.OK);
    //     sendResponse(channel, HttpResponseStatus.OK, Unpooled.copiedBuffer("{\"status\":\"logid\"}", CharsetUtil.UTF_8));
    //     return positions;
    // }
    ////////////////////////////////////////////

@Override
    protected Object decode(
            Channel channel, SocketAddress remoteAddress, Object msg) throws Exception {

        FullHttpRequest request = (FullHttpRequest) msg;
        String content = request.content().toString(StandardCharsets.UTF_8);
        System.out.println("📥 Received HTTP content: " + content);
        JsonObject object = Json.createReader(new StringReader(content)).readObject();
        JsonArray messages = object.getJsonArray("resource");

        List<Position> positions = new LinkedList<>();
        for (int i = 0; i < messages.size(); i++) {

            JsonObject message = messages.getJsonObject(i);
            String id = message.getString("devid");
            // System.out.println("🚗 Device ID: " + id);
            // System.out.println("📍 Latitude: " + message.getString("lat"));
            // System.out.println("📍 Longitude: " + message.getString("lon"));
            // System.out.println("💨 Speed: " + message.getString("speed"));
            // System.out.println("🔋 Battery: " + message.getString("vbat"));

            // Hiển thị thời gian server
            Date serverTime = new Date();
            SimpleDateFormat displayFormat = new SimpleDateFormat("HH:mm:ss dd/MM/yyyy");
           // System.out.println("📅 Server Time: " + displayFormat.format(serverTime));

            // Parse fixTime as UTC then adjust to server timezone (UTC+7)
            String fixTimeStr = message.getString("fixTime");
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            // dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date fixTime = null;
            try {
                fixTime = dateFormat.parse(fixTimeStr);

                Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                cal.setTime(fixTime);
                cal.add(Calendar.HOUR_OF_DAY, 7);
                fixTime = cal.getTime();

                //System.out.println("📅 Adjusted Fix Time: " + displayFormat.format(fixTime));
            } catch (Exception e) {
                e.printStackTrace();
            }

            DeviceSession deviceSession = getDeviceSession(channel, remoteAddress, id);
            if (deviceSession == null) {
                continue;
            }

            Position position = new Position(getProtocolName());
            position.setDeviceId(deviceSession.getDeviceId());
            position.setValid(true);

            // Use adjusted fixTime
            position.setTime(fixTime);
            position.setLatitude(Double.parseDouble(message.getString("lat")));
            position.setLongitude(Double.parseDouble(message.getString("lon")));

            String speed = message.getString("speed");
            if (!speed.isEmpty()) {
                position.setSpeed(Double.parseDouble(speed));
            }

            double batteryVoltage = Double.parseDouble(message.getString("vbat"));
            position.set(Position.KEY_BATTERY, batteryVoltage);
            double batteryPercent = Math.max(0,
                    Math.min(100, (batteryVoltage - 3.0) / (4.2 - 3.0) * 100));
            position.set(Position.KEY_BATTERY_LEVEL, (int) batteryPercent);

            positions.add(position);
        }

        sendResponse(channel, HttpResponseStatus.OK,
                Unpooled.copiedBuffer("{\"status\":\"logid\"}", CharsetUtil.UTF_8));
        return positions;
    }
}

    




