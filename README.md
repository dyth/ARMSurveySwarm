# Survey Swarm

[![Build Status](https://travis-ci.org/dyth/ARMSurveySwarm.svg?branch=master)](https://travis-ci.org/dyth/ARMSurveySwarm)

A Part IB (second year) Group Project, created for ARM for the Computer Science Tripos of the University of Cambridge. The *swarm* is a number (> 1) of Pololu 3pi robots which have been augumented using mbed microcontrollers. They *survey* a rectangular board filled with regular black and white squares. Using their reflectance sensors, they map out the board, sending the data back to the server, where it is processed to build up a visualization of the board on a web application.

A video of the robots in operation can be found [here](https://photos.google.com/share/AF1QipMtWSX0-c5hlVmGnOXGgL8poutp8yxlXXZpXl3x-gFOffQQ08Tkj0eW2YkjraZmkw?key=OGVuODVNNnZYNmZGLTNXbTVBSFo3V2MtZnVNaVZ3).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

If you are wishing to compile from source, do all the instructions. If you are wishing to flash an mbed with precompiled binary files, skip steps 1 - 4.

1. Create an account at [ARM online compiler](https://developer.mbed.org/compiler).
2. Add [development board](https://developer.mbed.org/platforms/mbed-LPC1768/) (on panel on right).
3. Create a program.
4. To download a program, press "Compile".
5. Connect the miniUSB port of the mbed to a USB port on your computer, and move the downloaded .bin file into the device.
5. To run the program, press the reset button on the mbed (the big central button), or restart the robot.

Detailed instructions per program can be found in READMEs within subdirectories.

### Installing
The backend can be set up by compiling and importing the 3pi code into the online ARM compiler.

To install the front end,

> $ sudo npm install connect serve-static socket.io socket.io-client html express path mocha


## Deployment

The robots should initially be placed over the bottom edge of the board, facing left. They should connect automatically to the server.

The server is run by

> $ sudo node server.js

which hosts the webapp. The webapp can be viewed on http://localhost:80

## Authors
(listed in alphabetical order)

* **Lucia Bura** - *documentation, debugging* - [luciabura](https://github.com/luciabura)
* **Jamie Davenport** - *Frontend, communication between robots and server and processing robot data* - [jamienet](https://github.com/jamienet)
* **David Hui** - *robot movement, sensing and calibration, routing algorithm design, integration with communication, board layout and design, reference point experimentation, presentation design and delivery* - [dyth](https://github.com/dyth)
* **Hrutvik Kanabar** - *Initial work* - [hrutvik](https://github.com/hrutvik)
* **Kamile Matulenaite** - *Processing robot data, collision prevention, next movement calculation, communication with server and robots, unit testing* - [Kamile](https://github.com/Kamile)
* **Jackson Woodruff** - *Server code, communication with robots, communication with frontend, development of communication protocol, integration testing, server unit testing, server integration testing, documentation, travis-ci setup* - [j-c-w](https://github.com/j-c-w)

See also the list of [contributors](https://github.com/dyth/ARMSurveySwarm/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* **ARM** for providing the project idea, and for providing the 3pi robots, especially **Ashkan Tousimojarad**, our client and contact.
* **Nikolas Goldin** and **Chris Styles** for laying a wonderful framework for creating our own library for the mbed + Pololu 3pi robots.
*  **Chris Hadley** for providing assistance in the creation of the board.
* **Brian Jones** for printing screws and helping us set up all the equipment.
* **Louis Massuard** for lending us equipment to augment the robot.
