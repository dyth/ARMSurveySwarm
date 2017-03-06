#include "main.h"

using namespace std;

Serial pc(USBTX, USBRX); // tx, rx

ESP8266Interface wifi(p28, p27);
SocketAddress server(SERVIP, SERVPORT);
TCPSocket socket;

void readAndDecodeInstruction(MbedJSONValue &instruction){

    // Reads instruction
    char rbuffer[64];
    int rcount = socket.recv(rbuffer, sizeof rbuffer);
    pc.printf("\n**** NEW INSTRUCTION ****\n%s\n", rbuffer);

    // Decode instruction
    parse(instruction, rbuffer);

}

/*
* Called when a START instruction is received.
* Robot gets the tile size in mm.
*/
void handleStart(MbedJSONValue &instruction){

    // Get the tile size
    int tileSize = instruction["tileSize"].get<int>();

    setTileSize(tileSize);

    pc.printf("START(%d)\n", tileSize);

}

/*
* Called when a MOVE instruction is received.
* Robot gets the angle in degrees and distance in mm.
*/
void handleMove(MbedJSONValue &instruction, vector<int> &intensities){

    // Reset the intensities vector
    intensities.clear();

    // Get the angle and distance
    int angle = instruction["angle"].get<int>();
    int distance = instruction["distance"].get<int>();

    pc.printf("MOVE(%d, %d)\n", angle, distance);

    cycleClockwise(angle, distance, intensities);

    sendDone(intensities);

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

    pc.printf("WAIT(%d)\n", time);

}

void handleAlignCorner(MbedJSONValue &instruction){
    alignCorner();
}

/*
* Initial message sent by the robot to the server
* Robot sends its id for reference
*/
void sendHello(){

    // Create the HELLO message
    MbedJSONValue message;
    message["type"] = "HELLO";
    message["id"] = 0; // TODO -- update this for each robot

    // Serialize the message
    string toSend = message.serialize();

    // Send the message
    socket.send(toSend.c_str(), toSend.size());

    pc.printf("SENDING(%s)\n", toSend);

}

/*
*
*
*/
void sendDone(vector<int> &intensities){

    // Create the DONE message
    MbedJSONValue message;
    message["type"] = "DONE";

    message["count"] = (int)intensities.size();

    // Create a temp JSON object
    MbedJSONValue temp;
    int j = 0;

    for(int i = 0; i < intensities.size(); i++){

        if(i % 20 == 0 && i > 0){
            // Flush the temp
            message["intensities"][j] = temp.serialize();
            j++;
        }

        temp[i % 20] = intensities[i];

    }

    // Flush the temp
    message["intensities"][j] = temp.serialize();

    // Serialize the message
    string toSend = message.serialize();

    // Send the message
    socket.send(toSend.c_str(), toSend.size());

    pc.printf("SENDING(%s, %d)\n", toSend, intensities.size());

}

/*
* The main loop of execution
* Continuously reads instructions and processes them
*/
void run(){

    MbedJSONValue instruction;

    // Create a vector to hold intensities
    vector<int> intensities;

    while(1){

        // Get the instruction
        readAndDecodeInstruction(instruction);

        // Handle instruction
        string type = instruction["type"].get<string>();

        if(type.compare("START") == 0) handleStart(instruction);

        if(type.compare("CORNER") == 0) handleAlignCorner(instruction);

        if(type.compare("MOVE") == 0) handleMove(instruction, intensities);

        if(type.compare("WAIT") == 0) handleWait(instruction);

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

    // Send the HELLO message
    sendHello();

    // Setup robot
    start();

    // Run the main loop
    run();

    // Close the socket to return its memory and bring down the network interface
    socket.close();

    // Bring down the ESP8266 WiFi connection
    wifi.disconnect();
    printf("Done\n");


}
