#include "motion1.h"
#include "MbedJSONValue.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include <string>

#define SERVIP "192.168.46.6"
#define SERVPORT 9000
#define SSID "private_network152"
#define PASSWORD "CelesteAqua78"

void readAndDecodeInstruction(MbedJSONValue &instruction);
void sendDone(vector<int> &intensities);
void handleStart(MbedJSONValue &instruction);
void handleMove(MbedJSONValue &instruction);
void handleStop(MbedJSONValue &instruction);
void handleWait(MbedJSONValue &instruction);
void sendHello();
void run();
