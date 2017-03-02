import javax.swing.*;
import java.awt.*;
import java.util.Random;

class Test {
	static final int TILE_NO = 10;
	public static final int TILE_SIZE = 10;
	static final Random tileGen = new Random(1);

	static int tiles[][] = new int[TILE_NO][TILE_NO];

	public static void main(String[] args) {
		for (int i = 0; i < TILE_NO; i ++) {
			for (int j = 0; j < TILE_NO; j ++) {
				tiles[i][j] = tileGen.nextInt(2);
				System.out.println("Setting tile to " + tiles[i][j]);
			}
		}

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
