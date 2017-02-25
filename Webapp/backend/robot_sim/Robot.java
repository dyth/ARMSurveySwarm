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

	BufferedReader in;
	PrintWriter out;

	public Robot(int id, int[][] board) {
		this.board = board;
		this.id = id;
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
			send("DONE\n");
		} else if (current.startsWith("WAIT:")) {
			current = current.substring("WAIT:".length()).trim();
			long waitTime = Long.parseLong(current.substring(0, 5));

			try {
				Thread.sleep(waitTime);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}else if (current.equals("STOP")) {
			// stop
		} else if (current.equals("RESUME")) {
			// resume
		} else if (current.startsWith("direction")) {
			// Parse the movement message:
			// Get the direction:
			current = current.substring("direction = ".length());
			Direction direction;

			if (current.startsWith("f")) {
				// it's forward
				direction = Direction.FORWARD;
				current = current.substring("forward, ".length());
			} else if (current.startsWith("b")) {
				// backward
				direction = Direction.BACKWARD;
				current = current.substring("backward, ".length());
			} else if (current.startsWith("l")) {
				direction = Direction.LEFT;
				current = current.substring("left, ".length());
			} else if (current.startsWith("r")) {
				direction = Direction.RIGHT;
				current = current.substring("right, ".length());
			} else {
				System.out.println("ERROR -- could not parse message");
				throw new RuntimeException("");
			}


			// Now get the rest of the directions
			// Get rid of the speed.
			current = current.substring("speed = ".length());
			String speedNum = current.substring(0, 4);
			// Cuts off the number we just parsed.
			current = current.substring(4);

			int speed = Integer.parseInt(speedNum);

			// Get rid of the next part
			current = current.substring(", duration = ".length());
			String durationString = current.substring(0, 4);
			// Cuts off the number we just parsed.
			current = current.substring(4);

			int duration = Integer.parseInt(durationString);

			// --------Calculation of the rotation and the 
			// --------movement distances.
			float time = (float) duration / 1000f;
			// Both are not nessecarily used
			float rotation = (360.0f / 5.5f) * time;

			// In centimeters. Assume speed = 5000
			// Robots go 46-48cm/second.
			float distance = 0.47f * time;

			Intensity[] intensityMeasurements = null;

			switch (direction) {
				case FORWARD:
					intensityMeasurements = move(distance);
					break;
				case BACKWARD:
					intensityMeasurements = move_back(distance);
					break;
				case LEFT:
					rotate_left(rotation);
					break;
				case RIGHT:
					rotate_right(rotation);
					break;
			}

			// Now sleep for that time
			try {
				Thread.sleep((long) (time * 1000));
			} catch (InterruptedException e) {
				e.printStackTrace();
			}

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

	// Returns the measurements made
	// Direction should be -1 for backwards +1 for forwards
	public Intensity[] move_internal(float distance, int direction) {
		ArrayList<Intensity> intensities = new ArrayList<Intensity>();
		System.out.println("Distance: " + distance);

		double xDiff = direction * distance * Math.cos(orientation);
		double yDiff = direction * distance * Math.sin(orientation);

		double xTarget = xPos + xDiff;
		double yTarget = yPos + yDiff;

		while ( // if it is going up
				(direction == 1 && xPos < xTarget && yPos < yTarget)
				// If it is going down
				|| (direction == -1 && xPos > xTarget && yPos > yTarget)) {
			xPos += direction * Math.cos(orientation);
			yPos += direction * Math.cos(orientation);

			if (xPos < 0 || yPos < 0) {
				continue;
			}

			Intensity intensity = new Intensity(xPos, yPos, takeMeasurement());

			intensities.add(intensity);
		}

		return intensities.toArray(new Intensity[intensities.size()]);
	}

	public Intensity[] move(float distance) {
		return move_internal(distance, 1);
	}

	// returns the measurements made
	public Intensity[] move_back(float distance) {
		return move_internal(distance, -1);
	}

	public void rotate_left(float rotation) {
		orientation += rotation;
	}

	public void rotate_right(float rotation) {
		orientation -= rotation;
	}

	public int takeMeasurement() {
		return board[Math.round(xPos)][Math.round(yPos)];
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

	float getXPos() {
		return xPos;
	}

	float getYPos() {
		return yPos;
	}

	int getValue() {
		return value;
	}
}
