# 3pi robot code

## `reflectance.cpp`

using the libraries
* `mbed.h`
* `m3pi.h`

print value of black / white on m3pi screen (between -1.0 and 1.0).

-1.0 means black is on the left, or no black.
0.0 means the robot is directly above black.
1.0 means black is on the right.

## `intensities.cpp`

using the libraries
* `mbed.h`
* `m3pi_ng.h`

return an `int array[5]` of calibrated intensities between 0 and 1000. The greater the number, the brighter the intensity.

## Odometery

Test random motion of a robot within a 1m by 1m space.