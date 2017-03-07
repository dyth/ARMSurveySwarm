#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define rotationSpeed 0.5f
#define robotID 0
#define rotation 0.56f
#define robotMotorLeft 0.502f
#define robotMotorRight 0.5f
#define robotDistancePerSecond 355.0f
#define robotTurningCorrection 82
#define BLEED true

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
