#include "A7672S.h"

#define mySerial            Serial1
#define gpsSerial           Serial2

static String msg;
static uint8_t pinDTR;



/************************************************************
*                   LOW LEVEL FUNCTION                      *
*************************************************************/

uint8_t ProcessServerMsg(String serverMsg){
    int16_t i, j, index;
    String dmyStr;
    String smsPhoneNum, smsMsg;

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


String WaitMsg(uint32_t timeOut){
    uint32_t timeCounter = millis();

    msg = "";

    while((millis() - timeCounter) < timeOut){
        if(mySerial.available()){                      
            // loraMess = mySerial.readString();
            // while(mySerial.available()){
                msg += mySerial.readString();
            // }
            if(msg.indexOf("OK") != -1) break;
            
            if(msg.indexOf("+") != -1) break;
            // break;
        }
        
    }

    if(ProcessServerMsg(msg) == 1){
        SaveToEEPROM();
    }
    return msg;
}



uint32_t AutoBaud(){
    uint32_t rates[] = {115200, 9600};
    for (uint8_t i = 0; i < sizeof(rates) / sizeof(rates[0]); i++) {
        uint32_t rate = rates[i];
        // Serial.printf("Trying baud rate %u\n", rate);
        mySerial.updateBaudRate(rate);
        delay(10);
        for (int j = 0; j < 10; j++) {
            mySerial.print("AT\r\n");
            String input = mySerial.readString();
            if (input.indexOf("OK") >= 0) {
                Serial.printf("Modem responded at rate: %u\n", rate);
                return rate;
            }
        }
    }

    mySerial.updateBaudRate(115200);
    return 0;
}

/************************************************************
*                   HIGH LEVEL FUNCTION                     *
*************************************************************/

/*----------GENERAL FUNCTIONS-------------*/
#if 1
void A7672S_Init(uint8_t DTR, uint8_t TX, uint8_t RX, uint16_t baudrate){
    uint16_t i;
    String str;
    pinDTR = DTR;
    
    pinMode(pinDTR, OUTPUT);
    digitalWrite(pinDTR, 0);

    mySerial.end();
    mySerial.begin(115200, SERIAL_8N1,  RX, TX);

    i = 0;
    do{        

        if(i % 2400 == 0) {
            Serial.println("Reset SIM");

            mySerial.printf("AT+CRESET\r\n");
            // str = WaitMsg(2000);
        }     

        if(mySerial.available()){
            str = mySerial.readString();
            Serial.println(str);
        }

        i++;
        delay(50);
    } while((str.indexOf("PB DONE") == -1));

    Serial.println(WaitMsg(2000));

    mySerial.printf("ATE0\r\n");
    Serial.println(WaitMsg(2000));

}



// return imei size
uint8_t A7672S_GetSIMEI(char* simei){
    String str;
    uint8_t i, j;

    mySerial.printf("AT+SIMEI?\r\n");
    str = WaitMsg(2000);
    Serial.println(str);

    if(str.indexOf("SIMEI") != -1){
        /* Copy all imei */
        i = str.indexOf("+SIMEI: ");
        i += 8;

        // Serial.println(i);

        for(j = 0; j < 15; j++){
            simei[j] = str[i++];
        }

        // strcpy(simei, (str+i).c_str());
    }
    else {
        return 0;
    }

    simei[15] = '\0';
    return 15;
}

uint8_t A7672S_GetPhoneNum(char* phoneNum){

    sprintf(phoneNum, "");
    return 1;
}

void A7672S_SetModeLTE_GSM(void){
    mySerial.printf("AT+CNMP=2\r\n");
    Serial.println(WaitMsg(2000)); 
}

void A7672S_SetModeGSM(void){
    mySerial.printf("AT+CNMP=13\r\n");
    Serial.println(WaitMsg(2000)); 
}

void A7672S_SetModeLTE(void){
    mySerial.printf("AT+CNMP=38\r\n");
    Serial.println(WaitMsg(2000)); 
}

void A7672S_EnterSleepMode(void){


    pinMode(pinDTR, INPUT_PULLDOWN);
    
    mySerial.printf("AT+CSCLK=1\r\n");
    Serial.println(WaitMsg(2000));

    // mySerial.printf("AT+CPOF\r\n");
    // Serial.println(WaitMsg(2000));


    pinMode(pinDTR, INPUT_PULLUP);


}

void A7672S_Wakeup(void){
    pinMode(pinDTR, OUTPUT);
    digitalWrite(pinDTR, 0);

}

uint8_t A7672S_CheckAT(void){
    String str;

    mySerial.printf("AT\r\n");
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("OK") != -1){
        return 1;        
    }

    return 0;
}



