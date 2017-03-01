class Test {
	static int[][] tiles = new int[][]{ {1, 0, 1, 1},
		{1, 0, 0, 1},
		{1, 1, 0, 1},
		{0, 0, 1, 1} };

	public static void main(String[] args) {
		Robot r = new Robot(0, tiles, 10);
		r.connect("localhost");
	}
}
