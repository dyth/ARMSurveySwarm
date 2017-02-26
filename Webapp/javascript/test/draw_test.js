var expect = chai.expect;

describe('setup function', function() {
	it('should setup correct state', function() {

		numRobots = 5;
		setupState();
		setupDraw();

		expect(stage != null);
		expect(canvas != null);
		expect(graph != null);

		expect(robotSprites.length == robots.length);

	});
});

describe('updateRobotPosition', function () {

	it('should update the sprite position', function () {

		var robot = robots[0];

		robot.x = 10;
		robot.y = 10;

		var size = canvas.width() / tiles.length;

		updateRobotPosition(0);

		var robotSprite = robotSprites[0];

		expect(robotSprite.x == (robot.x + 0.5) * size);
		expect(robotSprite.y == (tiles.length - robot.y - 0.5) * size);

	});

});
