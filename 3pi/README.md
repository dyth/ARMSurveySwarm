# 3pi robot code

## `main.cpp`
Final combined program of WiFi module, intensities and odometry.

This program is based on [a sample TCP mbed program](https://developer.mbed.org/teams/ST/code/mbed-os-tcp-server-example/).

Import the above library and replace the `main.cpp` within it to the `main.cpp` in this repository.

Import the [ESP8266 driver](https://developer.mbed.org/teams/ESP8266/code/esp8266-driver/) and a [m3pi library](https://developer.mbed.org/users/ngoldin/code/m3pi_ng/) into the project.


## `positioning.cpp`

using the libraries
* `mbed.h`
* `m3pi.h`

This is used to test out the rotation and the distance travelled by the robot.

## `intensities.cpp`

using the libraries
* `mbed.h`
* `m3pi_ng.h`

has two functions which determine the reflection / intensity of the floor beneath it.

One returns an `int array[5]` of calibrated intensities between 0 and 1000. The greater the number, the brighter the intensity.

The other processes the array and returns a value between -1.0 and 1.0.

-1.0 means black is on the left, or no black.
0.0 means the robot is directly above black.
1.0 means black is on the right.

## Odometry

Test random motion of a robot within a 1m by 1m space.

## WiFi Control

Previous experimentation in controlling a m3pi from a server using a Java TCP connection.
