#include "mbed.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi_ng.h"
#include <string.h>
#include <stdlib.h>
#include <math.h>

// definitions: IP and port of TCP server to connect to; SSID/password of WiFi network; unique ID of robot
#define SERVIP "192.168.46.3"
#define SERVPORT 8000
#define SSID "private_network152"
#define PASSWORD "CelesteAqua78"

#define SPEED 0.5f
#define DISTANCE_BETWEEN_SAMPLES 20

#define ROBOT_ID 0
#define DISTANCE_CALIBRATION 470.0f
#define ROTATION_CALIBRATION (0.554f / 360.0f)

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
float currentX = 0.0; //currentX position in mm
float currentY = 0.0; //currentY position in mm
float currentOrientation = 0.0; //currentOrientation in degrees

#define PI 3.14159265
void updatePosition(float speed, float distance){
    float orientation = currentOrientation * PI/180.0;
    if (speed > 0){
      currentX += distance * sin(orientation);
      currentY += distance * cos(orientation);
    } else {
      currentX -= distance * sin(orientation);
      currentY -= distance * cos(orientation);
    }
}

void updateOrientation(int rotation){
    currentOrientation += (float)rotation;
    if (currentOrientation >= 360.0f){
        currentOrientation -= 360.0f;
    }
}


/***** MOVEMENT/SAMPLING: moving forward/backward and sending intensity informtion *****/
// sends lists of x-coordinates, y-coordinates, intensities over TCP
    // format is: "(x_1,y_1,intensity_1);...;(x_n,y_n,intensity_n)\n"
    // where each x_i, y_i, intensity_i are formatted: +x.xxx, +y.yyy, +i.iii
void sendXYIs(float* xs, float* ys, float* intensities, int length){
    //each entry to send is of format: (+x.xxx,+y.yyy,+i.iii); - 23 chars, then "INTENSITY: #ID;" at beginning
        // and "\n\0" at end
    char toSend[13 + (length * 23) + 2     +200]; // final string/list to send
    memset(toSend, '\0', sizeof(toSend));
    char preamble[14];
    memset(preamble, '\0', sizeof(preamble));
    sprintf(preamble,"INTENSITY: %d",ROBOT_ID);
    strcat(toSend, preamble);
    for (int i = 0; i < length; i++){
        strcat(toSend, ";");
        
        char entry[60]; memset(entry, '\0', sizeof(entry)); // single entry to append to list                       24 for entry, 7 for x, y, intensity
        char x[20]; memset(x, '\0', sizeof(x)); // single x-coordinate to send
        char y[20]; memset(y, '\0', sizeof(y)); // single y-coordinate to send
        char intensity[20]; memset(intensity, '\0', sizeof(intensity)); //single intensity to send
        
        // dark magic: use sprintf formatting to give correct lenghts and padding
        // -  option: left-align numbers in field (not really necessary)
        // +  option: puts sign in front of number, "+" or "-"
        // 0  option: pads with "0"s instead of " "s
        // *  option: total length of string, specified by later argument to sprintf (6 in our case)
        // .* option: precision of floating point string, max no. decimal places (3 in our case)
        sprintf(x, "%-+0.*f,", 3, xs[i]);     // 6 instead of 7
        sprintf(y, "%-+0.*f,", 3, ys[i]);
        sprintf(intensity, "%-+0.*f", 3, intensities[i]);
        
        /*
         sprintf(x, "%-+0*.*f,", 7, 3, xs[i]);     // 6 instead of 7
        sprintf(y, "%-+0*.*f,", 7, 3, ys[i]);
        sprintf(intensity, "%-+0*.*f", 7, 3, intensities[i]);
        */
        
        // format brackets, commas, semicolons for each entry
        strcat(entry, "(");
        strcat(entry, x);
//        strcat(entry, ",");
        strcat(entry, y);
//        strcat(entry, ",");
        strcat(entry, intensity);
        strcat(entry, ")");
        strcat(toSend, entry); // append to result string
    }
    printf("\n");
    strcat(toSend, "\n"); // append "\n" termination character
    printf("To send: %s",toSend);
    
    int s = 0;
    while (s < strlen(toSend - 1)){
        int s1 = 500 < (sizeof(toSend) - 1 - s) ? 500 : (sizeof(toSend) - 1 - s);
        socket.send(toSend + s, s1);
        s += s1;
    }
  //  socket.send(toSend, sizeof(toSend)-1); // send - don't include the "\0" null character
}

// Minimum and maximum motor speeds
#define MAX 1.0
#define MIN 0

// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

void loadingBay() {
    wait(0.5);

    m3pi.sensor_auto_calibrate();

    float right;
    float left;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative,proportional,integral = 0;
    float power;
    float speed = MAX;

    int count = 0;

    while (1) {
        count++;

        // Get the position of the line.
        current_pos_of_line = m3pi.line_position();
        proportional = current_pos_of_line;

        // Compute the derivative
        derivative = current_pos_of_line - previous_pos_of_line;

        // Compute the integral
        integral += proportional;

        // Remember the last position.
        previous_pos_of_line = current_pos_of_line;

        // Compute the power
        power = (proportional * (P_TERM) ) + (integral*(I_TERM)) + (derivative*(D_TERM)) ;

        // Compute new speeds
        right = speed+power;
        left  = speed-power;

        // limit checks
        if (right < MIN) {
            right = MIN;
        } else if (right > MAX) {
            right = MAX;
        }

        if (left < MIN) {
            left = MIN;
        } else if (left > MAX) {
            left = MAX;
        }

        if (count > 20 && (right == MIN || left == MIN)) {
            break;
        }

        // set speed
        m3pi.left_motor(left / 2);
        m3pi.right_motor(right / 2);
    }
}

