#include "mbed.h"
#include "MbedJSONValue.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi.h"
#include <string>

#define SERVIP "192.168.46.5"
#define SERVPORT 9000
#define SSID "private_network152"
#define PASSWORD "CelesteAqua78"

using namespace std;

Serial pc(USBTX, USBRX); // tx, rx

ESP8266Interface wifi(p28, p27);
SocketAddress server(SERVIP, SERVPORT);
TCPSocket socket;

m3pi robot; // robot

MbedJSONValue readAndDecodeInstruction(){

    // Reads instruction
    char rbuffer[64];
    int rcount = socket.recv(rbuffer, sizeof rbuffer);
    pc.printf("\n**** NEW INSTRUCTION ****\n%s\n", rbuffer);

    // Decode instruction
    MbedJSONValue instruction;
    parse(instruction, rbuffer);

    return instruction;

}

/*
* Called when a START instruction is received.
* Robot gets the tile size in mm and an id.
*/
void handleStart(MbedJSONValue &instruction){

    // Get the tile size and id
    int id = instruction["id"].get<int>();
    double tileSize = instruction["tileSize"].get<double>();

    pc.printf("START(%d, %f)\n", id, tileSize);

}

/*
* Called when a MOVE instruction is received.
* Robot gets the angle in degrees and distance in mm.
*/
void handleMove(MbedJSONValue &instruction){

    // Get the angle and distance
    double angle = instruction["angle"].get<double>();
    double distance = instruction["distance"].get<double>();

    pc.printf("MOVE(%f, %f)\n", angle, distance);

}

/*
* Called when a STOP instruction is received.
*/
void handleStop(MbedJSONValue &instruction){

    pc.printf("STOP\n");

}

/*
* Called when a WAIT instruction is received.
* Robot gets the time to wait in ms
*/
void handleWait(MbedJSONValue &instruction){

    // Get the time to wait
    int time = instruction["time"].get<int>();

    pc.printf("WAIT(%d)", time);

}

/*
* The main loop of execution
* Continuously reads instructions and processes them
*/
void run(){

    while(1){

        // Get the instruction
        MbedJSONValue instruction = readAndDecodeInstruction();

        // Handle instruction
        string type = instruction["type"].get<string>();

        if(type.compare("START") == 0) handleStart(instruction);

        if(type.compare("MOVE") == 0) handleMove(instruction);

        if(type.compare("STOP") == 0) handleStop(instruction);

    }


}

int main() {

    printf("\n\n******************************\n");
    printf("ESP8266 WiFi control\n");

    // Bring up the ESP8266 WiFi connection
    wifi.connect(SSID, PASSWORD);

    // print connection details to PC for debugging
    pc.printf("Connected: \n");
    const char *ip = wifi.get_ip_address();
    pc.printf("IP address is %s\n", ip ? ip : "No IP");
    const char *mac = wifi.get_mac_address();
    pc.printf("MAC address is %s\n", mac ? mac : "No MAC");

    // Establish socket connection
    socket.open(&wifi);
    socket.connect(server);

    pc.printf("Connected\n");

    // Run the main loop
    run();

    /*// SEND MESSAGE BACK
    char msg[] = "All Ok";
    socket.send(msg, sizeof msg);

    // Move
    robot.forward(1.0f);*/

    // Close the socket to return its memory and bring down the network interface
    socket.close();

    // Bring down the ESP8266 WiFi connection
    wifi.disconnect();
    printf("Done\n");


}
