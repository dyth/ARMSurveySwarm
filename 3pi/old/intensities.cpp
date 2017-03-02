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

		// return value of position of line
		float position = m3pi.sensor_auto_calibrate();

        m3pi.locate(0,0);
        m3pi.printf("%d", sensors[0]);
		m3pi.locate(3,0);
        m3pi.printf("%d0", sensors[1]);
		m3pi.locate(6,0);
        m3pi.printf("%d", sensors[2]);
		m3pi.locate(1,1);
        m3pi.printf("%d", sensors[3]);
		m3pi.locate(4,1);
        m3pi.printf("%d", sensors[4]);
		
		m3pi.locate(7,1);
		m3pi.printf("%f", position);
		
		wait(0.1);
    }
}
