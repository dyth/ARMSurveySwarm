# Loading bay for robots

The loading bay is a line which ensures that all robots start at the same spot once they have exited the bay.

* The loading bay is placed such that it is orthogonal to the a side of the board, touching the (0, 0) corner.
* In the centre of the loading bay is a black line.
* To begin, the robots are placed facing the board with their centers over the black line.
* The robots follow the black line until it ends.
* This is detected when one motor does not turn

Thus all robots will be at the same point, (0, 0).

The program `load.cpp` requires two packages, `mbed.h`, `m3pi.h`