void A7672S_OnRiInt(void){
    mySerial.printf("AT+CFGRI=1,60,500\r\n");
    Serial.println(WaitMsg(2000));   
}

#endif

/*----------MQTT FUNCTIONS-------------*/
#if 1

void A7672S_MQTTStart(char* clientID, char* port, uint8_t isSLL){
    mySerial.printf("AT+CMQTTSTART\r\n");
    Serial.println(WaitMsg(2000));

    if(isSLL){
        mySerial.printf("AT+CMQTTACCQ=0,\"%s\",1\r\n", clientID);
    }
    else {
        mySerial.printf("AT+CMQTTACCQ=0,\"%s\",0\r\n", clientID);
    }
    Serial.println(WaitMsg(2000));

}

void A7672S_MQTTConnect(char* server, char* userName, char* userPass, char* port){
    if(userName[0] == '\0'){
        mySerial.printf("AT+CMQTTCONNECT=0,\"tcp://%s:%s\",90,1\r\n", server, port);
    }
    else if(userPass[0] == '\0'){
        mySerial.printf("AT+CMQTTCONNECT=0,\"tcp://%s:%s\",90,1,0,%s\r\n", server, port, userName);
    }
    else {
        mySerial.printf("AT+CMQTTCONNECT=0,\"tcp://%s:%s\",90,1,0,%s,%s\r\n", server, port, userName, userPass);
    }

    Serial.println(WaitMsg(2000));
}

void A7672S_MQTTDisconnect(void){
    mySerial.printf("AT+CMQTTDISC=0,120\r\n");
    Serial.println(WaitMsg(2000));

    mySerial.printf("AT+CMQTTREL=0\r\n");
    Serial.println(WaitMsg(2000));   

    mySerial.printf("AT+CMQTTSTOP\r\n");
    Serial.println(WaitMsg(2000));
}

void A7672S_MQTTStop(void){

}

uint8_t A7672S_MQTTPubMsg(char* topic, char* msg, uint16_t topicSize, uint16_t msgSize){
    String str;
    mySerial.printf("AT+CMQTTTOPIC=0,%d\r\n", topicSize);
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("ERROR") != -1){
        return 0;
    }

    mySerial.printf("%s\r\n", topic);
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("ERROR") != -1){
        return 0;
    }

    mySerial.printf("AT+CMQTTPAYLOAD=0,%d\r\n", msgSize);
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("ERROR") != -1){
        return 0;
    }

    mySerial.printf("%s\r\n", msg);
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("ERROR") != -1){
        return 0;
    }

    mySerial.printf("AT+CMQTTPUB=0,1,60\r\n"); //Acknowledgment
    str = WaitMsg(2000);
    Serial.println(str);
    if(str.indexOf("ERROR") != -1){
        return 0;
    }

    return 1;
}


void A7672S_MQTTGetMSG(char* msg, uint16_t size){

}

void A7672S_MQTTSubTopic(char* topic, uint16_t size){
    mySerial.printf("AT+CMQTTSUBTOPIC=0,%d,1\r\n", size);
    Serial.println(WaitMsg(2000));
    
    mySerial.printf("%s\r\n", topic);
    Serial.println(WaitMsg(2000));

    mySerial.printf("AT+CMQTTSUB=0,%d,1,1\r\n", size);
    Serial.println(WaitMsg(2000));
    
    mySerial.printf("%s\r\n", topic);
    Serial.println(WaitMsg(2000));
}

void A7672S_MQTTSetWillMsg(char* topic, char* msg, uint16_t topicSize, uint16_t msgSize){
    mySerial.printf("AT+CMQTTWILLTOPIC=0,%d\r\n", topicSize);
    Serial.println(WaitMsg(2000));

    mySerial.printf("%s\r\n", topic);
    Serial.println(WaitMsg(2000));

    mySerial.printf("AT+CMQTTWILLMSG=0,%d,0\r\n", msgSize);
    Serial.println(WaitMsg(2000));  

    mySerial.printf("%s\r\n", msg);
    Serial.println(WaitMsg(2000));

}


#endif

