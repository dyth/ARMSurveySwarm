var expect = require('chai').expect;
var routing = require('../route.js');
var processing = require('../processing.js');

describe('Test move call to route', function() {
	it('should return new x/y co-ordinates in a dictionary ' +
			' with keys xAfter, yAfter', function() {

		var results = routing.move(0);
		if (results.stopAll === false && results.wait === false) {
			expect(results.xAfter).to.be.at.least(0);
			expect(results.yAfter).to.be.at.least(0);
		} else {
			expect(results.xAfter).to.equal(-1);
			expect(results.yAfter).to.equal(-1);
		}
	});

	it('should respond with actual results once the processing has started',
		function() {
			routing.setUp(10);
			var results = routing.move(0);
			expect(results.stopAll).to.be.false;
			expect(results.xAfter).to.be.at.least(0);
			expect(results.yAfter).to.be.at.least(0);
	});

	it('getRandomInt should be in the range', function() {
		expect(routing.getRandomInt(0, 10)).to.be.within(0, 10);
		expect(routing.getRandomInt(0, 10)).to.be.within(0, 10);
		expect(routing.getRandomInt(0, 10)).to.be.within(0, 10);
		// Zero
		expect(routing.getRandomInt(0, 0)).to.be.within(0, 0);
		expect(routing.getRandomInt(1, 1)).to.be.within(1, 1);
	});

	it('robots should not route to same tile ', function() {
		routing.setUp(10);
		var robots = processing.getRobots().slice();
		var results = routing.move(1);
		var sameTile = (robots[1].xPrev === results.xAfter &&
			robots[1].yPrev === results.yAfter);
		expect(sameTile).to.be.false;

		//now not first move so can collide
		results = routing.move(1);
		sameTile = (robots[1].xPrev === results.xAfter &&
			robots[1].yPrev === results.yAfter);
		expect(sameTile).to.be.false;
	});
});

describe('setUp ', function() {
	it('should work if setup is called multiple times', function() {
		routing.setUp(10);
		expect(routing.uncheckedTiles.length).to.equal(99);
	});
});

describe('removeTile ', function() {
	it('should remove tiles', function() {
		routing.setUp(10);
		var tileHead = routing.uncheckedTiles[0];
		routing.removeTile(tileHead.xPos, tileHead.yPos);
		expect(routing.uncheckedTiles[0]).to.not.equal(tileHead);
	});

	it('should work regardless of index chosen', function() {
		routing.setUp(10);
		var tileHead = routing.uncheckedTiles[35];
		routing.removeTile(tileHead.xPos, tileHead.yPos);
		expect(routing.uncheckedTiles[35]).to.not.equal(tileHead);
		expect(routing.uncheckedTiles.length).to.equal(98);
	});
});

describe('willCollide', function() {
		it('Return true when attempting to cross another robot\'s path', function() {
			routing.setUp(10);
			// when 2 isn't set it is going one step in x direction
			expect(routing.willCollide(4, 0, 3)).to.be.true;
		});

});
