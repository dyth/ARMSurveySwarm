var expect = require('chai').expect;
var routing = require('../route.js');
var processing = require('../processing.js');

describe('Test move call to route', function() {
	it('should return new x/y co-ordinates in a dictionary ' +
			' with keys xAfter, yAfter', function() {
		routing.setUp(10);
		var results = routing.move(0,0);
		if (results.stopAll === false) {
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
			var results = routing.move(0,0);
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
});

describe('setUp ', function() {
	it('should work if setup is called multiple times', function() {
		routing.setUp(10);
		routing.setUp(10);
		expect(routing.uncheckedTiles[0].length
			+ routing.uncheckedTiles[1].length
			+ routing.uncheckedTiles[2].length
			+ routing.uncheckedTiles[3].length).to.equal(10*2 + 8*2 - 8);
	});


	it('should work if setup is called in a non-sensical manner', function() {
		routing.setUp(100);
		routing.setUp(0);
		routing.setUp(-2);
		routing.setUp(9);
		expect(routing.uncheckedTiles[0].length
			+ routing.uncheckedTiles[1].length
			+ routing.uncheckedTiles[2].length
			+ routing.uncheckedTiles[3].length).to.equal(9*2 + 7*2 - 8);
	});
});

describe('removeTile ', function() {
	it('should remove tiles', function() {
		routing.setUp(10);
		// remove tile from first quadrant
		var tileHead = routing.uncheckedTiles[0][0];
		routing.removeTile(tileHead.xPos, tileHead.yPos);
		expect(routing.uncheckedTiles[0]).to.not.equal(tileHead);
	});

	it('should work regardless of index chosen', function() {
		routing.setUp(10);
		var tileHead = routing.uncheckedTiles[0][2];
		routing.removeTile(tileHead.xPos, tileHead.yPos);
		expect(routing.uncheckedTiles[0][2]).to.not.equal(tileHead);
		expect(routing.uncheckedTiles[0].length).to.equal(6);
	});
});
