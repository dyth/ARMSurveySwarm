#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define rotationSpeed 0.5f
#define robotID 4
#define rotation 0.674f
#define robotMotorLeft 0.5f
#define robotMotorRight 0.5734f
#define robotDistancePerSecond 440.0f
#define robotTurningCorrection 85
#define BLEED false

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
