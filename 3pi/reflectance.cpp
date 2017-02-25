// print line position / reflectance on 3pi screen
#include "mbed.h"
#include "m3pi.h"

m3pi m3pi;

void turnCounterClockwise(int degree) {
    // Turn left at half speed
    m3pi.left(0.5);
    wait (degree * 0.554 / 360.0);
    m3pi.stop();
}
    
void turnClockwise(int degree) {
    // Turn right at half speed
    m3pi.right(0.5);
    wait (degree * 0.554 / 360.0);
    m3pi.stop();
}

void goForwards(int distance) {
    // goes forward distance mm
    m3pi.forward(0.5);
    wait (distance / 470.0);
    m3pi.stop();
}
    
void goBackwards(int distance) {
    // goes backwards distance mm
    m3pi.backward(0.5);
    wait (distance / 470.0);
    m3pi.stop();
}

int main() {
    wait(0.2);
    m3pi.sensor_auto_calibrate();
    wait(0.2);
    while(1) {
        m3pi.locate(0,1);
        float line = m3pi.line_position();
        m3pi.printf("%f", line);
        wait(0.1);
        m3pi.cls();
    }
}
