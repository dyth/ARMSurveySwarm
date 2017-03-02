This document describes the protocol with which the robots communicate.

The robots use JSON to communicate with the server.

__Connection__

Upon connection to the server, the robots send HELLO message, of format:

| { type: "HELLO", id: 1 }

Where 1 is replaced the the appropriate robot ID.

When the server receives this message, it will send back a confirmation message
of the format:

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

| { type : "MOVE", angle: (double, in degrees), distance: (double in mm) }

When the robot receives this message, it sends back a done, of the format:

| { type : "DONE", intensities: [ array of intensity measurements  ] }


__Other Commands__
The robot operation is expected to be synchronous. So, if the robot
receives either of these commands, it is expected to finish executing
the  current command before moving on to the next one.

The other messsages are: 

| { type: "STOP" }

| { type: "WAIT", time: (double milliseconds) }

On a stop message, the robot should stop execution and await new commands.
On a wait message, the robot should sleep for the time specified, then send
a DONE message, with an empty intensities array
