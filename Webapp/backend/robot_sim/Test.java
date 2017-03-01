import javax.swing.*;
import java.awt.*;

class Test {
	static int[][] tiles = new int[][]{ {1, 0, 1, 1},
		{1, 0, 0, 1},
		{1, 1, 0, 1},
		{0, 0, 0, 1} };

	public static final int TILE_SIZE = 10;

	public static void main(String[] args) {
		final Checkerboard board = new Checkerboard(tiles);

		JFrame window = new JFrame("Robots");
		window.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
		window.setPreferredSize(new Dimension(
					Checkerboard.WIDTH, Checkerboard.HEIGHT));
		window.add(board);
		window.pack();
		window.setVisible(true);

		//Thread thread = new Thread(new Runnable() {
		//@Override
		//public void run() {
		Robot r = new Robot(0, tiles, TILE_SIZE);
		r.setMovementListener(new MovementListener() {
			public void move(int x, int y) {
				System.out.println("Board update called");
				board.setRobotPosition(0, x / TILE_SIZE, y / TILE_SIZE);
			}
		});
		// Note that this call has to be last becausse 
		// it blocks
		r.connect("localhost");
		//}
		//});

		// thread.start();
	}
}
