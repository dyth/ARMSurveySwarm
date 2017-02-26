#include "mbed.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi.h"
#include <string.h>
#include <stdlib.h>
#include <math.h>


#define SERVIP "192.168.46.2"
#define SERVPORT 8000
#define ROBOT_ID 1

/**
    This program implements the ability to control a Pololu
    3pi robot over WiFi using TCP sockets. The robot must have an ESP8266 WiFi
    module, preconfigured to connect to the relevant WiFi network.
    Author: Hrutvik Kanabar
    Date: 23/02/2017
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


/***** POSITION: current position and update methods *****/
float currentX = 0.0;
float currentY = 0.0;
float currentOrienation = 0.0;

void updatePosition(float speed, float duration){
    //TODO: update currentX, currentY based on speed, duration of forward/backward
        // movement - use negative speed to represent backward
}

void updateOrientation(float rotationSpeed, float duration){
    //TODO: update currentOrienation based on speed, duration of right/left
        // movement - use negative rotationSpeed to represent right rotation
}


/***** MOVEMENT/SAMPLING: moving forward/backward and sending intensity informtion *****/
void sendXYIs(float* xs, float* ys, float* intensities, int length){
    char toSend[(length * 23) + 2]; //each entry to send is of format: (+x.xxx,+y.yyy,+i.iii); - 23 chars, then \n\0 at end
    memset(toSend, '\0', sizeof(toSend));
    
    for (int i = 0; i < length; i++){
        char entry[24]; memset(entry, '\0', sizeof(entry));
        char x[7]; memset(x, '\0', sizeof(x));
        char y[7]; memset(y, '\0', sizeof(y));
        char intensity[7]; memset(intensity, '\0', sizeof(intensity));
        
        sprintf(x, "%-+0*.*f", 6, 3, xs[i]);
        sprintf(y, "%-+0*.*f", 6, 3, ys[i]);
        sprintf(intensity, "%-+0*.*f", 6, 3, intensities[i]);

        strcat(entry, "(");
        strcat(entry, x);
        strcat(entry, ",");
        strcat(entry, y);
        strcat(entry, ",");
        strcat(entry, intensity);
        strcat(entry, ");");
        strcat(toSend, entry);
    }
    strcat(toSend, "\n");
    socket.send(toSend, sizeof(toSend)-1);
}

void moveForward(float speed, float duration){
    float timeBetweenSamples = 0.1/speed;
    int noSamples = floor(duration/timeBetweenSamples); //TODO: calibrate this
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples+1];
    m3pi.forward(speed);
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples);
        intensities[i] = m3pi.line_position() + 1.0f; //intensity scaled to within 0.0 - 2.0
        xs[i] = currentX;
        ys[i] = currentY;
        updatePosition(speed, timeBetweenSamples);
    }
    wait(duration - (noSamples * timeBetweenSamples));
    updatePosition(speed, duration - (noSamples * timeBetweenSamples));
    m3pi.stop();
    sendXYIs(xs, ys, intensities, noSamples);
}

void moveBackward(float speed, float duration){
    float timeBetweenSamples = 0.1/speed;
    int noSamples = floor(duration/timeBetweenSamples); //TODO: calibrate this
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples+1];
    m3pi.backward(speed);
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples);
        intensities[i] = m3pi.line_position() + 1.0f; //intensity scaled to within 0.0 - 2.0
        xs[i] = currentX;
        ys[i] = currentY;
        updatePosition(-speed, timeBetweenSamples);
    }
    wait(duration - (noSamples * timeBetweenSamples));
    updatePosition(-speed, duration - (noSamples * timeBetweenSamples));
    m3pi.stop();
    sendXYIs(xs, ys, intensities, noSamples);
}

/***** CONTROL: controlling m3pi *****/
void tcp_control(){
    // expect instructions of form <direction> <x> <y> <speed> <duration> <termination>
    // 'forward', 'left', 'backward', 'right' for <direction>; integer from 0001 to 9999 for <speed>, <duration>; '\n' for <termination>
    // duration is in thousandths of seconds, speed is relative to m3pi max speed - scaled to between 0.0 and 1.0
    char received[256];
    memset(received, '\0', sizeof(received));
    
    char hello[10];
    sprintf(hello,"HELLO: %d\n",ROBOT_ID);
    socket.send(hello, sizeof(hello)-1);
    
    while(true) {
        //ASSUMPTION: INSTRUCTION IS WELL_FORMED, AND IS LESS THAN 256 BYTES
        int instr_size = 0;
        char r;
        socket.recv(&r, sizeof(char));
        while (r != '\n'){
            received[instr_size] = r;
            instr_size++;
            socket.recv(&r, sizeof(char));
        }
        
        // copy across instruction bytes)
        char instruction[instr_size+1];
        memset(instruction, '\0', sizeof(instruction)); // ensure final character is '\0'
        strncpy(instruction, received, instr_size);

        // split instruction up into token separated by ' ' delimiter
        char direction[9];
        memset(direction, '\0', sizeof(direction));
        const char delim[2] = " "; // instruction delimiter
                
        // get the first token
        char *token;
        token = strtok(instruction, delim);
        strcpy(direction, token);

        if (strcmp(direction, "STOP") == 0){
            // wait for "RESUME\n" command - ASSUMPTION: RESUME is first instruction received after STOP
            char resume[8];
            memset(resume, '\0', sizeof(resume)); // ensure final character is '\0'
            for (int i = 0; i < 7; i++){
                socket.recv(resume + i, sizeof(char));
            }
            if(strcmp(resume, "RESUME\n")==0){
                continue;
            } else {
                // by our assumption, this case should not occur
            }
        } else if (strcmp(direction, "RESUME") == 0){ //received a random RESUME instruction
            continue;
        } else if (strcmp(direction, "START") == 0){
            //TODO: CALL RAMP CODE
            char reset[10];
            sprintf(reset,"RESET: %d\n",ROBOT_ID);
            socket.send(reset, sizeof(reset)-1); 
        } else if (strcmp(direction, "WAIT") == 0){
            float waitTime;
            token = strtok(NULL, delim);
            waitTime = ((float) atoi(token))/1000.0;
            wait(waitTime);
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1); 
        } else { // we have received a genuine direction for movement
            float speed;
            float duration;
            // assume that <x> <y> <speed> <duration> follow
            token = strtok(NULL, delim);
            currentX = ((float) atoi(token))/1000.0;        
            token = strtok(NULL, delim);
            currentY = ((float) atoi(token))/1000.0;        
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
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1);    
        }   
    }
}
         
/***** MAIN *****/
int main() {
    m3pi.locate(0,1);
    m3pi.printf("November");
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
