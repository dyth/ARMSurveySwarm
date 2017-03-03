#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <sstream>
 
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
    // drive straight for 1 second whilst sampling twice per tile size
    
    // define constants and varibles for sampling
    int intensities[samples];
    int sensors[5]
    int samples = (int) floor(470.0f / ((float) tileSize / 2.0f));
    
    // move forward for remainder
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);
    wait(470.0f % (((float) tileSize) / 2.0f));
    
    // sample twice per tile size
    for (int i = 0; i < samples); i++) {
        m3pi.calibrated_sensor(sensors);
        intensities[i] = sensors[2];
    }
    halt();
    
    return intensities;// duh, fix this 
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
    halt();
}

void alignCorner() {
    // aligns a robot such that it is on the corner, facing the new direction
    
    // find corner quickly, then align with corner, reverse and then
    // slowly level up until corner is detected
    
    //turn to new direction (perpendicular to the starting position)
    PID(0.0, 0.5, 8);
    for (int i = 0; i < 4; i++) {
        m3pi.leftMotor(-1.0f);
    }
    turnClockwise(90);
}

void findLine(float speed) {
    // go forwards until line is found
    
    int sensors[5];
    
    while(1) {
        m3pi.forward(speed);
        m3pi.calibrated_sensor(sensors);
        
        // if black, advance length of tile
        // if no longer black, then tile detected, keep on advancing
        // otherwise, edge detected, turn to face new corner
        if (sensors[2] > 900)  {
            halt();
            m3pi.left_motor(robotMotorLeft);
            m3pi.right_motor(robotMotorRight);
            wait(((float) 50.0f) / robotDistancePerSecond);
            halt();
            m3pi.calibrated_sensor(sensors);
            
            if (sensors[2] < 900) {
                turnClockwise(90);
                break;
            }
        }
    }
    
}

void cycleClockwise(double degree, double distance) {
    // go to point (x, y), then find the edge, then find the next corner
    
    // go to point (degree, distance) then face the edge
    turnClockwise((float) degree);
    goForwards((double) distance);
    turnCounterClockwise((float) degree + 90.0f);
    
    // go forwards until edge detected
    findLine(0.25f);
    
    // recalibrate and align with corner
    m3pi.sensor_auto_calibrate();
    alignCorner();
}


int main() {
    // wait until human has left then autocalibrate
    m3pi.reset();
    wait(0.5);
    m3pi.sensor_auto_calibrate();
    alignCorner();
    
    // main loop of program
    while (1) {
        int x = 800;
        int y = 500;
        
        double distance = (double) pow(x, 2.0f) + pow(x, 2.0f);
        double travel = (double) sqrt(distance);
        float degree = atan2 ((float) x, (float) y) * 180.0f / 3.141592654f;
        
        cycleClockwise(degree, travel);
    }
}
