#ifndef _A7672S_H_
#define _A7672S_H_


#include <Arduino.h>

#include "fsm.h"
#include "global.h"

/************************************************************
*                   HIGH LEVEL FUNCTION                     *
*************************************************************/

/*----------GENERAL FUNCTIONS-------------*/
#if 1
void A7672S_Init(uint8_t DTR, uint8_t TX, uint8_t RX, uint16_t baudrate);

uint8_t A7672S_GetSIMEI(char* simei);
uint8_t A7672S_GetPhoneNum(char* phoneNum);

void A7672S_EnterSleepMode(void);
void A7672S_Wakeup(void);

uint8_t A7672S_CheckAT(void);
void A7672S_OnRiInt(void);

void A7672S_SetModeLTE_GSM(void);
void A7672S_SetModeGSM(void);
void A7672S_SetModeLTE(void);

#endif

/*----------MQTT FUNCTIONS-------------*/
#if 1
void A7672S_MQTTStart(char* clientID, char* port, uint8_t isSLL);
void A7672S_MQTTConnect(char* server, char* userName, char* userPass, char* port);
void A7672S_MQTTDisconnect(void);

void A7672S_MQTTStop(void);
uint8_t A7672S_MQTTPubMsg(char* topic, char* msg, uint16_t topicSize, uint16_t msgSize);
void A7672S_MQTTGetMSG(char* msg, uint16_t size);
void A7672S_MQTTSubTopic(char* topic, uint16_t size);
void A7672S_MQTTSetWillMsg(char* topic, char* msg, uint16_t topicSize, uint16_t msgSize);


#endif

/*----------SMS FUNCTIONS-------------*/
#if 1

void A7672S_PHONESendMsg(char* phoneNum, char* msg);
void A7672S_PHONECall(char* phoneNum);
String A7672S_PHONEGetUnReadMsg(void);
void A7672S_PHONEDeleteUnread(void);


#endif


/*----------GNSS FUNCTIONS-------------*/
#if 1
uint8_t A7672S_GNSSPWROn(void);

// uint8_t A7672S_GPSInit(uint8_t TX, uint8_t RX, uint16_t baudrate);

uint8_t A7672S_GPSIsAvailable(void);
uint8_t A7672S_GPSGetInfor(String* longtitude, String* latitude, String* altitude, 
                        String* date, String* time,
                        String* speed, String* course);

uint8_t A7672S_LBSGetLocation_Date(String* longtitude, String* latitude, String* date, String* time);

uint8_t A7672S_GPSMEAGetInfor(String* longtitude, String* latitude, String* altitude, 
                        String* date, String* time,
                        String* speed, String* course);
#endif




#endif // !_A7672S_H_