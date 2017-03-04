#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>
 
// board size
#define tileSize 100

// robot terms
#define rotation 2.591f
#define robotMotorLeft 0.5f
#define robotMotorRight 0.5f
#define robotDistancePerSecond 470.0f

void start();

vector<int> cycleClockwise(int degree, int distance, vector<int> vectorIntensities);
