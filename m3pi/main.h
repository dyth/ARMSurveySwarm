#include "motion.h"
#include "MbedJSONValue.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include <string>
#include <sstream>

#define SERVIP "192.168.46.4"
#define SERVPORT 9000
#define SSID "private_network152"
#define PASSWORD "CelesteAqua78"

string vectorToString(vector<int> &v);
void readAndDecodeInstruction(MbedJSONValue &instruction);
void sendDone(vector<int> &intensities);
void handleStart(MbedJSONValue &instruction);
void handleMove(MbedJSONValue &instruction);
void handleStop(MbedJSONValue &instruction);
void handleWait(MbedJSONValue &instruction);
void sendHello();
void run();
