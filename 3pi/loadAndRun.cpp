#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <sstream>

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

float leftRotation;
float rightRotation;

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
    m3pi.forward(0.25);
    wait(0.05f);
    m3pi.left_motor(leftRotation);
    m3pi.right_motor(rightRotation);
    wait(((float) distance) / 990.0f);
    m3pi.forward(0.25f);
    wait(0.05f);
    m3pi.stop();
    wait(1.0f);
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

std::string Convert (float number){
    std::ostringstream buff;
    buff<<number;
    return buff.str();   
}

void setRotations(float left, float right) {
    // take the values from the line following and automatically calibrate
    if (right > left) {
        rightRotation = 1.0f;
        leftRotation = right / left;
     } else {
        rightRotation = left / right;
        leftRotation = 1.0f;
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
    float rightTotal;
    float leftTotal;
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
        leftTotal += left;
        rightTotal += right;
    }
    setRotations(leftTotal, rightTotal);
    m3pi.stop();
    m3pi.cls();
    m3pi.locate(0,0);
    m3pi.printf("%s", Convert(leftTotal));
    m3pi.locate(0,1);
    m3pi.printf("%s", Convert(rightTotal));
}

int main() {
    wait(0.5);
    PID();
    turnClockwise(170);
    turnCounterClockwise(90);
    goForwards(2000);
}
    
