#include "mbed.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi.h"
#include <string.h>
#include <stdlib.h>
#include <math.h>


#define SERVIP "192.168.137.1"
#define SERVPORT 1234
#define ROBOT_ID 1

/**
    The mbed-sockets-control program implements the ability to control a Pololu
    3pi robot over WiFi using TCP sockets. The robot must have an ESP8266 WiFi
    module, preconfigured to connect to the relevant WiFi network.
    Author: Hrutvik Kanabar
    Date: 14/02/2017
*/


ESP8266Interface wifi(p28, p27);
SocketAddress server(SERVIP, SERVPORT);
TCPSocket socket;

m3pi m3pi;
Serial pc(USBTX, USBRX); // tx, rx
PwmOut led1(LED1);
PwmOut led2(LED2);
PwmOut led3(LED3);
PwmOut led4(LED4);

float currentX = 0.0;
float currentY = 0.0;
float currentOrienation = 0.0;

void tcp_control(){
    // expect instructions of form <direction> <speed> <duration> <termination>
    // 'forward', 'left', 'backward', 'right' for <direction>; integer from 0001 to 9999 for <speed>, <duration>; '\n' for <termination>
    // duration is in thousandths of seconds, speed is relative to m3pi max speed - scaled to between 0.0 and 1.0
    char received[256];
    memset(received, '\0', sizeof(received));
    
    while(true) {
        //ASSUME THAT INSTRUCTION IS WELL_FORMED
        
        //TODO: MUST LOOP AND ACCEPT INDIVIDUAL BYTES COS SOCKETS ARE STUPID
        
        
        // receive <direction> <speed> <duration> <termination> into received array
        socket.recv(received, (sizeof received)-1); // ensure final '\0' character is never ovewritten to allow for use of string methods
        
        // calculate no. chars in instruction before first '\n' (i.e. termination character)
        int instr_size = strcspn(instruction, '\n');
        
        // copy across instruction-only bytes (i.e. before '\n')
        char instruction[instr_size+1];
        memset(instruction, '\0', sizeof(instruction)); // ensure final character is '\0'
        strncpy(instruction, received, instr_size);
        
       
        // split instruction up into token separated by ' ' delimiter
        char *direction;
        float speed;
        float duration;
        const char delim[2] = " "; // instruction delimiter
        
        // get the first token
        token = strtok(str, delim);
        strcpy(direction, token);
        
        if (strcmp(direction, "STOP") == 0){
            waitForResume();
        } else if (strcomp(direction, "RESUME") == 0){
            continue;
        } else {
            // assume that <speed> <duration> follow
            token = strtok(NULL, delim);
            speed = ((float) atoi(token))/1000.0;
            token = strtok(NULL, delim);
            duration = ((float) atoi(token))/1000.0;
            if (strcmp(direction, "forward") == 0){
                moveForward(speed, duration);
            } else if (strcmp(direction, "backward") == 0){
                moveBackward(speed, duration);
            } else if (strcmp(direction, "left") == 0){
                m3pi.left(speed);
                led2 = speed;
                wait(duration);
                m3pi.stop();
                led2 = 0.0;
                updateOrientation(speed, duration);
            } else if (strcmp(direction, "right") == 0){
                m3pi.right(speed);
                led4 = speed;
                wait(duration);
                m3pi.stop();
                led2 = 0.0;
                updateOrientation(-speed, duration);
            } else {
                continue; //not expected - would imply malformed instruction
            }
            //TODO: OUTPUT DONE: ID    
        }   
    }
}

void waitForResume(){ // ASSUMPTION: RESUME is first instruction received after STOP
    char resume[8];
    memset(resume, '\0', sizeof(resume)); // ensure final character is '\0'
    for (int i = 0; i < 

    
}

void moveForward(float speed, float duration){
    float timeBetweenSamples = 0.1/speed;
    int noSamples = floor(duration/timeBetweenSamples);
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples+1];
    m3pi.forward(speed);
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples);
        intensities[i] = m3pi.line_position();
        xs[i] = currentX;
        ys[i] = currentY;
        updatePosition(speed, timeBetweenSamples);
    }
    wait(duration - (noSamples * timeBetweenSamples));
    updatePosition(speed, duration - (noSamples * timeBetweenSamples));
    m3pi.stop();
}

void moveBackward(float speed, float duration){
    float timeBetweenSamples = 0.1/speed;
    int noSamples = floor(duration/timeBetweenSamples);
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples+1];
    m3pi.backward(speed);
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples);
        intensities[i] = m3pi.line_position();
        xs[i] = currentX;
        ys[i] = currentY;
        updatePosition(-speed, timeBetweenSamples);
    }
    wait(duration - (noSamples * timeBetweenSamples));
    updatePosition(-speed, duration - (noSamples * timeBetweenSamples));
    m3pi.stop();
}

void updatePosition(float speed, float duration){
    //TODO: update currentX, currentY based on speed, duration of forward/backward
        // movement - use negative speed to represent backward
}

void updateOrientation(float rotationSpeed, float duration){
    //TODO: update currentOrienation based on speed, duration of right/left
        // movement - use negative rotationSpeed to represent right rotation
}

int main() {
    m3pi.locate(0,1);
    m3pi.printf("TCP");
    printf("\n\n******************************\n");
    printf("ESP8266 WiFi control\n");

    // Brings up the esp8266
    wifi.connect();
    printf("Connected: \n");
    const char *ip = wifi.get_ip_address();
    printf("IP address is %s\n", ip ? ip : "No IP");
    const char *mac = wifi.get_mac_address();
    printf("MAC address is %s\n", mac ? mac : "No MAC");

    // Establish socket connection
    socket.open(&wifi);
    socket.connect(server);

    // Start controller
    tcp_control();

    // Close the socket to return its memory and bring down the network interface
    socket.close();

    // Brings down the esp8266
    wifi.disconnect();
    printf("Done\n");
}
