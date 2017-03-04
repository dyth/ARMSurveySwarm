#include "motion.h"

// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20

m3pi m3pi;

void halt() {
    // halt robot and allow motors to cool down
    m3pi.stop();
    wait(1.0f);
}

void turnCounterClockwise(int degree) {
    // Turn left at the slowest speed possible for accuracy
    m3pi.left(0.15f);
    wait(((float) degree) * rotation / 360.0f);
    halt();
}

void turnClockwise(int degree) {
    // Turn right at the slowset speed possible for accuracy
    m3pi.stop();
    m3pi.right(0.15f);
    wait(((float) degree) * rotation / 360.0f);
    halt();
}

void cadence(int remainder, int samples, int * cadenceIntensities) {
    // drive straight for 1 second whilst sampling twice per tile size

    // move forward for remainder
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);
    wait(remainder);

    // sample twice per tile size
    int sensors[5];
    for (int i = 0; i < samples; i++) {
        m3pi.calibrated_sensor(sensors);
        wait(1.0f / (float) samples);
        cadenceIntensities[i] = sensors[2];
    }

    halt();
}

void goForwards(int distance, int samples, int cadenceNumber, vector<int> &intensities) {
    // go forwards in cadences of 1 second of bleed move and anneal
    m3pi.stop();

    // leftover distance in cadence that is not sampled
    int cadenceRemainder = (int) robotDistancePerSecond % (tileSize / 2) / robotDistancePerSecond;
    // distance travelled without a cadence
    int distanceRemainder = distance % (int) robotDistancePerSecond;

    // bleed before starting motors
    m3pi.forward(0.25);
    wait(0.25);
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);

    // move remainder of distance
    wait(((float) distanceRemainder) / robotDistancePerSecond);

    // do the specified number of cadences
    for (int i = 0; i < cadenceNumber; i++) {
        int segment[samples];
        cadence(cadenceRemainder, samples, segment);

        for (int j = 0; j < samples; j++) {
            intensities.push_back(segment[j]);
        }
    }

    halt();
}

void goForwards(int distance) {
    // go forwards in cadences of 1 second of bleed move and anneal
    m3pi.stop();

    // number of cadences
    int cadenceNumber = distance / robotDistancePerSecond;
    // distance travelled without a cadence
    int distanceRemainder = distance % (int) robotDistancePerSecond;

    // bleed before starting motors
    m3pi.forward(0.25);
    wait(0.25);
    m3pi.left_motor(robotMotorLeft);
    m3pi.right_motor(robotMotorRight);

    // move remainder of distance
    wait(((float) distanceRemainder) / robotDistancePerSecond);

    // do the specified number of cadences
    for (int i = 0; i < cadenceNumber; i++) {
        wait(1);
        halt();
        m3pi.left_motor(robotMotorLeft);
        m3pi.right_motor(robotMotorRight);
    }

    halt();
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

void PIDFast(float MIN, float MAX, int iteration) {
    // PID line following between the speeds MIN and MAX
    float rightTotal;
    float leftTotal;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative, proportional, integral = 0;
    float speed = MAX;
    int count = 0;

    m3pi.sensor_auto_calibrate();

    // loop until debouncing has succeeded
    while (count++ < iteration) {
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
        float left = speed-power;

        // set speed at limits
        left = limit(left, MIN, MAX);
        right = limit(right, MIN, MAX);
        m3pi.left_motor(left);
        m3pi.right_motor(right);

        leftTotal += left;
        rightTotal += right;
    }
    // stop and calibrate sensors
    halt();
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

    m3pi.sensor_auto_calibrate();

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
        float power = (proportional * (P_TERM)) + (integral*(I_TERM)) + (derivative*(D_TERM));
        float right = speed+power;
        float left = speed-power;

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

void alignCorner(int distance) {
    // aligns a robot such that it is on the corner, facing the new direction

    // follow line until the robot starts to turn, then turn facing new
    // direction (perpendicular to the starting position)
    PIDFast(0.0f, 1.0f, distance);
    PID(0.0, 0.5, 4);
}

void findLine() {
    // go backwards until line detected

    // initialise sensors
    int sensors[5];
    m3pi.calibrated_sensor(sensors);

    // go backwards until black
    while(sensors[2] < 800) {
        m3pi.backward(0.15);
        m3pi.calibrated_sensor(sensors);
    }
    halt();
}

void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities) {
    // go to point (x, y), then find the edge, then find the next corner

    // number of samples within a cadence
    int samples = (int) robotDistancePerSecond / ((float) tileSize);// / 2.0f);
    // number of cadences
    int cadenceNumber = distance / robotDistancePerSecond;
    // number of samples
    int totalSamples = samples * cadenceNumber;
    // go to point (degree, distance) then face the edge

    // turn the degree, then go forwards and sample the forward
    turnClockwise(robotTurningCorrection);
    turnClockwise(degree);
    goForwards(distance, samples, cadenceNumber, vectorIntensities);

    turnClockwise(270 - degree);

    //TODO: change back to 150 if not working
    // go off board, and then go backwards until an edge is detected
    goForwards((int) (distance * sin(degree * 3.141592654f / 180.0f)) + 150);
    findLine();

    // go forwards and then face the next corner
    goForwards(25);
    turnClockwise(90);

    // recalibrate and align with corner
    alignCorner(600);


}

void start() {
    // wait until human has left then find the first corner
    m3pi.reset();
    wait(0.5);
    alignCorner(200);
}

/*
void testing() {
    // some code for testing the motion of the robot
    // goes round the board in an infinite loop

    start();

    while (1) {
        int x = 800;
        int y = 500;

        float distance = pow(x, 2.0f) + pow(y, 2.0f);
        int travel = (int) sqrt(distance);
        int degree = atan2 ((float) x, (float) y) * 180.0f / 3.141592654f;

        int * intensities = cycleClockwise(degree, travel);
        for (int i = 0;  ;i++) {
            m3pi.cls();
            m3pi.locate(0, 0);
            m3pi.printf("/d", intensities[i]);
        }
    }
}
*/
