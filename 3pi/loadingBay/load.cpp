#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
 
m3pi m3pi;

// Debouncing speed
#define DEBOUNCE 1

// Minimum and maximum motor speeds
#define MAX 1.0
#define MIN 0.0
 
// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

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

int main() {
    
    m3pi.cls();
    m3pi.locate(0,0);
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
    
    // create array for debouncing and fill it with null values
    float rotations[DEBOUNCE];
    std::fill(rotations, rotations + DEBOUNCE, 1.0f);
    int count = 0;
    
    float s = 0.0f;
    
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
        
        m3pi.cls();
        m3pi.locate(0,0);
        //m3pi.printf("%.5s", sum);
        //wait(0.001);
        
    }
    m3pi.stop();
}
