#ifndef _GLOBAL_H_
#define _GLOBAL_H_

#include <Arduino.h>


/*----------PIN-------------*/
#define RX_1            GPIO_NUM_14
#define TX_1            GPIO_NUM_12

#define RX_2            GPIO_NUM_16
#define TX_2            GPIO_NUM_17

#define PIN_OUT_LED     GPIO_NUM_22
#define PIN_OUT_DTR     GPIO_NUM_33     
#define PIN_IN_RI       GPIO_NUM_25 

#define PIN_IN_BAT      GPIO_NUM_32


/*----------EEPROM-------------*/
#define EEPROM_SIZE                     20
#define EEPROM_INDEX_FIRSTTIME          0
#define EEPROM_INDEX_MODE               1
#define EEPROM_INDEX_MODEGPS            2
#define EEPROM_INDEX_TIMESEND           3


/*----------MQTT SERVER-------------*/
#define MQTT_ISSLL_TLS          0
#define MQTT_BROKER_URL         "27.72.28.3"

// #define MQTT_BROKER_URL         "mqtt-dashboard.com"
#define MQTT_BROKER_PORT        "1883"
#define MQTT_USERNAME           ""
#define MQTT_PASSWORD           ""

#define MQTT_TOPIC              "testTopic"
#define MQTT_WILLTOPIC          "datagps"
#define MQTT_WILLMSG            "willMsg"

#define PHONE_NUM                "0906631096"

typedef struct St_DataSim
{
    String modeSet;
    String modeGPSSet;
    char imei[20];
    char curPhoneNum[20];
    uint32_t timeSendData;
    uint8_t batLevel;
    char myTopicSMS[50];
    char myTopicMode[50];
    char myWillTopic[50]; 
    char myWillMsg[50];
    char myPubTopic[50];
    uint8_t sizePubTopic;
}St_DataSim;


typedef struct St_DataGPS
{
    String date;
    String time;
    String longitude;
    String latitude;
    String altitude;
    String course;
    String speed;
}St_DataGPS;



typedef struct St_DataLBS
{
    String date;
    String time;
    String longtitude;
    String latitude;
}St_DataLBS;


extern St_DataSim _dataSIM;
extern St_DataGPS _dataGPS;
extern St_DataLBS _dataLBS;


extern uint32_t _timeOut;
extern uint32_t _timeSend;
extern uint32_t _timeCheckSMS;

#endif // !_GLOBAL_H_