/*----------SMS FUNCTIONS-------------*/
#if 1
void A7672S_PHONESendMsg(char* phoneNum, char* msg){
    Serial.println(phoneNum);
    Serial.println(msg);

    mySerial.printf("AT+CMGF=1\r\n");       //text msg
    Serial.println(WaitMsg(2000));

    mySerial.printf("AT+CSCS=\"GSM\"\r\n");       
    Serial.println(WaitMsg(2000));

    mySerial.printf("AT+CMGS=\"%s\"\r\n", phoneNum);       
    Serial.println(WaitMsg(2000));

    mySerial.println(msg);   
    Serial.println(WaitMsg(2000));
    
    mySerial.write((byte)0x1A);       //ctrl-z/esc
    Serial.println(WaitMsg(2000));


}   


void A7672S_PHONECall(char* phoneNum){
    
}

String A7672S_PHONEGetUnReadMsg(void){

    mySerial.printf("AT+CMGL=\"REC UNREAD\"\r\n");       
    msg = WaitMsg(2000);

    // if(str.indexOf("+CMGL") != -1){

    // }   
    
    Serial.println(msg);
    return msg;
}

void A7672S_PHONEDeleteUnread(void){
    mySerial.printf("AT+CMGD=1,1\r\n");       
    Serial.println(WaitMsg(2000));
}

#endif


/*----------GNSS FUNCTIONS-------------*/
#if 1

uint8_t A7672S_GPSInit(uint8_t TX, uint8_t RX, uint16_t baudrate){
    gpsSerial.begin(9600, SERIAL_8N1,  RX, TX);

    return 1;
}


uint8_t A7672S_GNSSPWROn(void){
    String str;
    mySerial.printf("AT+CGNSSPWR=1,0,0\r\n");       
    str = WaitMsg(2000);
    Serial.println(str);

    if(str.indexOf("+CGNSSPWR: READY!") != -1){
        return 1;
    }

    return 0;
}

uint8_t A7672S_GPSIsAvailable(void){
    String str;
    mySerial.printf("AT+CGPSINFO\r\n");       
    str = WaitMsg(2000);  

    if(str.length() > 70){
        return 1;
    }

    return 0;
}

uint8_t A7672S_GPSGetInfor(String* longtitude, String* latitude, String* altitude, 
                        String* date, String* time,
                        String* speed, String* course){
    String str;
    String processStr;
    uint16_t index, i, j;

    mySerial.printf("AT+CGNSSPORTSWITCH=1,1\r\n");       
    str = WaitMsg(2000);  
    Serial.println(str);

    while(str.indexOf("+AGPS: success") != -1){
        mySerial.printf("AT+CAGPS\r\n");       
        str = WaitMsg(2000);  
        Serial.println(str);
    }



    mySerial.printf("AT+CGPSINFO\r\n");       
    str = WaitMsg(2000);  
    Serial.println(str);


    if((str.indexOf("+CGPSINFO") != -1) && (str.length() > 70)){
        str = str.substring(str.indexOf("+CGPSINFO"));

        /* Get latitude */
        index =  str.indexOf(':', index);
        i = str.indexOf(':', index);
        j = str.indexOf(',', index + 1);
        *latitude = str.substring(i+1, j);

        /* Get N/S */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);

        /* Get latitude */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *longtitude = str.substring(i+1, j);

        /* Get E/W */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);

        /* Get date */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *date = str.substring(i+1, j);

        /* Get UTC time */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *time = str.substring(i+1, j);

        /* Get altitude */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *altitude = str.substring(i+1, j);
    
        /* Get speed */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *speed = str.substring(i+1, j);

        /* Get course */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf('\r', index + 1);
        *course = str.substring(i+1, j);  

        return 1;     
    }

    return 0;
}

uint8_t A7672S_LBSGetLocation_Date(String* longtitude, String* latitude, String* date, String* time){
    String str;
    String processStr;
    uint16_t index, i, j;
    uint8_t retCode;

    mySerial.printf("AT+CLBS=4\r\n");       
    str = WaitMsg(2000);
    
    if(str.indexOf("+CLBS") == -1){
        mySerial.printf("AT+CLBS=4\r\n");       
        str = WaitMsg(2000);
    }

    Serial.println(str);
    
    // +CLBS: 0,10.881290,106.809677,550,2024/01/30,11:15:48
    if(str.indexOf("+CLBS") != -1){
        str = str.substring(str.indexOf("+CLBS"));
        index = 0;
        retCode = atoi( str.substring(str.indexOf(' ', 3) + 1, str.indexOf(',')).c_str() );

        if(retCode != 0){
            return 0;     //fail
        }

        /* Get latitude */
        index =  str.indexOf(',', index);
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *latitude = str.substring(i+1, j);

        /* Get longtitude */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *longtitude = str.substring(i+1, j);

        /* Get accuracy */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        
        /* Get date */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *date = str.substring(i+1, j);

        /* Get time */
        index = j;
        i = str.indexOf(',', index);
        // j = str.indexOf(',', index + 1);
        *time = str.substring(i+1);


        return 1;
    }



    return 0;

}

