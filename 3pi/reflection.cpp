#include "mbed.h"
#include "m3pi_ng.h"

m3pi m3pi;

int sensors[5];

int main() {
    wait(0.1);
    m3pi.sensor_auto_calibrate();
    
    while (1) {
		// return array of intensities at each sensor
    m3pi.calibrated_sensor (sensors);
    m3pi.locate(0,0);
    m3pi.printf("%d", sensors[2]);
		wait(0.01);
    }
}
