# Loading Ramp for robots

The purpose of the loading ramp is to start all the robots from the same spot quickly and efficiently.

* The loading ramp comprises of a black line.
* To begin, the robots are placed with their centres to the left of the black line, whilst all facing the same direction towards the board.
* The robots follow the black line until it ends.
  * This is detected when one motor turns more than the other, in an attempt to find the line again
* In order to find the black line again, the motor turns back until it is parallel to the line
* The robot then reverses until it is on top of the line, and then rotates until the sensor can see the line.

Thus all robots will be at the same point.

The program `load.cpp` requires two packages, `mbed.h`, `m3pi.h`
