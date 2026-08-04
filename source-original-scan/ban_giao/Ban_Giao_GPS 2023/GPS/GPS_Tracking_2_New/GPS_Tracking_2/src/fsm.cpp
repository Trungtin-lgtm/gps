#include "fsm.h"

static uint8_t sysMode;
static String serverMsg;
static String smsMsg;

static uint8_t pubMsg[300];
static uint16_t sizePubMsg;

void ConnectServer(void){
    int32_t i, j;

    A7672S_MQTTStart(_dataSIM.imei, MQTT_BROKER_PORT, MQTT_ISSLL_TLS);

    _dataSIM.sizePubTopic = i = sprintf(_dataSIM.myWillTopic, "datagps"); 
    j = sprintf(_dataSIM.myWillMsg, "%s/off", _dataSIM.imei);
    Serial.write(_dataSIM.myWillTopic, i); Serial.println(";");
    Serial.write(_dataSIM.myWillMsg, j); Serial.println(";");
        
    A7672S_MQTTSetWillMsg(_dataSIM.myWillTopic, _dataSIM.myWillMsg, i, j);
        

    /* Connect Server */
    A7672S_MQTTConnect(MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_BROKER_PORT);

    i = sprintf(_dataSIM.myPubTopic, "datagps");
    Serial.write(_dataSIM.myPubTopic, i); Serial.println(";");


    i = sprintf(_dataSIM.myTopicMode, "%s/mode", _dataSIM.imei);
    Serial.write(_dataSIM.myTopicMode, i); Serial.println(";");

    A7672S_MQTTSubTopic(_dataSIM.myTopicMode, i);
        

    i = sprintf(_dataSIM.myTopicSMS, "%s/sms", _dataSIM.imei);
    Serial.write(_dataSIM.myTopicSMS, i); Serial.println(";");

    A7672S_MQTTSubTopic(_dataSIM.myTopicSMS, i);

}

uint8_t ProcessServerMsg(void){
    int16_t i, j, index;
    String dmyStr;
    String smsPhoneNum;

    if(serverMsg.indexOf(_dataSIM.myTopicMode) != -1){
        /* {"mode": "mode", "modeGPS": "modeGPS","time_mode": "timeSend"} */

        /* process mode */
        if(serverMsg.indexOf(MSG_MODE_SET_NORMAL) != -1){
            _dataSIM.modeSet = MSG_MODE_SET_NORMAL;
        }
        else if(serverMsg.indexOf(MSG_MODE_SET_SLEEP) != -1){
            _dataSIM.modeSet = MSG_MODE_SET_SLEEP;
        }

        Serial.print("MODE: "); Serial.println(_dataSIM.modeSet);

        /* process modeGPS */
        dmyStr = serverMsg.substring( serverMsg.indexOf("modeGPS") + 8, serverMsg.indexOf("time_mode") );
        if(dmyStr.indexOf(MSG_MODE_GPS_LBS) != -1){
            _dataSIM.modeGPSSet = MSG_MODE_GPS_LBS;
        }
        else if(dmyStr.indexOf(MSG_MODE_GPS) != -1){
            _dataSIM.modeGPSSet = MSG_MODE_GPS;
        }
        else if(dmyStr.indexOf(MSG_MODE_LBS) != -1){
            _dataSIM.modeGPSSet = MSG_MODE_LBS;            
        }

        Serial.print("MODE GPS: "); Serial.println(_dataSIM.modeGPSSet);


        /* process time_mode */
        dmyStr = serverMsg.substring( serverMsg.indexOf("time_mode") + 12 );
        
        i = dmyStr.indexOf('\"', 0);
        j = dmyStr.indexOf('\"', 0 + 1);

        _dataSIM.timeSendData = atoi( dmyStr.substring(i+1, j).c_str() ) * (1000 / EXCECUTING_CYCLE);

        if(_dataSIM.timeSendData < 1) _dataSIM.timeSendData = 1;

        Serial.print("TIME: "); Serial.println( atoi( dmyStr.substring(i+1, j).c_str() ));

        return 1;

    }
    else if(serverMsg.indexOf(_dataSIM.myTopicSMS) != - 1){
        /* {"SDT":["SDT1", "SDT2", "SDTn"], "msg": "abc"} */

        i = serverMsg.indexOf("msg");
        if(i != - 1){
            smsMsg = serverMsg.substring( i + 7, serverMsg.indexOf("\"}") );
        }

        /* split phone num */
        dmyStr = serverMsg.substring( serverMsg.indexOf("["), serverMsg.indexOf("]")+1);

        index = dmyStr.indexOf('\"', index);
        i = dmyStr.indexOf('\"', index);
        j = dmyStr.indexOf('\"', index + 3);

        while( (i < j) && (i != -1) && (j != -1) ){

            smsPhoneNum = dmyStr.substring(i+1, j);
            if(smsPhoneNum != ""){
                A7672S_PHONESendMsg((char*)smsPhoneNum.c_str(), (char*)smsMsg.c_str());
            }

            index = j + 2;
            i = dmyStr.indexOf('\"', index);
            j = dmyStr.indexOf('\"', index + 3);
        }

        return 2;
    }

    return 0;
}


