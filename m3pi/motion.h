#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define robotID 0
#define rotation 1.231f
#define robotMotorLeft 0.5f
#define robotMotorRight 0.5f
#define robotDistancePerSecond 470.0f
#define robotTurningCorrection 75

void start();

void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
