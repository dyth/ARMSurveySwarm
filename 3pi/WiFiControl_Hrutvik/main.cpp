#include "mbed.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi.h"
#include <string.h>
#include <stdlib.h>

// definitions: IP and port of TCP server to connect to; SSID/password of WiFi network; unique ID of robot
#define SERVIP "192.168.46.2"
#define SERVPORT 8000
#define SSID "HRKPrint"
#define PASSWORD "qwertyuiop"
#define ROBOT_ID 1

/**
    This program implements the ability to control a Pololu
    3pi robot over WiFi using TCP sockets. The robot must have an ESP8266 WiFi
    module, preconfigured to connect to the relevant WiFi network.
    Author: Hrutvik Kanabar
    Date: 26/02/2017
*/


ESP8266Interface wifi(p28, p27);
SocketAddress server(SERVIP, SERVPORT);
TCPSocket socket;

m3pi m3pi; // robot
Serial pc(USBTX, USBRX); // serial connection to PC for debugging/inspection

/***** POSITION: current position of robot and update methods *****/
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
// sends lists of x-coordinates, y-coordinates, intensities over TCP
    // format is: "(x_1,y_1,intensity_1);...;(x_n,y_n,intensity_n);\n"
    // where each x_i, y_i, intensity_i are formatted: +x.xxx, +y.yyy, +i.iii
void sendXYIs(float* xs, float* ys, float* intensities, int length){
    //each entry to send is of format: (+x.xxx,+y.yyy,+i.iii); - 23 chars, then \n\0 at end
    char toSend[(length * 23) + 2]; // final string/list to send
    memset(toSend, '\0', sizeof(toSend));
    
    for (int i = 0; i < length; i++){
        char entry[24]; memset(entry, '\0', sizeof(entry)); // single entry to append to list
        char x[7]; memset(x, '\0', sizeof(x)); // single x-coordinate to send
        char y[7]; memset(y, '\0', sizeof(y)); // single y-coordinate to send
        char intensity[7]; memset(intensity, '\0', sizeof(intensity)); //single intensity to send
        
        // dark magic: use sprintf formatting to give correct lenghts and padding
        // -  option: left-align numbers in field (not really necessary)
        // +  option: puts sign in front of number, "+" or "-"
        // 0  option: pads with "0"s instead of " "s
        // *  option: total length of string, specified by later argument to sprintf (6 in our case)
        // .* option: precision of floating point string, max no. decimal places (3 in our case)
        sprintf(x, "%-+0*.*f", 6, 3, xs[i]);
        sprintf(y, "%-+0*.*f", 6, 3, ys[i]);
        sprintf(intensity, "%-+0*.*f", 6, 3, intensities[i]);

        // format brackets, commas, semicolons for each entry
        strcat(entry, "(");
        strcat(entry, x);
        strcat(entry, ",");
        strcat(entry, y);
        strcat(entry, ",");
        strcat(entry, intensity);
        strcat(entry, ");");
        strcat(toSend, entry); // append to result string
    }
    strcat(toSend, "\n"); // append "\n" termination character
    socket.send(toSend, sizeof(toSend)-1); // send - don't include the "\0" null character
}

void moveForward(float speed, float duration){
    // determine time between sample readings and no. of samples to take based on 
        // speed and duration of movements - values determined by testing
    float timeBetweenSamples = 0.1/speed;
    int noSamples = floor(duration/timeBetweenSamples); //TODO: calibrate this
    // lists to store (x, y, intensity) values
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples];
    
    m3pi.forward(speed); // start moving
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples); // wait one time period
        intensities[i] = m3pi.line_position(); // poll and store intensity
        xs[i] = currentX; // store x
        ys[i] = currentY; // store y
        updatePosition(speed, timeBetweenSamples); // update robot's current position
    }
    wait(duration - (noSamples * timeBetweenSamples)); // wait for remainder of duration
    updatePosition(speed, duration - (noSamples * timeBetweenSamples)); // update position one final time
    m3pi.stop(); // end movement
    sendXYIs(xs, ys, intensities, noSamples); // send (x, y, intensity) list over TCP
}

