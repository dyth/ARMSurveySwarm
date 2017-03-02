#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <sstream>

#define DEBOUNCE 2
 
// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

// board size
#define X 2000
#define Y 2000

m3pi m3pi;
// 0.51, 530

float leftRotation;
float rightRotation;
int currentX = 0;
int currentY = 0;

void turnCounterClockwise(int degree) {
    // Turn left at half speed
    //m3pi.stop();
    m3pi.left(0.15f);
    wait(((float) degree) * 2.235f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}

void turnClockwise(int degree) {
    // Turn right at half speed
    //m3pi.stop();
    m3pi.right(0.15f);
    wait(((float) degree) * 2.235f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}


void goForwards(int distance) {
    // goes forward distance mm
    
    // bleed energy, pulse, then anneal
    
    m3pi.forward(0.25f);
    wait(0.2f);
    
    m3pi.left_motor(0.85f);
    m3pi.right_motor(1.0f);
    wait(((float) distance) / 1000.0f);
    
    m3pi.forward(0.25f);
    wait(0.2f);
    
    m3pi.stop();
    wait(0.5f);
}


float sum (float* rotations) {
    // sum up debounce array
    float s = 0.0f;
    for (int j = 0; j < DEBOUNCE; j++) {
        s += rotations[j];
    }
    return s;
}

float limit(float speed, float MIN, float MAX) {
    // ensures speed is between MIN amd MAX
    if (speed < MIN)
        return MIN;
    else if (speed > MAX)
        return MAX;
    else
        return speed;
}

std::string Convert (float number){
    std::ostringstream buff;
    buff<<number;
    return buff.str();   
}

void setRotations(float left, float right) {
    // take the values from the line following and automatically calibrate
    if (left > right) {
        rightRotation = 1.0f;
        leftRotation = right / left;
     } else {
        rightRotation = left / right;
        leftRotation = 1.0f;
    }
    m3pi.cls();
    m3pi.locate(0,0);
    m3pi.printf("%f", rightRotation);
    m3pi.locate(0,1);
    m3pi.printf("%f", leftRotation);
}

void PID(float MIN, float MAX) {
    float right;
    float left;
    float rightTotal;
    float leftTotal;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative,proportional,integral = 0;
    float power;
    float speed = MAX;
    int in = 0;
    
    // create array for debouncing and fill it with a starting
    float rotations[DEBOUNCE];
    std::fill(rotations, rotations + DEBOUNCE, 1.0f);
    int count = 0;
    
    float s = 1.0f;
    
    while (s != 0.0f) {
        in++;
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
        left = limit(left, MIN, MAX);
        right = limit(right, MIN, MAX);
        m3pi.left_motor(left);
        m3pi.right_motor(right);
        
        leftTotal += left;
        rightTotal += right;
        
        // do some debouncing
        if (in > 50) {
            rotations[count++] = left;
            if (count == DEBOUNCE) {
                count = 0;
            }
            s = sum(rotations);
        }
    }
    // stop and calibrate sensors
    m3pi.stop();
    setRotations(leftTotal, rightTotal);
    wait(0.5);
}

void levelOutBattery() {
    m3pi.forward(1.0f);
    wait(0.125f);
    m3pi.stop();
    wait(0.1f);
    m3pi.backward(1.0f);
    wait(0.125f);
    m3pi.stop();
    wait(0.1f);
}

void goTo(int x, int y) {
    // move to position x, y by first rotating clockwise, then going forwards
    float moveX = (float) x - currentX;
    float moveY = (float) y - currentY;
    float degree = atan2 (moveX, moveY) * 180.0f / 3.141592654f;
    turnClockwise(degree);
    
    float distance = pow(moveX, 2.0f) + pow(moveY, 2.0f);
    int travel = (int) sqrt(distance);
    while (travel > 250) {
        goForwards(250);
        travel -= 250;
    }
    goForwards(travel);
}

int main() {
    wait(0.5);
    m3pi.sensor_auto_calibrate();
    
    PID(0.0, 1.0);
        
    m3pi.backward(0.25f);
    wait(0.5f);
    m3pi.stop();
    wait(0.5f);
    
    PID(0.0, 0.25);
    
    
    turnClockwise(720);
    wait(20.0f);
    
    goForwards(100);
    
    //goTo(500, 800);
}
