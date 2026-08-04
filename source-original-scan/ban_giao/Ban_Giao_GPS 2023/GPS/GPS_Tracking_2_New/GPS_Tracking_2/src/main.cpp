#include <Arduino.h>
#include <EEPROM.h>
#include <esp_task_wdt.h>

#include "A7672S.h"
#include "global.h"
#include "fsm.h"
#include "input.h"

#define WDT_TIMEOUT 60

static uint64_t timeNow, timeCnt;
static String payload;






void setup() {
  Serial.end();
  Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, RX_2, TX_2);

  EEPROM.begin(EEPROM_SIZE);

  delay(100);
  Serial.println("INIT");

  esp_task_wdt_init(WDT_TIMEOUT, true); //enable panic so ESP32 restarts
  esp_task_wdt_add(NULL); //add current thread to WDT watch

  IN_Init(PIN_IN_BAT);

  pinMode(PIN_OUT_LED, OUTPUT);
  pinMode(PIN_OUT_DTR, OUTPUT);
  pinMode(PIN_IN_RI, INPUT_PULLUP);

  digitalWrite(PIN_OUT_LED, 0);
  digitalWrite(PIN_OUT_DTR, 0);



  A7672S_Init(PIN_OUT_DTR, TX_1, RX_1, 115200);
  

  FSM_Init();
      
  /* On GNSS */
  while(A7672S_GNSSPWROn() == 0);

  Serial.println("Begin");

      //   A7672S_OnRiInt();
      // A7672S_EnterSleepMode();
      // // esp_sleep_enable_ext0_wakeup(PIN_IN_RI, 0); //1 = High, 0 = Low
      // esp_sleep_enable_timer_wakeup( 6000000000);
      // esp_deep_sleep_start();
}

void loop() {
  // put your main code here, to run repeatedly:
 

  if(millis() >= timeNow + EXCECUTING_CYCLE){
    timeCnt = millis() - timeNow;
    timeCnt /= EXCECUTING_CYCLE;

    timeNow = millis();

    if(_timeSend > timeCnt) {_timeSend -= timeCnt;}
    else {_timeSend = 0;}
    
    if(_timeCheckSMS > timeCnt) {_timeCheckSMS -= timeCnt;}
    else {_timeCheckSMS = 0;}
    
    if(_timeOut > timeCnt) {_timeOut -= timeCnt;}
    else {_timeOut = 0;}

    FSM_Process();

    esp_task_wdt_reset();
  }
  

  // Serial.print("ADC: "); Serial.println(IN_GetBat());

#if 0
  if(Serial.available()){
    payload = Serial.readString();
    int i;
    for(i = 0; i < 100; i++){
      if(payload[i] == '\r' || payload[i] == '\n' || payload[i] == '\0'){
        break;
      }
    }

    if(payload.indexOf("MSG") != -1){
      A7672S_MQTTPubMsg(MQTT_TOPIC, (char*)payload.c_str(), sizeof(MQTT_TOPIC)-1, i);
    }
    else if(payload.indexOf("PHONE") != -1){
      A7672S_PHONESendMsg(PHONE_NUM, (char*)payload.c_str());
    }  
    else if(payload.indexOf("CALL") != -1){
      A7672S_PHONESendMsg(PHONE_NUM, (char*)payload.c_str());
    }  
    else if(payload.indexOf("LBS") != -1) {
       
       
       
       
       (&_dataLBS.longtitude, &_dataLBS.latitude, &_dataLBS.date, &_dataLBS.time);

        Serial.print("longtitude: "); Serial.println(_dataLBS.longtitude);
        Serial.print("latitude: "); Serial.println(_dataLBS.latitude);
        Serial.print("date: "); Serial.println(_dataLBS.date);
        Serial.print("time: "); Serial.println(_dataLBS.time);
    }
    else if(payload.indexOf("GETSMS") != -1) {
      Serial.println(A7672S_PHONEGetUnReadMsg());
    }
    else if(payload.indexOf("RESTART") != -1) {
      ESP.restart();
    }
    else if(payload.indexOf("WKP") != -1) {
      A7672S_Wakeup();
    }   
    else if(payload.indexOf("SIMSLP") != -1) {
      A7672S_OnRiInt();
      A7672S_EnterSleepMode();

      // esp_sleep_enable_ext0_wakeup(PIN_IN_RI, 0); //1 = High, 0 = Low
      // esp_sleep_enable_timer_wakeup(_dataSIM.timeSendData * 50 * 1000);
      // esp_deep_sleep_start();
      
    }   
    else if(payload.indexOf("ESPSLP") != -1) {
      // A7672S_OnRiInt();
      // A7672S_EnterSleepMode();

      esp_sleep_enable_ext0_wakeup(PIN_IN_RI, 0); //1 = High, 0 = Low
      esp_sleep_enable_timer_wakeup( 6000000000);
      esp_deep_sleep_start();
    }   
    else if(payload.indexOf("GPS") != -1) {
       A7672S_GPSMEAGetInfor(&_dataGPS.longitude, &_dataGPS.latitude, &_dataGPS.altitude,
                            &_dataGPS.date, &_dataGPS.time, &_dataGPS.speed, &_dataGPS.course) ;

      Serial.printf("{"
        "\"imei\": \"%s\", \"mode\": \"%s\", \"modeGPS\": \"%s\", \"battery\": \"%d\", "
        "\"date\": \"%s\", \"time\": \"%s\", \"longitude\": \"%s\", \"latitude\": \"%s\", "
        "\"course\": \"%s\", \"altitude\": \"%s\", \"speed\": \"%s\"" 
        "}",
            _dataSIM.imei, _dataSIM.modeSet, MSG_MODE_GPS, _dataSIM.batLevel,
            _dataGPS.date, _dataGPS.time, _dataGPS.longitude, _dataGPS.latitude, _dataGPS.course,
            _dataGPS.altitude, _dataGPS.speed




            
        );
    }   
    else {
      Serial1.println(payload);
    }
  }


  if(Serial1.available()){
    payload = Serial1.readString();
  
    Serial.println(payload);
     
  }

  if(Serial2.available()){
    payload = Serial2.readStringUntil('$');
  
    Serial.println(payload);

  }


#endif

}

