#ifndef _FSM_H_
#define _FSM_H_

#include <Arduino.h>
#include <EEPROM.h>


#include "A7672S.h"
#include "global.h"
#include "input.h"


/*----------MODE FSM-------------*/
#if 1
#define SYS_INIT                0
#define SYS_IDLING              1
#define SYS_GETGPS              2
#define SYS_GETLBS              3
#define SYS_SENDDATA            4
#define SYS_SENGSMS             5
#define SYS_PROCESSCMD          6
#define SYS_GETLOCATION         7
#define SYS_IDLEBEFORESLEEP     8
#define SYS_CHECKSMS            9
#define SYS_WAKEUPAFTERSLEEP    10
#define SYS_CHECKWORKMODE       11
#define SYS_WAITMSG_FROMSERVER  12

#endif

/*----------LOCATION GET TYPE-------------*/
#define MODESIM_GPS_LBS            1
#define MODESIM_GPS                2
#define MODESIM_LBS                3

/*----------WORK MODE-------------*/
#define MODEESP_NORMAL             1
#define MODEESP_SLEEP              2


/*----------TIME-------------*/
#define EXCECUTING_CYCLE            50        //50

#define TIME_SEND_DEFAULT           (120000 / EXCECUTING_CYCLE)
#define TIME_CHECK_SMS              (600000 / EXCECUTING_CYCLE)

#define TIMEOUT_WAIT_MSG_SERVER     (30000 / EXCECUTING_CYCLE)      
/*----------MSG SERVER-------------*/
#define MSG_MODE_SET_NORMAL         "normal"
#define MSG_MODE_SET_SLEEP          "sleep"

#define MSG_MODE_GPS_LBS            "GPS_LBS"
#define MSG_MODE_GPS                "GPS"
#define MSG_MODE_LBS                "LBS"


/*----------MSG SMS-------------*/
#define MSG_SMS_CMD_RESET           "111"

/************************************************************
*                   HIGH LEVEL FUNCTION                     *
*************************************************************/
void FSM_Init(void);
void FSM_Process(void);

void SaveToEEPROM(void);



#endif // !_FSM_H_