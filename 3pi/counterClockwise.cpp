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

void PID(float MIN, float MAX, int debounce) {
    
    // PID line following between the speeds MIN and MAX
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
    halt();
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

void cycleClockwise(double degree, double distance) {
    // go to (degree, distance), then find the edge, then find the next corner
    
    // go to point (degree, distance) then face the edge
    turnClockwise((float) degree);
    goForwards((float) distance);
    
    turnCounterClockwise((float) degree + 90.0);
    
    // go forwards until edge detected
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
                goForwards(2);
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
        cycleClockwise(800, 500);
    }
}
