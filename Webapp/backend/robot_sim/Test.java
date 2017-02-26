class Test {
	static int[][] tiles = new int[][]{ {1, 0, 1, 1},
		{1, 0, 0, 1},
		{1, 1, 0, 1},
		{0, 0, 1, 1} };

	public static void main(String[] args) {
		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(0, tiles, 10);
				r.connect("localhost");
			}
		});

		Thread thread2 = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(1, tiles, 10);
				r.connect("localhost");
			}
		});

		Thread thread3 = new Thread(new Runnable() {
			@Override
			public void run() {
				Robot r = new Robot(2, tiles, 10);
				r.connect("localhost");
			}
		});

		thread.start();
		thread2.start();
		thread3.start();
	}
}
