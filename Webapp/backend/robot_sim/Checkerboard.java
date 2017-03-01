import javax.swing.*;
import java.awt.*;
import java.util.*;
import java.awt.geom.Ellipse2D;

public class Checkerboard extends JPanel {
	public static final int WIDTH = 800;
	public static final int HEIGHT = 800;
	static final long serialVersionUID = 0;

	int[][] colors;
	ArrayList<Color> robots;
	ArrayList<Integer> robotsX;
	ArrayList<Integer> robotsY;

	public static void main(String[] args) {
		Checkerboard board = new Checkerboard(new int[][] {
			{1, 0, 1}, {0, 1, 0}, {1, 0, 1}
		});

		JFrame window = new JFrame("Robots");
		window.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
		window.setPreferredSize(new Dimension(WIDTH, HEIGHT));
		window.add(board);
		window.pack();
		window.setVisible(true);
	}

	public Checkerboard(int[][] colors) {
		this.colors = colors;
		setSize(WIDTH, HEIGHT); 
		setVisible(true);

		robots = new ArrayList<Color>();
		robotsX = new ArrayList<Integer>();
		robotsY = new ArrayList<Integer>();
	}

	private Color randomColor() {
		Random random = new Random();
		final float hue = random.nextFloat();
		final float saturation = 0.9f;//1.0 for brilliant, 0.0 for dull
		final float luminance = 1.0f; //1.0 for brighter, 0.0 for black
		Color color = Color.getHSBColor(hue, saturation, luminance);

		return color;
	}

	public void setRobotPosition(int robotID, int x, int y) {
		System.out.println("Robots: " + robots.size());
		while (robotID >= robots.size()) {
			robots.add(randomColor());
			robotsX.add(0);
			robotsY.add(0);
		} 
		// update the robot position;
		robotsX.set(robotID, x);
		robotsY.set(robotID, y);

		// This resets the GUI
		this.revalidate();
		this.repaint();
	}

	@Override
	public void paintComponent(Graphics g) {
		super.paintComponent(g);
		Graphics2D g2d = (Graphics2D)g;

		int cellHeight = WIDTH / colors.length;
		int cellWidth = HEIGHT / colors[0].length;

		for (int i = 0; i < colors.length; i ++) {

			for (int j = 0; j < colors[i].length; j ++) {
				if (colors[i][j] == 1) {
					g2d.setColor(Color.BLACK);
				} else {
					g2d.setColor(Color.WHITE);
				}

				g2d.fillRect(j * cellWidth, i * cellHeight, 
						(j + 1) * cellWidth, (i + 1) * cellHeight);
			}
		}

		int robotRadius = Math.min(cellWidth, cellHeight) / 5;
		// draw the robots
		for (int i = 0; i < robotsX.size(); i ++) {
			int x = robotsX.get(i);
			int y = robotsY.get(i);

			System.out.println("Drawing robot at " + x + " " + y);

			Color color = robots.get(i);

			// Drw the circle
			Shape theCircle = new Ellipse2D.Double(
					x * cellWidth + cellWidth / 2 - robotRadius, 
					y * cellHeight + cellHeight / 2 - robotRadius, 
					2.0 * robotRadius, 2.0 * robotRadius);
			g2d.setColor(color);
			g2d.fill(theCircle);
		}
	}
}
