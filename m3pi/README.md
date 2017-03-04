# 3pi robot code

C++ code to flash on the m3pi robots. The robots move around the board, directed by a server, whilst logging some intensity values.

This program is based on [a sample TCP mbed program](https://developer.mbed.org/teams/ST/code/mbed-os-tcp-server-example/). In order for the program to run, the [ESP8266 driver](https://developer.mbed.org/teams/ESP8266/code/esp8266-driver/), the default `mbed` library and other libaries are needed.

The list of required packages will be updated later.

All of the other `.cpp` and `.h` files in this repository should be included.

Import the above library and replace its `main.cpp` with the file of the same name within this repository. `main.cpp` receives and sends `.json` files and interfaces with `motion.cpp`.

Its header file, `motion.h` contains specific robot information. An example of those values is as follows:

* robotID 0
* rotation 2.591f
* robotMotorLeft 0.5f
* robotMotorRight 0.5f
* robotDistancePerSecond 470.0f
* robotTurningCorrection 75

`motion.cpp` directs the robot to a tile, before it returns to the next clockwise corner. Robot functions are called from a `m3pi` library.

`m3pi.cpp` and its header - `m3pi.h` are files generated from a fork of Chris Styles's library. The function `middle_value()` is added which returns a calibrated value from the front middle sensor of the m3pi robot. Calibrated sensors return sensor readings between 0 and 1000. 0 is the lightest observed value during calibration and 1000 is the darkest.