void rotate(int rotation){
    if (rotation <= 0 || rotation >= 360){
        return;
    } else if (rotation <= 180){
        m3pi.left(SPEED);
        wait(((float) rotation) * ROTATION_CALIBRATION);
    } else { // 180 < rotation < 360
        m3pi.right(SPEED);
        wait(((float)(rotation - 180)) * ROTATION_CALIBRATION);
    }
    m3pi.stop();
    updateOrientation(rotation);
}

void move(int distance){
  int noSamples = floor((float)distance/(float)DISTANCE_BETWEEN_SAMPLES);

  // lists to store (x, y, intensity) values
  float xs[noSamples];
  float ys[noSamples];
  float intensities[noSamples];

  if (distance <= 0){ // invalid distance
    return;
  }
  printf("void move(int distance):\nNo. samples: %d\n", noSamples);
  m3pi.forward(SPEED); // start moving
  for (int i = 0; i < noSamples; i++){
      float timeBetweenSamples = ((float) DISTANCE_BETWEEN_SAMPLES) / DISTANCE_CALIBRATION;
      wait(timeBetweenSamples); // wait one time period
      int sensors[5];
      m3pi.calibrated_sensor (sensors);
      intensities[i] = ((float)sensors[2])/1000; // poll and store intensity
      xs[i] = currentX; // store x
      ys[i] = currentY; // store y
      printf(".");
      updatePosition(SPEED, (float) DISTANCE_BETWEEN_SAMPLES); // update robot's current position
      printf(" ");
  }
  float rem = ((float)(distance - DISTANCE_BETWEEN_SAMPLES * noSamples)) / DISTANCE_CALIBRATION;
  wait(rem); // wait for remainder of duration
  updatePosition(SPEED, (float)(distance - DISTANCE_BETWEEN_SAMPLES * noSamples)); // update position one final time
  m3pi.stop(); // end movement
  printf("Stopped moving.\n");
  sendXYIs(xs, ys, intensities, noSamples); // send (x, y, intensity) list over TCP
}

/***** CONTROL: controlling m3pi *****/
void tcp_control(){
    // expect instructions of form <directive> <x> <y> <orientation> <distance> <rotation> <termination>
    // <distance> an integer in mm; <rotation> an integer in degrees; '\n' for <termination>

    // send hello message on connection
    char hello[10];
    sprintf(hello,"HELLO: %d\n",ROBOT_ID);
    socket.send(hello, sizeof(hello)-1); // don't include "\0" termination character
    
    char received[256]; // buffer to store received instructions

    while(true) {
        //ASSUMPTION: INSTRUCTION IS WELL_FORMED, AND IS LESS THAN 256 BYTES
        memset(received, '\0', sizeof(received));
        // loop, receiving single bytes of instruction - keep instr_size as counter of no. bytes received
        int instr_size = 0;
        char r = '\0';
        socket.recv(&r, sizeof(char));
        while (r != '\n'){ //"\n" is termination character for an instruction
            received[instr_size] = r;
            instr_size++;
            socket.recv(&r, sizeof(char));
        }

        // copy across instruction bytes into a new array
        char instruction[instr_size+1+10];
        memset(instruction, '\0', sizeof(instruction)); // ensure final character is '\0'
        strncpy(instruction, received, instr_size);
        
        
        printf("Received: %s    strlen: %d\nInstruction: %s     strlen: %d  instr_size: %d\n", received, strlen(received), instruction, strlen(instruction), instr_size); //DEBUG
        
        
        // split instruction up into tokens separated by ' ' delimiter
        char directive[20]; // instruction directive: START, STOP, RESUME, INSTRUCTION
        memset(directive, '\0', sizeof(directive));
        const char delim[3] = ", "; // instruction delimiter

        // get the first token
        char *token;
        token = strtok(instruction, delim);
        strcpy(directive, token);

        if (strcmp(directive, "STOP") == 0){
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
        } else if (strcmp(directive, "RESUME") == 0){ // received a random RESUME instruction
            continue;
        } else if (strcmp(directive, "START") == 0){ // received a calibration instruction
            // call loading bay code
            //loadingBay();
            // send confirmation of calibration
            char reset[10];
            sprintf(reset,"RESET: %d\n",ROBOT_ID);
            socket.send(reset, sizeof(reset)-1);
        } else if (strcmp(directive, "WAIT") == 0){ // received a wait instruction
            // determine time to wait, then wait
            float waitTime;
            token = strtok(NULL, delim);
            waitTime = ((float) atoi(token))/1000.0;
            wait(waitTime);
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1);
        } else if (strcmp(directive, "INSTRUCTION") == 0){ // we have received a genuine direction for movement
            // assume that <x> <y> <orientation> <distance> <rotation> directly follow
                // update currentX, currentY, currentOrientation and determine speed/duration of movement
            token = strtok(NULL, delim);
            currentX = (float) atoi(token);
            token = strtok(NULL, delim);
            currentY = (float) atoi(token);
            token = strtok(NULL, delim);
            currentOrientation = (float) atoi(token);
            
            int distance;
            int rotation;
            token = strtok(NULL, delim);
            distance = atoi(token);
            token = strtok(NULL, delim);
            rotation = atoi(token);

            printf("x: %f, y: %f, orient: %f, dist: %d, rot: %d\n", currentX, currentY, currentOrientation, distance, rotation);
            rotate(rotation);
            printf("Rotation calibration: %f\n", ROTATION_CALIBRATION);
            printf("Rotated.\n");
            move(distance);
            printf("Moved.\n");

            // send done message
            char done[9];
            sprintf(done,"DONE: %d\n",ROBOT_ID);
            socket.send(done, sizeof(done)-1); // don't include "\0" termination character
        } else {
          // not expected - would imply malformed instruction
        }
        printf("Executed.\n\n"); //DEBUG

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
