This document describes the protocol with which the robots communicate.

On connection to the server (which will be on a static IP address):
  Send a Hello message that contains some RobotID. Of the format: "HELLO: ID"

Server can send a "stop" message, format:
  "STOP"

Server can send a "resume" message, format:
  "RESUME"

Server can send a movement command, format:
  "direction = forward, backward, left, right, 1 <= speed <= 9, 1 <= duration <= 9\n"
  After the movement command is finished, the server expects a message with format:
  "DONE: ID" from the robot

If the connection is broken, the robot connects to the server again and sends another HELLO message (with the _same id_   as before)

Robots will send a message indicating intensities at positions as a list (possibly empty or single valued) in the format:


INTENSITY: ID; (Intensity1); (Intensity2); ... (IntensityN)

The ITENSITY message will be sent *before* the DONE message for that 
respective command.

Where the message is *only sent*  on a linear movement and the measurements are *equally spaced*