uint8_t A7672S_GPSMEAGetInfor(String* longtitude, String* latitude, String* altitude, 
                        String* date, String* time,
                        String* speed, String* course){

    uint32_t timeCounter = millis();
    uint16_t index, i, j, indexDmy;
    String str;
    String processStr;
    uint8_t returnVal;
    double dmy;

    str = "";
    returnVal = 0;

    //gpsSerial.begin(9600, SERIAL_8N1, RX_2, TX_2);
    gpsSerial.begin(115200, SERIAL_8N1, RX_2,TX_2);

    while(str.indexOf("GNRMC") == -1){
        if(gpsSerial.available()){             
            str = gpsSerial.readStringUntil('$');
        }
        
        if(millis() - timeCounter > 2000) {
            break;
        }
    }

    Serial.println(str);
    // str = "$GNRMC,132143.00,A,2058.50676,N,10552.15420,E,0.508,,200224,,,A,V*15";

    if((str.indexOf("GNRMC") != -1) && (str.length() > 40)){
        // $GNRMC,132143.00,A,2058.50676,N,10552.15420,E,0.508,,200224,,,A,V*15


        index = str.indexOf(',', 0);
        
        /* time */
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
  
        processStr = str.substring(i+1, j);

        *time = processStr.substring(0, 2) + ":" + processStr.substring(2, 4) + ":" + processStr.substring(4, 6);

        /* A, latitude */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *latitude = str.substring(i+1, j); // offset 100
        indexDmy = latitude->indexOf('.');

        (*latitude)[indexDmy] = (*latitude)[indexDmy-1]; 
        (*latitude)[indexDmy-1] = (*latitude)[indexDmy-2];
        (*latitude)[indexDmy-2] = '.';

        dmy = atof((*latitude).c_str());
        dmy = dmy - (int)dmy;
        dmy = (dmy * 100) / 60;
        dmy += (int)atof((*latitude).c_str());

        (*latitude) = String(dmy, 8);

        /* S, longtitude */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *longtitude = str.substring(i+1, j);
        indexDmy = longtitude->indexOf('.');

        (*longtitude)[indexDmy] = (*longtitude)[indexDmy-1]; 
        (*longtitude)[indexDmy-1] = (*longtitude)[indexDmy-2];
        (*longtitude)[indexDmy-2] = '.';

        dmy = atof((*longtitude).c_str());
        dmy = dmy - (int)dmy;
        dmy = (dmy * 100) / 60;
        dmy += (int)atof((*longtitude).c_str());

        (*longtitude) = String(dmy, 8);

        /* E, speed */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        *speed = str.substring(i+1, j);


        /* ,, date */
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        
        index = j;
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);
        processStr = str.substring(i+1, j);

        *date = "20" + processStr.substring(4, 6) + "/" + processStr.substring(2, 4) + "/" + processStr.substring(0, 2);

        returnVal++;
    }

    while(str.indexOf("GNGGA") == -1){
        if(gpsSerial.available()){             
            str = gpsSerial.readStringUntil('$');
        }
        
        if(millis() - timeCounter > 2000) {
            break;
        }
    }
    
    Serial.println(str);

    if((str.indexOf("GNGGA") != -1) && (str.length() > 40)){
        // $GNGGA,132143.00,2058.50676,N,10552.15420,E,1,09,8.88,-61.3,M,,M,,*4E
        index = str.indexOf(',', 0);

        for(i = 0; i < 8; i++){
            j = str.indexOf(',', index + 1);
            index = j;
        }
        
        i = str.indexOf(',', index);
        j = str.indexOf(',', index + 1);

        *altitude = str.substring(i+1, j);

        returnVal++;
    }


    
    gpsSerial.end();
    
    return returnVal == 2;
}



#endif

