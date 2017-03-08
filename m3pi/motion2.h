#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define rotationSpeed 0.5f
#define robotID 2
#define rotation 0.54f
#define robotMotorLeft 0.502f
#define robotMotorRight 0.50f
#define robotDistancePerSecond 485.0f
#define robotTurningCorrection 86
#define BLEED true

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
