#ifndef _INPUT_H_
#define _INPUT_H_


#include <Arduino.h>

#define PIN_LEVEL_LOW           (3.2 / 2)
#define PIN_LEVEL_FULL          (4.2 / 2)


void IN_Init(uint8_t pinBat);
uint16_t IN_GetBat(void);

#endif // !_INPUT_H_