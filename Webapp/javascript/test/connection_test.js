var expect = chai.expect;

// Add some dummy functions that will otherwise 
// be defined.
var updateCanvas = function() {};
var updateState = function() {};

describe('the socketUpdateArea function', function() {
	it('should update', function() {
		tiles = []
		socketUpdateArea({xDim: 10, yDim: 10});

		expect(tiles.length).to.equal(10);
		expect(tiles[0].length).to.equal(10);
		expect(tiles[0][0]).to.equal(DEFAULT_TILE_CONTENTS);
	});

	it('should preserve changes', function() {
		tiles[0][0] = 100;
		tiles[3][2] = 20;
		
		// And test edge cases:
		var oldLength = tiles.length - 1;
		var oldLengthInner = tiles[oldLength].length - 1;

		tiles[oldLength][oldLengthInner] = -10;

		socketUpdateArea({xDim: 12, yDim: 15});
		socketUpdateArea({xDim: 17, yDim: 15});

		expect(tiles.length).to.equal(17);
		expect(tiles[0].length).to.equal(15);
		expect(tiles[0][0]).to.equal(100);
		expect(tiles[3][2]).to.equal(20);
		expect(tiles[oldLength][oldLengthInner]);
	});

	it('should respond by maintaining a rectangular shape even when presented ' +
		' with conflicting messages', function() {
			var validate = function() {
				if (tiles.length === 0) {
					return true;
				}

				for (var i = 0; i < tiles.length; i ++) {
					expect(tiles[i].length).to.equal(tiles[0].length);
				}
			}
			// reset the tile contents
			var tiles = [];
			socketUpdateArea({xDim: 10, yDim: 2});
			validate();
			socketUpdateArea({xDim: 2, yDim: 30});
			validate();
			socketUpdateArea({xDim: -1, yDim: -20});
			validate();
			socketUpdateArea({xDim: 25, yDim: -1});
			validate();
			socketUpdateArea({xDim: 0, yDim: 0});
			validate();
			socketUpdateArea({xDim: -10, yDim: 31});
			validate();

		});
});

describe('the socketReceiveStatus function', function() {
	it('should update a robot by id:', function() {
		socketReceiveStatus({status: 1, x: 11, y: 12, id: 0});

		expect(robots[0].status).to.equal(1);
		expect(robots[0].x).to.equal(11);
		expect(robots[0].y).to.equal(12);
		expect(robots[0].id).to.equal(0);
	});
});

describe('the socketTileUpdate function', function() {
	it('should update a tile', function() {
		socketUpdateArea({xDim: 10, yDim: 10});
		socketTileUpdate({x: 0, y: 2, value: 13});

		expect(tiles[0][2]).to.equal(13);
	});

	it('should handle out of bounds arguments by expanding the board', 
			function() {
		socketTileUpdate({x: 15, y: 17, value: 3});
		expect(tiles[15][17]).to.equal(3);
	});
});