uint8_t GetLBS(void){
    
    return 1;
}

uint8_t GetGPS(void){

    return 1;
}

uint8_t ProcessRecvSMS(String str){
    if(str.indexOf("+CMGL") != -1){
        // Serial.println(str);

        if(str.indexOf(MSG_SMS_CMD_RESET) != -1){
            return 1;
        }

        // return 1;
    }

    return 0;
}

void SystemSleep(void){
    Serial.println("Enter sleep");
    // delay(100);
    A7672S_OnRiInt();

    A7672S_MQTTDisconnect();

    A7672S_EnterSleepMode();

    esp_sleep_enable_ext0_wakeup(PIN_IN_RI, 0); //1 = High, 0 = Low
    esp_sleep_enable_timer_wakeup(_dataSIM.timeSendData * EXCECUTING_CYCLE * 1000);
    esp_deep_sleep_start();
            
}


void RestoreFromEEPROM(void){
    uint32_t dmy;

    if(EEPROM.read(EEPROM_INDEX_FIRSTTIME) == 0x24){
        dmy = EEPROM.read(EEPROM_INDEX_MODE);

        if(dmy == MODEESP_NORMAL){
            _dataSIM.modeSet = MSG_MODE_SET_NORMAL;
        }
        else if(dmy == MODEESP_SLEEP){
            _dataSIM.modeSet = MSG_MODE_SET_SLEEP;
        }   
        else {
            _dataSIM.modeSet = MSG_MODE_SET_NORMAL;
        }

        dmy = EEPROM.read(EEPROM_INDEX_MODEGPS);

        if(dmy == MODESIM_GPS_LBS){
            _dataSIM.modeGPSSet = MSG_MODE_GPS_LBS;
        }
        else if(dmy == MODESIM_GPS){
            _dataSIM.modeGPSSet = MSG_MODE_GPS;
        } 
        else if(dmy == MODESIM_LBS){
            _dataSIM.modeGPSSet = MSG_MODE_LBS;
        }
        else {
            _dataSIM.modeGPSSet = MSG_MODE_GPS_LBS;
        }

        dmy = EEPROM.read(EEPROM_INDEX_TIMESEND + 3);
        dmy = (dmy << 8) | EEPROM.read(EEPROM_INDEX_TIMESEND + 2);
        dmy = (dmy << 8) | EEPROM.read(EEPROM_INDEX_TIMESEND + 1);
        dmy = (dmy << 8) | EEPROM.read(EEPROM_INDEX_TIMESEND);
        _dataSIM.timeSendData = dmy;
    }
    else {
        _dataSIM.modeSet = MSG_MODE_SET_SLEEP;
        _dataSIM.modeGPSSet = MSG_MODE_LBS;
        _dataSIM.timeSendData = TIME_SEND_DEFAULT;
    }

    Serial.print("Mode: "); Serial.println(_dataSIM.modeSet);
    Serial.print("ModeGPS: "); Serial.println(_dataSIM.modeGPSSet);
    Serial.print("SendMode: "); Serial.println( (int) (_dataSIM.timeSendData * EXCECUTING_CYCLE / 1000) );
}


void SaveToEEPROM(void){
    uint32_t dmy;

    EEPROM.write(EEPROM_INDEX_FIRSTTIME, 0x24);
    delay(50);

    if( _dataSIM.modeSet.indexOf(MSG_MODE_SET_NORMAL) != - 1 ){
        EEPROM.write(EEPROM_INDEX_MODE, MODEESP_NORMAL);
    }
    else if( _dataSIM.modeSet.indexOf(MSG_MODE_SET_SLEEP) != - 1 ){
        EEPROM.write(EEPROM_INDEX_MODE, MODEESP_SLEEP);
    }
    delay(50);

    if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_GPS_LBS) != -1 ){
        EEPROM.write(EEPROM_INDEX_MODEGPS, MODESIM_GPS_LBS);
    }
    else if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_GPS) != -1 ){
         EEPROM.write(EEPROM_INDEX_MODEGPS, MODESIM_GPS);  
    }
    else if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_LBS) != -1 ){
        EEPROM.write(EEPROM_INDEX_MODEGPS, MODESIM_LBS);
    }    
    delay(50);

    dmy = _dataSIM.timeSendData;
    
    EEPROM.write(EEPROM_INDEX_TIMESEND, dmy);
    delay(50);

    dmy >>= 8;
    EEPROM.write(EEPROM_INDEX_TIMESEND+1, dmy);
    delay(50);

    dmy >>= 8;
    EEPROM.write(EEPROM_INDEX_TIMESEND+2, dmy);
    delay(50);

    dmy >>= 8;
    EEPROM.write(EEPROM_INDEX_TIMESEND+3, dmy);
    delay(50);

    EEPROM.commit();

}


