#include "mbed.h"
#include "m3pi.h"
#include <algorithm>
#include <iterator>
#include <vector>

// robot terms
#define robotID 4
#define rotation 0.703f
#define rotationSpeed 0.488f
#define robotMotorLeft 0.5f
#define robotMotorRight 0.555f
#define robotDistancePerSecond 430.0f
#define robotTurningCorrection 83
#define BLEED false

void start();
void alignCorner(int distance);
void alignCorner();
void cycleClockwise(int degree, int distance, vector<int> &vectorIntensities);
void setTileSize(int size);
