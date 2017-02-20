var expect = require('chai').expect;
var routing = require('../route.js');

describe('A call to route', function() {
	it('should return new x/y co-ordinates in a dictionary ' +
			' with keys xAfter, yAfter', function() { 
		var results = routing.move(0, 10, 10);

		expect(results.xAfter).to.be.at.least(0);
		expect(results.yAfter).to.be.at.least(0);
	});
});

