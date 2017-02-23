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
});
