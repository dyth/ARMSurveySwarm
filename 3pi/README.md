# 3pi robot code

Mainly C++ code that can be flashed into the robots for their communication.

## Final program

`main.cpp` combines the WiFi module, intensities and odometry together. This program is based on [a sample TCP mbed program](https://developer.mbed.org/teams/ST/code/mbed-os-tcp-server-example/).

Import the above library and replace the `main.cpp` within it to the `main.cpp` in this repository.

Import the [ESP8266 driver](https://developer.mbed.org/teams/ESP8266/code/esp8266-driver/) and a [m3pi library](https://developer.mbed.org/users/ngoldin/code/m3pi_ng/) into the project.


## Calibration of position

`positioning.cpp` tests the rotation and the distance travelled by the robot. Repeated tests and experimentation per robot per surface enables more accurate readings. This utilises the `mbed.h` and `m3pi.h` libraries.

## Obtaining values from reflectance sensors

`intensities.cpp` displays the outputs of sensory values on the LCD screen of a robot. It uses the `mbed.h`and `m3pi_ng.h` libraries.

There are two functions which determine the reflection / intensity of the floor beneath it.

One returns an `int array[5]` of calibrated intensities between 0 and 1000. The greater the number, the brighter the intensity.

The other processes the array and returns a value between -1.0 and 1.0.

-1.0 means black is on the left, or no black.
0.0 means the robot is directly above black.
1.0 means black is on the right.

## Odometry

Test random motion of a robot within a 1m by 1m space.

## WiFi Control

Previous experimentation in controlling a m3pi from a server using a Java TCP connection.

## Calibrating middle sensor for reflectance.

`reflectance.cpp` displays the reflectance on the LCD screen.
