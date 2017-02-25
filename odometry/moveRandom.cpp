#include "mbed.h"
#include "m3pi.h"
#include <math.h>

#define PI 3.14159265

m3pi m3pi;

void turnCounterClockwise(int degree) {
    // Turn left at half speed
    m3pi.left(0.5);
    wait (degree * 0.5538461538461539 / 360.0);
    m3pi.stop();
}
    
void turnClockwise(int degree) {
    // Turn right at half speed
    m3pi.right(0.5);
    wait (degree * 0.5538461538461539 / 360.0);
    m3pi.stop();
}

void goForwards(int distance) {
    // goes forward distance mm
    m3pi.forward(0.5);
    wait (distance / 470.0);
    m3pi.stop();
}
    
void goBackwards(int distance) {
    // goes backwards distance mm
    m3pi.backward(0.5);
    wait (distance / 470.0);
    m3pi.stop();
}


int main() {
    int i = 0;
    int currentX = 0;
    int currentY = 0;
    float length = 1000.0;
    double direction = 0.;
    while(i < 50) {
        i++;
        int x = (int) length * ((double) rand() / RAND_MAX);
        int y = (int) length * ((double) rand() / RAND_MAX);
        int moveX = x - currentX;
        int moveY = y - currentY;
        double degree = atan ((double) moveY - (double) moveX) * 180. / PI;
        double moveDegree = degree - direction;
        if (moveDegree > 0) {
            turnCounterClockwise((int) moveDegree);
        } else {
            turnClockwise((int) -moveDegree);
        }
        double dist = pow((double) moveX, 2) + pow((double) moveY, 2);
        goForwards((int) sqrt(dist));
        currentX = x;
        currentY = y;
        direction += moveDegree;  
    }
}
