// print line position / reflectance on 3pi screen
#include "mbed.h"
#include "m3pi.h"

m3pi m3pi;

void TurnCounterClockwise(int degree) {
        m3pi.left(0.5);             // Turn left at half speed
        wait (degree * 0.5538461538461539 / 360.0);
    }

int main() {
    
    m3pi.sensor_auto_calibrate();
    wait(0.5);
    TurnCounterClockwise(360);
    m3pi.stop();
    
    while(1) {
        m3pi.locate(0,1);
        float line = m3pi.line_position();
        m3pi.printf("%f", line);
        wait(0.1);
        m3pi.cls();
    }  
}
