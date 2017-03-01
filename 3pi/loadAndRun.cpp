#include "mbed.h"
#include "m3pi.h"
#include <algorithm>

#define DEBOUNCE 2

// Minimum and maximum motor speeds
#define MAX 1.0
#define MIN 0.0
 
// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

m3pi m3pi;
// 0.51, 530

void turnCounterClockwise(int degree) {
    // Turn left at half speed
    //m3pi.stop();
    m3pi.left(0.15f);
    wait(((float) degree) * 3.388f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}

void turnClockwise(int degree) {
    // Turn right at half speed
    //m3pi.stop();
    m3pi.right(0.15f);
    wait(((float) degree) * 3.388f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}

void goForwards(int distance) {
    // goes forward distance mm
    //m3pi.stop();
    //m3pi.forward(0.25);
    //wait(0.2f);
    m3pi.forward(1.0f);
    wait(((float) distance) / 960.0f);
    //m3pi.forward(0.25f);
    //wait(0.2f);
    m3pi.stop();
    wait(1.0f);
}

void raster() {
}

int main() {
    wait(0.5);
    //raster();
    //raster();
    goForwards(2000);
    turnCounterClockwise(180);
    goForwards(2000);
    //turnClockwise(720);
}

float sum (float* rotations) {
    // sum up debounce array
    float s = 0.0f;
    for (int j = 0; j < DEBOUNCE; j++) {
        s += rotations[j];
    }
    return s;
}

float limit(float speed) {
    // ensures speed is between MIN amd MAX
    if (speed < MIN) {
        return MIN;
    } else if (speed > MAX) {
        return MAX;
    } else {
        return speed;
    }
}

void PID() {
  
    m3pi.cls();
    m3pi.locate(1,0);
    m3pi.printf("PID");
 
    wait(0.5);
    m3pi.sensor_auto_calibrate();
 
    float right;
    float left;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative,proportional,integral = 0;
    float power;
    float speed = MAX;
    
    // create array for debouncing and fill it with a starting
    float rotations[DEBOUNCE];
    std::fill(rotations, rotations + DEBOUNCE, 1.0f);
    int count = 0;
    
    float s = 1.0f;
    
    while (s != 0.0f) {
        // Get the position of the line.
        current_pos_of_line = m3pi.line_position();        
        proportional = current_pos_of_line;
        
        // Compute the derivative, integral, remember previous position
        derivative = current_pos_of_line - previous_pos_of_line;
        integral += proportional;
        previous_pos_of_line = current_pos_of_line;
        
        // Compute the power and use it to find new speeds
        power = (proportional * (P_TERM) ) + (integral*(I_TERM)) + (derivative*(D_TERM));
        right = speed+power;
        left  = speed-power;
        
        // set speed at limits
        left = limit(left);
        right = limit(right);
        m3pi.left_motor(left/2);
        m3pi.right_motor(right/2);
        
        // do some debouncing
        rotations[count++] = left;
        if (count == DEBOUNCE) {
            count = 0;
        }
        s = sum(rotations);
    }
    m3pi.stop();
}

int main() {
  PID();
  
  turnClockwise(170);
}
    
