#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <sstream>

#define DEBOUNCE 4
 
// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

// board size
#define tileSize 100

// robot terms
#define clockwiseRotation 2.235f
#define counterRotation 2.235f
#define robotMotorLeft 0.5f
#define robotMotorRight 0.5f
#define robotDistancePerSecond 470.0f

m3pi m3pi;

float leftRotation;
float rightRotation;

// positioning is cartesian, a zero orientation is a positive y direction
float currentOrientation = 0.0f;
int currentX = 0;
int currentY = 0;

void halt() {
    // halt robot and allow motors to cool down
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

void cadence() {
    // drive straight for 1 second
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);
    wait(1);
}

void anneal() {
    // anneal movement for 0.25 second
    m3pi.forward(0.25);
    wait(0.25);
    m3pi.backward(0.25);
    wait(0.25);
    halt();
}

void goForwards(int distance) {
    // go forwards in cadences of 1 second of bleed move and anneal
    m3pi.stop();
    
    //bleed
    m3pi.forward(0.25);
    wait(0.25);
    
    //move
    while (distance > robotDistancePerSecond) {
        cadence();
        distance -= robotDistancePerSecond;
        anneal();
    }
    
    // move remainder of distance
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);
    wait(((float) distance) / robotDistancePerSecond);
    anneal();
}

float sum (float* rotations, int debounce) {
    // return sum of debounce array
    float s = 0.0f;
    for (int j = 0; j < debounce; j++) {
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

std::string convert (float number){
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
    
    // print new speeds on screen
    m3pi.cls();
    m3pi.locate(0,0);
    m3pi.printf("%f", rightRotation);
    m3pi.locate(0,1);
    m3pi.printf("%f", leftRotation);
}

void PID(float MIN, float MAX, int debounce) {
    // PID line following between the speeds MIN and MAX
    float rightTotal;
    float leftTotal;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative, proportional, integral = 0;
    float speed = MAX;
    int in = 0;
    
    // create array for debouncing and fill it with a starting
    float rotations[debounce];
    std::fill(rotations, rotations + debounce, 1.0f);
    int count = 0;
    
    float s = 1.0f;
    
    // loop until debouncing has succeeded
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
            if (count == debounce) {
                count = 0;
            }
            s = sum(rotations, debounce);
        }
    }
    // stop and calibrate sensors
    m3pi.stop();
    setRotations(leftTotal, rightTotal);
    halt();
}

void levelOutBattery() {
    // rapid fowards and backwards movement to level out battery charge
    // ensures that calibration is relatively level
    m3pi.forward(1.0f);
    wait(0.125f);
    m3pi.stop();
    wait(0.1f);
    m3pi.backward(1.0f);
    wait(0.125f);
    halt();
}

float updateOrientation(float orientation) {
    // ensures that orientation is always between 0 and 360 degrees
    if (orientation > 360.0f) {
        return orientation - 360.0f;
    } else if (orientation < 0.0f) {
        return orientation + 360.0f;
    } else {
        return orientation;
    }
}

void goTo(int x, int y) {
    // move to position x, y by first rotating clockwise, then going forwards
    
    // calculate degree of rotation
    float degree = atan2 ((float) x, (float) y) * 180.0f / 3.141592654f;
    degree = updateOrientation(degree);
    float increment = degree - currentOrientation;
    
    // calculate distance to travel
    float distance = pow(x, 2.0f) + pow(x, 2.0f);
    int travel = (int) sqrt(distance);
    
    // motion
    currentOrientation = degree;
    
    turnClockwise(increment);
    goForwards(travel);
}

void alignCorner() {
    // aligns a robot such that it is on the corner, facing the new direction
    
    // find corner quickly, then align with corner, reverse and then
    // slowly level up until corner is detected
    PID(0.0, 1.0, 2);
    turnCounterClockwise(10);
    m3pi.backward(0.25f);
    wait(1.0f);
    halt();
    PID(0.0, 0.25, 4);
    
    //turn to new direction (perpendiculat to the starting position)
    turnClockwise(90);
}

void cycleClockwise(int x, int y) {
    
    // go to point x, y, then face the edge
    goTo(x, y);
    turnCounterClockwise(currentOrientation + 90);
    
    // go fowards until edge detected
    int sensors[5];    
    m3pi.forward(0.5);
    
    while(1) {
        m3pi.calibrated_sensor(sensors);
        
        // if black, advance length of tile
        // if no longer black, then tile detected, keep on advancing
        // otherwise, edge detected, turn to face new corner
        if (sensors[2] > 900)  {
            halt();
            m3pi.calibrated_sensor(sensors);
            if (sensors[2] < 200) {
                turnClockwise(90);
                break;
            } else {
                goForwards(tileSize);
                m3pi.forward(0.5);
            }
        }
    }
    
    // align with corner
    alignCorner();
}

int main() {
    // wait until human has left then autocalibrate
    wait(0.5);
    m3pi.sensor_auto_calibrate();
    alignCorner();
    
    // main loop of program
    while (1) {
        currentOrientation = 0;
        cycleClockwise(800, 500);
    }
}
