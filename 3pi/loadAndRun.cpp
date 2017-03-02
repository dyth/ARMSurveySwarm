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

// robot terms
#define clockwiseRotation 2.235f
#define counterRotation 2.235f
#define robotMotorLeft 0.9f
#define robotMotorRight 0.9f

m3pi m3pi;

float leftRotation;
float rightRotation;
int currentX = 0;
int currentY = 0;

void halt() {
    m3pi.stop();
    wait(0.5f);   
}

void turnCounterClockwise(int degree) {
    // Turn left at the slowest speed possible for accuracy
    m3pi.left(0.15f);
    wait(((float) degree) * counterRotation / 360.0f);
    halt();
}

void turnClockwise(int degree) {
    // Turn right at the slowset speed possible for accuracy
    m3pi.stop();
    m3pi.right(0.15f);
    wait(((float) degree) * clockwiseRotation / 360.0f);
    halt();
}

void goForwards(int distance) {
    // go forwards
    m3pi.left_motor(0.9f);
    m3pi.right_motor(0.9f);
    wait((float) distance * speed);
    halt();
}

float sum (float* rotations) {
    // return sum of debounce array
    float s = 0.0f;
    for (int j = 0; j < DEBOUNCE; j++) {
        s += rotations[j];
    }
    return s;
}

float limit(float speed, float MIN, float MAX) {
    // ensures MIN < speed < MAX
    if (speed < MIN)
        return MIN;
    else if (speed > MAX)
        return MAX;
    else
        return speed;
}

std::string Convert (float number){
    // convert a floating point number into a string
    std::ostringstream buff;
    buff<<number;
    return buff.str();   
}

void setRotations(float left, float right) {
    // take integral of robot speeds and calibrate a new speed by altering
    // the global variable
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
    // PID line following between the speeds MIN and MAX
    float rightTotal;
    float leftTotal;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative, proportional, integral = 0;
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
        float power = (proportional * (P_TERM) ) + (integral*(I_TERM)) + (derivative*(D_TERM));
        float right = speed+power;
        float left  = speed-power;
        
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
    halt();
}

void levelOutBattery() {
    m3pi.forward(1.0f);
    wait(0.125f);
    m3pi.stop();
    wait(0.1f);
    m3pi.backward(1.0f);
    wait(0.125f);
    halt();
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
    halt();
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
    
    turnClockwise(90);
    
    goForwards(1000);
    
    //goTo(500, 800);
}
