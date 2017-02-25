class Test {
	static int[][] tiles = new int[][]{ {1, 0, 0, 1},
		{1, 0, 0, 1},
		{1, 0, 0, 1},
		{1, 0, 0, 1} };

	public static void main(String[] args) {
		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(0, tiles);
				r.connect("localhost");
			}
		});

		Thread thread2 = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(1, tiles);
				r.connect("localhost");
			}
		});

		Thread thread3 = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(2, tiles);
				r.connect("localhost");
			}
		});

		thread.start();
		thread2.start();
		thread3.start();
	}
}
