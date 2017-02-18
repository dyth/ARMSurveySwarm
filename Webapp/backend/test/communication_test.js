var expect = require('chai').expect;
var coms = require('../communication.js');

describe('should be in test mode', function() {
	expect(coms.TEST).to.equal(true);
});

describe('robot list management', function() {
	it('should add connections ok', function() {
		coms.addRobotByID(0, {destroyed: false});
		coms.addRobotByID(5, {destroyed: false});

		expect(coms.robots.length).to.equal(2);
		expect(coms.robots[1].socket.destroyed).to.equal(false);
	});

	it('should retrieve robots', function() {
		var robot0Socket = coms.getSocketByID(0);
		expect(robot0Socket.destroyed).to.equal(false);
	});

	it('should retrieve only live connections', function() {
		coms.addRobotByID(3, {destroyed: true});

		var connected = coms.getConnectedRobots();

		for (var i = 0; i < connected.length; i ++) {
			expect(connected[i].id).to.not.equal(3);
		}
	});
});
