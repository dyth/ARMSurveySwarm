#include "mbed.h"
#include "m3pi_ng.h"

m3pi m3pi;

int sensors[5];

int main() {
    m3pi.sensor_auto_calibrate();
    
    while (1) {
        m3pi.calibrated_sensor (sensors);
        for (int i = 0; i < 5; i++) {
            m3pi.locate(0,0);
            m3pi.printf("%f", sensors[i]);
            wait(0.1);
        }
    }
}
