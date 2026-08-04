#include "input.h"

uint8_t pinBaterry;


// 77 = 3.6


void IN_Init(uint8_t pinBat){
    pinBaterry = pinBat;
    pinMode(pinBat, INPUT);
}

uint16_t IN_GetBat(void){
    uint16_t result;

    result = analogRead(pinBaterry);

    result = map(result, PIN_LEVEL_LOW * 4095 / 3.3, PIN_LEVEL_FULL * 4095 / 3.3, 0, 100);
    
    return result;
}