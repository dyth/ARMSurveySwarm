# Controlling Pololu m3pi robots over WiFi #

## Setup ##

### Configuring the ESP8266 WiFi module ###

In ```main.cpp``` of ```Pololu/ESP8266_Setup```, change

```
char ssid[32] = "mySSID";     // enter WiFi router ssid inside the quotes
char pwd [32] = "myPASSWORD"; // enter WiFi router password inside the quotes
```

and flash to Pololu 3pi. This can be done using [mBed developer compiler](https://developer.mbed.org/compiler/).

When running the program on the 3pi, monitor the output of the serial port connection using Teraterm or screen, with a baud rate of 115200.

Using screen, find the 3pi robot using `ls /dev/tty.usbmodem*`. Progress can be monitored by `screen /dev/tty.usbmodem1422 115200`

If successful, a non-zero IP address should be assigned to the Pololu.


### Server setup ###

Run ```Server/WiFiController.java``` from a terminal. Usage: ```java WiFiController <port>``` where ```<port>``` is the port on to use for the TCP socket server.

Once a Pololu is connected, its IP and MAC addresses will be shown, and instructions on controlling the Pololu will appear in the console.


### Pololu setup ###

Compile and flash the contents of ```Pololu/PololuController``` as before. Change the following in the ```main.cpp``` file to match the credentials of the WiFi network.

```
#define SERVIP "myIPaddress"
#define SERVPORT myPort
```

For first use, it is recommended that you use a serial port connection to ensure that setup occurs correctly.


##  Controlling the Pololu ##

1. Start the server, and immediately reset the Pololu mbed with the reset button

2. Wait for the Pololu to connect to the computer

3. Follow the instructions in the server console to control the Pololu
