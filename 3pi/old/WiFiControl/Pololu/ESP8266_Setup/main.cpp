#include "mbed.h"

Serial pc(USBTX, USBRX);
Serial esp(p28, p27); // tx, rx
DigitalOut reset(p26);
Timer t;

int  count,ended,timeout;
char buf[1024];
char snd[255];

char ssid[32] = "mySSID";     // enter WiFi router ssid inside the quotes
char pwd [32] = "myPASSWORD"; // enter WiFi router password inside the quotes

void SendCMD(),getreply(),ESPconfig(),ESPsetbaudrate();


int main()
{
    reset=0; //hardware reset for 8266
    pc.baud(115200);  // set what you want here depending on your terminal program speed
    pc.printf("\f\n\r-------------ESP8266 Hardware Reset-------------\n\r");
    wait(0.5);
    reset=1;
    timeout=2;
    getreply();

    esp.baud(115200);   // change this to the new ESP8266 baudrate if it is changed at any time.

    //ESPsetbaudrate();   //******************  include this routine to set a different ESP8266 baudrate  ******************

    ESPconfig();        //******************  include Config to set the ESP8266 configuration  ***********************



    // continuosly get AP list and IP
    while(1) {
        pc.printf("\n---------- Listing Acces Points ----------\r\n");
        strcpy(snd, "AT+CWLAP\r\n");
        SendCMD();
        timeout=15;
        getreply();
        pc.printf(buf);
        wait(2);
        pc.printf("\n---------- Get IP and MAC ----------\r\n");
        strcpy(snd, "AT+CIFSR\r\n");
        SendCMD();
        timeout=10;
        getreply();
        pc.printf(buf);
        wait(2);
    }

}

// Sets new ESP8266 baurate, change the esp.baud(xxxxx) to match your new setting once this has been executed
void ESPsetbaudrate()
{
    strcpy(snd, "AT+CIOBAUD=115200\r\n");   // change the numeric value to the required baudrate
    SendCMD();
}

//  +++++++++++++++++++++++++++++++++ This is for ESP8266 config only, run this once to set up the ESP8266 +++++++++++++++
void ESPconfig()
{
    wait(5);
    strcpy(snd,"AT\r\n");
    SendCMD();
    wait(1);
    strcpy(snd,"AT\r\n");
    SendCMD();
    wait(1);
    strcpy(snd,"AT\r\n");
    SendCMD();
    timeout=1;
    getreply();
    wait(1);
    pc.printf("\f---------- Starting ESP Config ----------\r\n\n");

    pc.printf("---------- Reset & get Firmware ----------\r\n");
    strcpy(snd,"AT+RST\r\n");
    SendCMD();
    timeout=5;
    getreply();
    pc.printf(buf);

    wait(2);

    pc.printf("\n---------- Get Version ----------\r\n");
    strcpy(snd,"AT+GMR\r\n");
    SendCMD();
    timeout=4;
    getreply();
    pc.printf(buf);

    wait(3);

    // set CWMODE to 1=Station,2=AP,3=BOTH, default mode 1 (Station)
    pc.printf("\n---------- Setting Mode ----------\r\n");
    strcpy(snd, "AT+CWMODE=1\r\n");
    SendCMD();
    timeout=4;
    getreply();
    pc.printf(buf);

    wait(2);

    // set CIPMUX to 0=Single,1=Multi
    pc.printf("\n---------- Setting Connection Mode ----------\r\n");
    strcpy(snd, "AT+CIPMUX=1\r\n");
    SendCMD();
    timeout=4;
    getreply();
    pc.printf(buf);

    wait(2);

    pc.printf("\n---------- Listing Access Points ----------\r\n");
    strcpy(snd, "AT+CWLAP\r\n");
    SendCMD();
    timeout=15;
    getreply();
    pc.printf(buf);

    wait(2);

    pc.printf("\n---------- Connecting to AP ----------\r\n");
    pc.printf("ssid = %s   pwd = %s\r\n",ssid,pwd);
    strcpy(snd, "AT+CWJAP=\"");
    strcat(snd, ssid);
    strcat(snd, "\",\"");
    strcat(snd, pwd);
    strcat(snd, "\"\r\n");
    SendCMD();
    timeout=10;
    getreply();
    pc.printf(buf);

    wait(5);

    pc.printf("\n---------- Get IP's ----------\r\n");
    strcpy(snd, "AT+CIFSR\r\n");
    SendCMD();
    timeout=3;
    getreply();
    pc.printf(buf);

    wait(1);

    pc.printf("\n---------- Get Connection Status ----------\r\n");
    strcpy(snd, "AT+CIPSTATUS\r\n");
    SendCMD();
    timeout=5;
    getreply();
    pc.printf(buf);

    pc.printf("\n\n\n  If you get a valid (non zero) IP, ESP8266 has been set up.\r\n");
    pc.printf("  Run this if you want to reconfig the ESP8266 at any time.\r\n");
    pc.printf("  It saves the SSID and password settings internally\r\n");
    wait(10);
}

void SendCMD()
{
    esp.printf("%s", snd);
}

void getreply()
{
    memset(buf, '\0', sizeof(buf));
    t.start();
    ended=0;
    count=0;
    while(!ended) {
        if(esp.readable()) {
            buf[count] = esp.getc();
            count++;
        }
        if(t.read() > timeout) {
            ended = 1;
            t.stop();
            t.reset();
        }
    }
}
