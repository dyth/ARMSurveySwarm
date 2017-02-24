var expect = require('chai').expect;
var routing = require('../route.js');

describe('Test move call to route', function() {
	it('should return new x/y co-ordinates in a dictionary ' +
			' with keys xAfter, yAfter', function() {
		var results = routing.move(0, 10, 10);
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
			routing.setUp(100);
			var results = routing.move(0, 1, 1);
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
	it('should fail if setup is called multiple times', function() {
		routing.setUp(10);
		expect(routing.uncheckedTiles.length).to.equal(99);
	});
});

describe('removeTile ', function() {
	it('should remove tiles', function() {
	});
});
