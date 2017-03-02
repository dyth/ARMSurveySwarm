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

