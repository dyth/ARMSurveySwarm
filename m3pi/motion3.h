#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define robotID 3
#define rotation 0.702f
#define rotationSpeed 0.5f
#define robotMotorLeft 0.5388f
#define robotMotorRight 0.5f
#define robotDistancePerSecond 493.0f
#define robotTurningCorrection 82
#define BLEED false

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
