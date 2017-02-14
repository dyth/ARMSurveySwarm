package uk.ac.cam.hrk32.wifi;

/**
* The WiFiController program implements an application that
* connects to an mbed-enabled Pololu 3pi robot (m3pi) and
* allows for control of its movements over WiFi.
*
* @author  Hrutvik Kanabar
* @version 1.0
* @since   2017-02-14 
*/

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;

public class WiFiController {
	public static void main(String[] args) {
		try {
			System.out.println("Pololu 3pi WiFi Controller");
			// set up connection to Pololu
			int port = Integer.parseInt(args[0]);
			ServerSocket serverSocket = new ServerSocket(port);
			Socket socket = serverSocket.accept();
			// print usage statements
			System.out.println("Pololu connected:");
			System.out
					.println("IP Address: " + socket.getInetAddress().getHostAddress() + ", Port: " + socket.getPort());
			DataOutputStream out = new DataOutputStream(socket.getOutputStream());
			System.out.println("\nControl the Pololu 3pi with console commands: <direction> <speed> <duration>");
			System.out.println("direction = forward, backward, left, right, 1 <= speed <= 9, 1 <= duration <= 9\n");
			
			
			//*** MAIN LOOP - repeatedly read console input and send to Pololu ***
			while (true) {
				// set up console input
				BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
				String input = reader.readLine();
				if (input == "/quit") {
					out.writeByte('q');
					out.writeByte(0);
					out.writeByte(0);
					break; // quit command
				}
				String[] instructions = input.split(" "); // instructions separated by spaces
				if (instructions.length != 3) { // <direction> <speed> <duration>
					continue; // invalid instruction, loop again and read new input
				}
				int speed = 0;
				int duration = 0;
				try { // attempt to parse <speed> <direction>
					speed = Integer.parseInt(instructions[1]);
					duration = Integer.parseInt(instructions[2]);
				} catch (NumberFormatException e) {
					continue; // invalid <speed> or <direction>, loop again and read new input
				}
				if (speed < 1 || duration < 1 || speed > 9 || duration > 9) {
					continue; // <speed> or <direction> not in correct range, loop again and read new input
				}
				try { // determine <direction> and write to Pololu socket
					switch (instructions[0]) {
					case "forward":
						out.writeByte('w');
						break;
					case "backward":
						out.writeByte('s');
						break;
					case "left":
						out.writeByte('a');
						break;
					case "right":
						out.writeByte('d');
						break;
					default:
						continue;
					}
					// write <speed> <direction> to Pololu socket and flush
					out.writeByte(speed);
					out.writeByte(duration);
					out.flush();
				} catch (IOException e) {
					System.err.println("Cannot write to Pololu - please reconnect");
				}
			}
			serverSocket.close(); //close socket
		} catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
			System.err.println("Usage: java WiFiController <port>");
			return;
		} catch (IOException e) {
			System.err.println("Cannot use port number " + args[0]);
		}
	}
}
