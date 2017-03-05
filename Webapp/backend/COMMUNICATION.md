This document describes the protocol with which the robots communicate.

The robots use JSON to communicate with the server.

__Connection__

Upon connection to the server, the robots send HELLO message, of format:

| { type: "HELLO", id: 1 }

Where 1 is replaced the the appropriate robot ID.

| { type: "CORNER" }

The CORNER message is sent from the server to the robot to tell it to move from its current corner to the next one.
CORNER messages are only sent before the START message to position all the robots on the correct corner.

| {type: "START", tileSize: _}

Where the tileSize is sent as the tile size that has been entered on the webapp.

__Reconnection__
Upon reconnection, the robot resends a hello message to the server.
The server will have kept track of its location during the time it was
disconnected. 


__Movement__

The server sends a 'move' message to the robot. The robot takes
this move message, executes the entailed move and sends
back some readings from the light sensor when it has reached
the next corner. The move message is of the format:

| { type : "MOVE", angle: (int, in degrees), distance: (int in mm) }

When the robot receives this message, it sends back a done, of the format:

| { type : "DONE", intensities: [ array of intensity measurements  ], count: 30 }

The intensity measurements array contains strings of the format "[ intensity values ]" this is due to the JSON library limiting arrays to 20 values.

Count is the number of intensity values.

An example message might look like { type : "DONE", intensities: [ "[12, 34, 845, 946, 46, 799, 12, 57, 21, 62, 62, 858, 875, 45, 15, 73, 912, 12, 34, 845]", "[12, 34, 845, 12, 34, 845, 799, 12, 57, 23]" ], count: 30 }

connection.js will flatten the intensity array when it reads data.

__Other Commands__
The robot operation is expected to be synchronous. So, if the robot
receives either of these commands, it is expected to finish executing
the  current command before moving on to the next one.

The other messsages are: 

| { type: "STOP" }

| { type: "WAIT", time: (int milliseconds) }

On a stop message, the robot should stop execution and await new commands.
On a wait message, the robot should sleep for the time specified.

__Example__

Start Server

Connect Robot 1
Robot1 -> Server: { type: "HELLO", id: 1 }

Connect Robot 2
Robot2 -> Server: { type: "HELLO", id: 2 }
Server -> Robot1: { type: "CORNER" }

Connect Robot 3
Robot3 -> Server: { type: "HELLO", id: 3 }
Server -> Robot1: { type: "CORNER" }
Server -> Robot2: { type: "CORNER" }

Start scanning
Server -> Robot1: { type: "START", tileSize: 100 }
Server -> Robot1: { type : "MOVE", angle: 45, 600 }
Server -> Robot2: { type: "START", tileSize: 100 }
Server -> Robot2: { type : "MOVE", angle: 32, 700 }
Server -> Robot3: { type: "START", tileSize: 100 }
Server -> Robot3: { type : "MOVE", angle: 90, 500 }

Robot1 reaches corner
Robot1 -> Server: { type : "DONE", intensities: [ "[34, 56, 12, 896, 823, 912, 45, 23]" ], count: 8 }

etc. 



