#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define robotID 1
#define rotation 0.5877f
#define rotationSpeed 0.5f
#define robotMotorLeft 0.500f
#define robotMotorRight 0.5032f
#define robotDistancePerSecond 470.0f
#define robotTurningCorrection 75
#define BLEED true

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
