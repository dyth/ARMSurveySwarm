var expect = chai.expect;

describe('setup function', function() {
	it('should setup correct state', function() {

		sessionStorage.setItem(KEY_NUM_ROBOTS, 7);
		setupState();
		expect(robots.length == 7);

		sessionStorage.setItem(KEY_NUM_ROBOTS, -1);
		setupState();
		expect(robots.length == 0);

	});
});