/************************************************************
*                   HIGH LEVEL FUNCTION                     *
*************************************************************/
void FSM_Init(void){
    sysMode = SYS_INIT;
}


void FSM_Process(void){
    uint16_t i, j;
    // String dmyStr;

    switch (sysMode){
    case SYS_INIT:
        // A7672S_CheckAT();
        while(  A7672S_GetSIMEI( &_dataSIM.imei[0] ) == 0  );

    
        Serial.print(_dataSIM.imei); Serial.println(";");

        A7672S_GetPhoneNum( &_dataSIM.curPhoneNum[0] );
    
        // /* On GNSS */
        // while(A7672S_GNSSPWROn() == 0);

        RestoreFromEEPROM();

        _timeSend = 0 / EXCECUTING_CYCLE;
        _timeCheckSMS = 0;

        /* Connect server */
        if(_dataSIM.modeSet != MSG_MODE_SET_SLEEP) {
            ConnectServer();
        }

        sysMode = SYS_IDLING;
        break;
    case SYS_IDLING:

    if(Serial1.available()){
            serverMsg = "";
            while(Serial1.available()){
                serverMsg = Serial1.readString();
            }    

            Serial.println(serverMsg);

            if(ProcessServerMsg() == 1){
                SaveToEEPROM();
                sysMode = SYS_CHECKWORKMODE;
            }
        }

        if((_timeCheckSMS == 0) || (digitalRead(PIN_IN_RI) == 0)){
            _timeCheckSMS = TIME_CHECK_SMS;

            if(digitalRead(PIN_IN_RI) == 0){
                Serial.println("SMS Interrupt");
            }

            
            _timeCheckSMS = TIME_CHECK_SMS;
            Serial.println("Check SMS");
            sysMode = SYS_CHECKSMS;
        }
        else if(_timeSend == 0){              
            _timeSend = _dataSIM.timeSendData;
            sysMode = SYS_GETLOCATION;
        }
        
        
        break;
    case SYS_CHECKWORKMODE:

        if( _dataSIM.modeSet.indexOf(MSG_MODE_SET_NORMAL) != - 1 ){

            sysMode = SYS_IDLING;
        }
        else if( _dataSIM.modeSet.indexOf(MSG_MODE_SET_SLEEP) != - 1 ){
            
            SystemSleep();
            
            // sysMode = SYS_WAKEUPAFTERSLEEP;
        }
        else {
            _dataSIM.modeSet = MSG_MODE_SET_NORMAL;
        }

        break;
    case SYS_GETLOCATION:
        /* On GNSS */
        // i = 3; 

        // while((A7672S_GNSSPWROn() == 0) && (i > 0)){
        //     i--;
        // }
        
        if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_GPS_LBS) != -1 ){
            // /* Compare GPS signal vs LBS signal */
            // if(A7672S_GPSIsAvailable()){
            //     sysMode = SYS_GETGPS;
            // }
            // else {
            //     Serial.println("GPS not available");
            //     sysMode = SYS_GETLBS;
            // }

            sysMode = SYS_GETGPS;
        }
        else if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_GPS) != -1 ){
            sysMode = SYS_GETGPS;
        }
        else if( _dataSIM.modeGPSSet.indexOf(MSG_MODE_LBS) != -1 ){
            sysMode = SYS_GETLBS;
        }
        else {
            _dataSIM.modeGPSSet = MSG_MODE_GPS_LBS;
        }


        break;
    case SYS_GETGPS:
        _dataGPS.longitude = "";
        _dataGPS.latitude = "";
        _dataGPS.altitude = "";
        _dataGPS.date = "";
        _dataGPS.time = "";
        _dataGPS.speed = "";
        _dataGPS.course = "";

        /* GET GPS */
        i = 3;
        
        while(i){
            if(        A7672S_GPSMEAGetInfor(&_dataGPS.longitude, &_dataGPS.latitude, &_dataGPS.altitude,
                            &_dataGPS.date, &_dataGPS.time, &_dataGPS.speed, &_dataGPS.course) ){
                break;
            }
            i--;
        }
    
        /* Get battery */
        _dataSIM.batLevel = IN_GetBat();


        if(i > 0){

            // imei, mode, modeGPS, %pin, thời gian gửi, kinh độ, vĩ độ, hướng, độ cao , vận tốc

            // {
            //  "imei": "87xx", "mode":"normal", "modeGPS": "GPS", "battery": "30",
            //  "date": "30/01/2024", "time": "04:07:03", "longitude": "106.80973733", "latitude": "10.88085467", 
            //  "direction": "...", "altitude": "71.6", "speed": "30.5" 
            //  }

            sizePubMsg = sprintf( (char*)pubMsg,     
            "{"
            "\"imei\": \"%s\", \"mode\": \"%s\", \"modeGPS\": \"%s\", \"battery\": \"%d\", "
            "\"date\": \"%s\", \"time\": \"%s\", \"longitude\": \"%s\", \"latitude\": \"%s\", "
            "\"course\": \"%s\", \"altitude\": \"%s\", \"speed\": \"%s\"" 
            "}",
                _dataSIM.imei, _dataSIM.modeSet, MSG_MODE_GPS, _dataSIM.batLevel,
                _dataGPS.date, _dataGPS.time, _dataGPS.longitude, _dataGPS.latitude, _dataGPS.course,
                _dataGPS.altitude, _dataGPS.speed
            );

            sysMode = SYS_SENDDATA;
        }
        else {
            sysMode = SYS_GETLBS;
        }


        break;  
    case SYS_GETLBS:
        /* GET LBS */
        i = 3;
        
        while(i){
            if(A7672S_LBSGetLocation_Date(&_dataLBS.longtitude, &_dataLBS.latitude, &_dataLBS.date, &_dataLBS.time)){
                break;
            }
            i--;
        }



        // Serial.print("longtitude"); Serial.println(_dataLBS.longtitude);
        // Serial.print("latitude"); Serial.println(_dataLBS.latitude);
        // Serial.print("date"); Serial.println(_dataLBS.date);
        // Serial.print("time"); Serial.println(_dataLBS.time);

        /* Get battery */
        _dataSIM.batLevel = IN_GetBat();

        // imei, mode, modeGPS, %pin, thời gian gửi, kinh độ, vĩ độ
        
        // {
        //  "imei": "87xx", "mode":"normal", "modeGPS": "GPS", "battery": "30",
        //  "date": "30/01/2024", "time": "04:07:03", "longitude": "106.80973733", 
        //  "latitude": "10.88085467" 
        //  }

        sizePubMsg = sprintf( (char*)pubMsg,     
        "{"
        "\"imei\": \"%s\",\"mode\": \"%s\", \"modeGPS\": \"%s\", \"battery\": \"%d\", "
        "\"date\": \"%s\", \"time\": \"%s\", \"longitude\": \"%s\", \"latitude\": \"%s\""
        "}",
            _dataSIM.imei, _dataSIM.modeSet, MSG_MODE_LBS, _dataSIM.batLevel,
            _dataLBS.date, _dataLBS.time, _dataLBS.longtitude, _dataLBS.latitude
         );
        
        sysMode = SYS_SENDDATA;
        break;  
    case SYS_SENDDATA:


        Serial.write(pubMsg, sizePubMsg);

        /* Connect server */
        if(_dataSIM.modeSet == MSG_MODE_SET_SLEEP) {
            ConnectServer();

            // A7672S_MQTTDisconnect();
        }

        if( A7672S_MQTTPubMsg(_dataSIM.myPubTopic, (char*)pubMsg, _dataSIM.sizePubTopic, sizePubMsg) == 0 ){
            A7672S_MQTTDisconnect();
            ConnectServer();
            A7672S_MQTTPubMsg(_dataSIM.myPubTopic, (char*)pubMsg, _dataSIM.sizePubTopic, sizePubMsg);
        }

        _timeOut = TIMEOUT_WAIT_MSG_SERVER;
        sysMode = SYS_WAITMSG_FROMSERVER;
        break;  
    case SYS_SENGSMS:

        break;  
    case SYS_PROCESSCMD:

        break;     

    case SYS_CHECKSMS:
        if(ProcessRecvSMS( A7672S_PHONEGetUnReadMsg() )){
            ESP.restart();
        }

        A7672S_PHONEDeleteUnread();


        sysMode = SYS_IDLING;

    break;

    case SYS_WAITMSG_FROMSERVER:
        if(Serial1.available()){
            serverMsg = "";
            while(Serial1.available()){
                serverMsg = Serial1.readString();
            }    

            Serial.println(serverMsg);

            if(ProcessServerMsg() == 1){
                SaveToEEPROM();
                sysMode = SYS_CHECKWORKMODE;
            }
        }
        

        // if(_dataSIM.modeSet == MSG_MODE_SET_SLEEP) {
        //     if(_timeOut == 0){
        //         sysMode = SYS_CHECKWORKMODE;
        //     }
        // }
        // else {
        //     sysMode = SYS_CHECKWORKMODE;
        // }

        sysMode = SYS_CHECKWORKMODE;
    break;
    default:
        sysMode = SYS_INIT;
        break;
    }
}