void moveBackward(float speed, float duration){
    // determine time between sample readings and no. of samples to take based on 
        // speed and duration of movements - values determined by testing
    float timeBetweenSamples = 0.1/speed; 
    int noSamples = floor(duration/timeBetweenSamples); //TODO: calibrate this
    // lists to store (x, y, intensity) values
    float xs[noSamples];
    float ys[noSamples];
    float intensities[noSamples];
    
    m3pi.backward(speed); // start moving
    for (int i = 0; i < noSamples; i++){
        wait(timeBetweenSamples); // wait one time period
        intensities[i] = m3pi.line_position(); // poll and store intensity
        xs[i] = currentX; // store x
        ys[i] = currentY; // store y
        updatePosition(-speed, timeBetweenSamples); // update robot's current position
    }
    wait(duration - (noSamples * timeBetweenSamples)); // wait for remainder of duration
    updatePosition(-speed, duration - (noSamples * timeBetweenSamples)); // update position one final time
    m3pi.stop(); // end movement
    sendXYIs(xs, ys, intensities, noSamples); // send (x, y, intensity) list over TCP
}

/***** CONTROL: controlling m3pi *****/
void tcp_control(){
    // expect instructions of form <direction> <x> <y> <speed> <duration> <termination>
    // 'forward', 'left', 'backward', 'right' for <direction>; integer from 0001 to 9999 for <speed>, <duration>; '\n' for <termination>
    // duration is in thousandths of seconds, speed is relative to m3pi max speed - scaled to between 0.0 and 1.0
    
    char received[256]; // buffer to store received instructions
    memset(received, '\0', sizeof(received));
    
    // send hello message on connection
    char hello[10]; 
    sprintf(hello,"HELLO: %d\n",ROBOT_ID);
    socket.send(hello, sizeof(hello)-1); // don't include "\0" termination character
    
    while(true) {
        //ASSUMPTION: INSTRUCTION IS WELL_FORMED, AND IS LESS THAN 256 BYTES
        
        // loop, receiving single bytes of instruction - keep instr_size as counter of no. bytes received
        int instr_size = 0;
        char r;
        socket.recv(&r, sizeof(char));
        while (r != '\n'){ //"\n" is termination character for an instruction
            received[instr_size] = r;
            instr_size++;
            socket.recv(&r, sizeof(char));
        }
        
        // copy across instruction bytes into a new array
        char instruction[instr_size+1];
        memset(instruction, '\0', sizeof(instruction)); // ensure final character is '\0'
        strncpy(instruction, received, instr_size);

        // split instruction up into tokens separated by ' ' delimiter
        char direction[9]; // max direction length: "backward\0", 9
        memset(direction, '\0', sizeof(direction));
        const char delim[3] = ", "; // instruction delimiter
                
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
        } else if (strcmp(direction, "RESUME") == 0){ // received a random RESUME instruction
            continue;
        } else if (strcmp(direction, "START") == 0){ // received a calibration instruction
            //TODO: CALL RAMP CODE
            
            // send confirmation of calibration
            char reset[10];
            sprintf(reset,"RESET: %d\n",ROBOT_ID);
            socket.send(reset, sizeof(reset)-1); 
        } else if (strcmp(direction, "WAIT") == 0){ // received a wait instruction
            // determine time to wait, then wait
            float waitTime;
            token = strtok(NULL, delim);
            waitTime = ((float) atoi(token))/1000.0;
            wait(waitTime);
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1); 
        } else { // we have received a genuine direction for movement
            // assume that <x> <y> <speed> <duration> directly follow
                // update currentX, currentY and determine speed/duration of movement
            float speed;
            float duration;
            token = strtok(NULL, delim);
            currentX = ((float) atoi(token))/1000.0;        
            token = strtok(NULL, delim);
            currentY = ((float) atoi(token))/1000.0;        
            token = strtok(NULL, delim);
            speed = ((float) atoi(token))/10000.0;        
            token = strtok(NULL, delim);
            duration = ((float) atoi(token))/1000.0;
        
            // execute movement command
            if (strcmp(direction, "forward") == 0){
                moveForward(speed, duration);
            } else if (strcmp(direction, "backward") == 0){
                moveBackward(speed, duration);
            } else if (strcmp(direction, "left") == 0){
                m3pi.left(speed);
                wait(duration);
                m3pi.stop();
                updateOrientation(speed, duration); // update orientation after rotation
            } else if (strcmp(direction, "right") == 0){
                m3pi.right(speed);
                wait(duration);
                m3pi.stop();
                updateOrientation(-speed, duration); // update orientation after rotation
            } else {
                continue; //not expected - would imply malformed instruction
            }
            // send done message
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1); // don't include "\0" termination character
        }   
    }
}
         
/***** MAIN *****/
int main() {
    // setup: print greeting messages
    m3pi.locate(0,1);
    m3pi.printf("November");
    printf("\n\n******************************\n");
    printf("ESP8266 WiFi control\n");

    // Bring up the ESP8266 WiFi connection
    wifi.connect(SSID, PASSWORD);
    
    // print connection details to PC for debugging
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

    // Bring down the ESP8266 WiFi connection
    wifi.disconnect();
    printf("Done\n");
}
