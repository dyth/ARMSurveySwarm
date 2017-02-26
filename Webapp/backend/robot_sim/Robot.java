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
		}

		// Parse the movement message:
		// Get the direction:
		Direction direction = null;

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
		}

		if (direction == null) {
			System.out.println("Message not a movement command");
			System.out.println("message is" + current);
			return parse(rest);
		}

		// Drop the x and ys for now:
		String[] sections = current.split(", ");


		// Now get the rest of the directions
		// Cuts off the number we just parsed.
		String speedNum = sections[2];

		int speed = Integer.parseInt(speedNum);

		xPos = (float) Integer.parseInt(sections[0]);
		yPos = (float) Integer.parseInt(sections[1]);

		// Get rid of the next part
		String durationString = sections[3];
		// Cuts off the number we just parsed.

		int duration = Integer.parseInt(durationString);

		// --------Calculation of the rotation and the
		// --------movement distances.
		float time = (float) duration / 1000f;
		// Both are not nessecarily used
		float rotation = (float) (2 * Math.PI / 5.5f) * time;

		// In centimeters. Assume speed = 5000
		// Robots go 46-48cm/second.
		float distance = 0.48f * time;
		System.out.println("(" + id + ") Time is: " + time);
		System.out.println("(" + id + ") Distance is: " + distance);

		System.out.println("(" + id + ") Position is: " + xPos + " " + yPos);
		System.out.println("(" + id + ") Orientation is: " + orientation);

		Intensity[] intensityMeasurements = null;

		switch (direction) {
			case FORWARD:
				intensityMeasurements = move(distance);
				System.out.println("(" + id + ") Position is: " + xPos + " " + yPos);
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

		return parse(rest);
	}

	public void send(String message) {
		out.write(message);
		out.flush();
	}

	public Intensity[] move(float distance) {
		xPos = xPos + distance * (float) Math.sin(orientation);
		yPos = yPos + distance * (float) Math.cos(orientation);

		System.out.println("(" + id + ") New position is: " + xPos + " " + yPos);
		return new Intensity[] {
			new Intensity(xPos, yPos, takeMeasurement()) };
	}

	// returns the measurements made
	public Intensity[] move_back(float distance) {
		xPos = xPos - distance * (float) Math.sin(orientation);
		yPos = yPos - distance * (float) Math.cos(orientation);

		System.out.println("(" + id + ") New position is: " + xPos + " " + yPos);
		return new Intensity[] {
			new Intensity(xPos, yPos, takeMeasurement()) };
	}

	public void rotate_left(float rotation) {
		orientation += rotation;
	}

	public void rotate_right(float rotation) {
		orientation -= rotation;
	}

	public int takeMeasurement() {
		return board[(int)Math.floor(xPos)][(int)Math.floor(yPos)];
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
