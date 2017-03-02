# 3pi robot code

C++ code to be flashed onto the m3pi robots.

## Library

A fork of Chris Styles's library, but with an added function for returning an int array[5] of calibrated values from the five reflectance sensors.

This can be done by:

| int sensors[5];
| m3pi.calibrated_sensor (sensors);

calibrated sensor values are between 0 and 1000.

## Final program

`counterClockwise.cpp` contains the bare minimum code required to get the robot to scan a tile, then return to a corner.

`main.cpp` combines the WiFi module, intensities and odometry together. This program is based on [a sample TCP mbed program](https://developer.mbed.org/teams/ST/code/mbed-os-tcp-server-example/).

Import the above library and replace the `main.cpp` within it to the `main.cpp` in this repository.

Import the [ESP8266 driver](https://developer.mbed.org/teams/ESP8266/code/esp8266-driver/), the default `mbed` library and the above libary into the project.
