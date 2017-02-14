#include "mbed.h"
#include "TCPSocket.h"
#include "ESP8266Interface.h"
#include "SocketAddress.h"
#include "m3pi.h"

#define SERVIP "192.168.137.1"
#define SERVPORT 1234

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

Thread thread;
void outgoing_thread() {
    while (true) {
        // Determine line position and send over TCP
        signed char linePosition = m3pi.line_position();
        socket.send(&linePosition, sizeof(linePosition));
    }
}

void tcp_control(){
    // expect instructions of form <direction> <speed> <duration> where each is one char
    // 'w', 'a', 's', 'd' for <direction>; integer from 1 to 9 for <speed>, <duration>
    // duration is in tenths of seconds, speed is relative - scaled to between 0.0 and 1.0
    char instruction[1];
    while(true) {
        // receive <direction> <speed> <duration>
        socket.recv(instruction, sizeof instruction);
        char direction = instruction[0];
        socket.recv(instruction, sizeof instruction);
        float speed = ((float) (instruction[0]))/10.0;
        socket.recv(instruction, sizeof instruction);
        float duration = ((float) (instruction[0]));
        // case check <direction>
        if(direction == 'q') {
            break;
        } else if(direction == 'w') {
            m3pi.forward(speed);
            led1 = speed;
            wait(duration);
            led1 = 0.0;
            m3pi.stop();
        } else if(direction == 'a') {
            m3pi.left(speed);
            led2 = speed;
            wait(duration);
            led2 = 0.0;
            m3pi.stop();
        } else if(direction == 's') {
            m3pi.backward(speed);
            led3 = speed;
            wait(duration);
            led3 = 0.0;
            m3pi.stop();
        } else if(direction == 'd') {
            m3pi.right(speed);
            led4 = speed;
            wait(duration);
            led4 = 0.0;
            m3pi.stop();
        }
    }
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

    // Start output of line position
    //thread.start(outgoing_thread);

    // Start controller
    tcp_control();

    // Close the socket to return its memory and bring down the network interface
    socket.close();

    // Brings down the esp8266
    wifi.disconnect();
    printf("Done\n");
}
