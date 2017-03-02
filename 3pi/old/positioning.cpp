#include "mbed.h"
#include "m3pi.h"

m3pi m3pi;
// 0.51, 530

void turnCounterClockwise(int degree) {
    // Turn left at half speed
    //m3pi.stop();
    m3pi.left(0.15f);
    wait(((float) degree) * 3.388f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}

void turnClockwise(int degree) {
    // Turn right at half speed
    //m3pi.stop();
    m3pi.right(0.15f);
    wait(((float) degree) * 3.388f / 360.0f);
    m3pi.stop();
    wait(0.5f);
}

void goForwards(int distance) {
    // goes forward distance mm
    //m3pi.stop();
    //m3pi.forward(0.25);
    //wait(0.2f);
    m3pi.forward(1.0f);
    wait(((float) distance) / 960.0f);
    //m3pi.forward(0.25f);
    //wait(0.2f);
    m3pi.stop();
    wait(1.0f);
}

void raster() {
}

int main() {
    wait(0.5);
    //raster();
    //raster();
    goForwards(2000);
    turnCounterClockwise(180);
    goForwards(2000);
    //turnClockwise(720);
}
