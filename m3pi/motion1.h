#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define robotID 1
#define rotation 0.600f
#define rotationSpeed 0.5f
#define robotMotorLeft 0.54f
#define robotMotorRight 0.55f
#define robotDistancePerSecond 500.0f
#define robotTurningCorrection 75
#define BLEED true

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
