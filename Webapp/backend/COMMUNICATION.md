This document describes the protocol with which the robots communicate.

On connection to the server (which will be on a static IP address):
  Send a Hello message that contains some RobotID. Of the format: "HELLO: ID\n"

  The server will reply with a "start" message, indicating that the robot
  should proceed down the starting ramp. This message will be of the format:

  "START\n"

Once the roboot is done with this command, it sends a "DONE" message back
;o the server. (See the done message section).

Server can send a "stop" message, format:
  "STOP\n"

Server can send a "resume" message, format:
  "RESUME\n"

Server can send a "wait" message, format:
  "WAIT:0000\n"
Where 0000 is any 4 digit number, representing the number
of milliseconds. After waiting for the amount of time specified,
the robot should respond with a "DONE" message.

Server can send a movement command, format:
  "x = X, y = Y, direction = forward, backward, left, right, 0001 <= speed <= 9999, 00001 <= duration <= 99999\n"
  Where X and Y are floating point representations of the 
  robot's current position
  After the movement command is finished, the server expects a message with format:
  "DONE: ID\n" from the robot

If the connection is broken, the robot connects to the server again and sends another HELLO message (with the _same id_   as before)

Robots will send a message indicating intensities at positions as a list (possibly empty or single valued) in the format:


INTENSITY: ID; (X1, Y1, Intensity1); (X2, Y2, Intensity2); ... (XN, YN, IntensityN)\n

The ITENSITY message will be sent *before* the DONE message for that 
respective command.
