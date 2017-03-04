#include "motion.h"
#include "MbedJSONValue.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include <string>

#define ASIZE(array) (sizeof((array))/sizeof((array[0])))

#define SERVIP "192.168.46.2"
#define SERVPORT 9000
#define SSID "private_network152"
#define PASSWORD "CelesteAqua78"

void readAndDecodeInstruction(MbedJSONValue &instruction);
void sendDone(int intensities[], int count);
void handleStart(MbedJSONValue &instruction);
void handleMove(MbedJSONValue &instruction);
void handleStop(MbedJSONValue &instruction);
void handleWait(MbedJSONValue &instruction);
void sendHello();
void run();
