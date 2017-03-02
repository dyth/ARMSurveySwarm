import java.lang.*;
import java.io.*;
import java.net.*;
import java.util.*;

/*
 * This is a Java class that can be started to simulate the robots.
 */

class Robot {
	enum Direction {
		FORWARD, BACKWARD, LEFT, RIGHT;
	}

	int id;

	float orientation = 0;
	float xPos = 0;
	float yPos = 0;

	int[][] board;
	int tileSize;

	BufferedReader in;
	PrintWriter out;

	MovementListener movementListener;

	public Robot(int id, int[][] board, int tileSize) {
		this.board = board;
		this.id = id;
		this.tileSize = tileSize;
	}

	public int connect(String ip) {
		// Connects to port 8000.
		//
		try {
			Socket skt = new Socket(ip, 8000);
			in = new BufferedReader(new
					InputStreamReader(skt.getInputStream()));
			out = new PrintWriter(skt.getOutputStream(), true);

			send("HELLO:" + id + "\n");

			String commands = "";
			while (!in.ready()) {}
			System.out.println("Ready");

			while (true) {
				commands += (char) (in.read());
				commands = parse(commands);

				if (false) {
					break;
				}
			}

			in.close();
		} catch(Exception e) {
			e.printStackTrace();
			System.out.print("Whoops! It didn't work!\n");
		}

		return 0;
	}
	// Takes the command, parses it and returns
	// the new command string.
	public String parse(String commands) {
		int delim = commands.indexOf('\n');
		if (delim == -1) {
			// No command received yet.
			return commands;
		}
		System.out.println("(" + id + ") Commands: " + commands);
		String current = commands.substring(0, delim);
		String rest = commands.substring(delim + 1, commands.length());

		if (current.equals("START")) {
			// There is no loading ramp in this example
			send("RESET:" + id + "\n");
		} else if (current.startsWith("WAIT ")) {
			current = current.substring("WAIT ".length()).trim();
			long waitTime = Long.parseLong(current.substring(0, 5));

			try {
				Thread.sleep(waitTime);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			System.out.println("(" + id + ") Waking up");
			send("DONE:" + id + "\n");
		} else if (current.equals("STOP")) {
			// stop
		} else if (current.equals("RESUME")) {
			// resume
		} else if (current.startsWith("INSTRUCTION,")) {
			String[] sections = current.split(", ");

			// Now get the rest of the directions
			xPos = (float) Integer.parseInt(sections[1]) / 10;
			yPos = (float) Integer.parseInt(sections[2]) / 10;
			// Rotation and orientation are sent as 10s of degrees
			orientation = (float) Integer.parseInt(sections[3]) * 
				(float) Math.PI / (100 * 180.0f);

			// Get rid of the next part

			// --------Calculation of the rotation and the
			// --------movement distances.
			float distance = (float) Integer.parseInt(sections[4]) / 10;
			float rotation = (float) Integer.parseInt(sections[5]) * 
				(float) Math.PI / (100 * 180.0f);

			orientation += rotation;
			orientation = orientation % (2 * (float) Math.PI);

			// Now adjust position:
			xPos += distance * Math.cos(orientation);
			yPos += distance * Math.sin(orientation);


			// In centimeters. Assume speed = 5000
			// Robots go 46-48cm/second.
			System.out.println("(" + id + ") Position is: " + xPos + " " + yPos);
			System.out.println("(" + id + ") Orientation is: " + orientation);

			// Assume 47 cm/sec + 0.5 sec for rotation
			// Add 2 for usability
			float time = 0.5f + distance / 47f + 2;
			// Now sleep for that time
			try {
				Thread.sleep((long) (time * 1000));
			} catch (InterruptedException e) {
				e.printStackTrace();
			}

			// Now that we havve updated the position, call the update position
			if (movementListener != null) {
				movementListener.move( Math.round(xPos), 
						Math.round(yPos));
			}

			Intensity[] intensityMeasurements = new Intensity[] {
				new Intensity(xPos, yPos, takeMeasurement())
			};

			// Send messages to the server:
			if (intensityMeasurements != null) {
				StringBuilder builder = new StringBuilder();
				builder.append("INTENSITY:" + id);

				for (Intensity intensity: intensityMeasurements) {
					builder.append(";(");
					builder.append(intensity.getXPos());
					builder.append(",");
					builder.append(intensity.getYPos());
					builder.append(",");
					builder.append(intensity.getValue());
					builder.append(")");
				}

				builder.append("\n");
				send(builder.toString());
			}
			send("DONE:" + id + "\n");
		}

		return parse(rest);
	}

	public void send(String message) {
		out.write(message);
		out.flush();
	}

	public void setMovementListener(MovementListener listener) {
		System.out.println("Set movement listener called");
		this.movementListener = listener;
	}

	public int takeMeasurement() {
		return board[(int) Math.floor(0.001 + xPos / tileSize)]
			[(int) Math.floor(0.001 + yPos / tileSize)];
	}
}

class Intensity {
	float xPos;
	float yPos;
	int value;

	public Intensity(float xPos, float yPos, int value) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.value = value;
	}

	/*
	 * Values returned from this are in mm
	 */
	float getXPos() {
		return xPos * 10;
	}

	float getYPos() {
		return yPos * 10;
	}

	int getValue() {
		return value;
	}
}
