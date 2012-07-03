var level1 = require('./index');


level1('ONE.db', function(err, db) {
	
	if (0) {		// CREATES NEW
		db.set(
			{
				name:	'Afonso Henriques',
				age:	19
			},
			function(err, id) {
				if (err) {	throw err;	}
				console.log(id);
			}
		);
	}
	
	if (0) {		// CREATES/UPDATES (id was passed in)
		db.set(
			{
				_id:	'40f35b0a-6738-42f5-b140-9c66f2d3d245',
				name:	'Afonso Henriques Segundo',
				age:	21
			},
			function(err, id) {
				if (err) {	throw err;	}
				console.log(id);
			}
		);
	}
	
	if (0) {		// GETS
		db.get('40f35b0a-6738-42f5-b140-9c66f2d3d245', function(err, o) {
			if (err) {	throw err;	}
			console.log(o);
		});
		
		db.getOrUndefined('40f35b0a-6738-42f5-b140-9c66f2d3d245x', function(err, o) {
			if (err) {	throw err;	}
			console.log(o);
		});
	}
	
	if (1) {		// QUERIES
		/*db.query(*/
			/*function(o) {
				return (o.age < 20);
			},*/
			/*function(err, res) {
				if (err) {	throw err;	}
				console.log(res);
				console.log(res.length);
			}
		);*/
			
		/*db.query(
			function(o, idx) {
				return idx < 4;
			},
			function(err, res) {
				if (err) {	throw err;	}
				console.log(res);
				console.log(res.length);
			}
		);*/
		
		var srt = function(o) {	return o.name;	};
		var sortByName = function(o1, o2) {	return srt(o1) > srt(o2) ? 1 : -1;	};
		
		db.query(
			function(err, res) {
				if (err) {	throw err;	}
				
				res = db.sortPaginate(
					res,
					sortByName,
					4,
					0		// first page of 4 items
				);
				
				var repr = function() {	return [this.name].join('');	};
				res.forEach(function(o) {	o.toString = repr;	});
				console.log(res.toString());
			}
		);
	}
	
	if (0) {	// DEL
		db.del(
			'13a2444e-3963-40de-bea0-756db18e5293',
			function(err) {
				console.log('DELLLLL');
				console.log(arguments);
			}
		);
	}
	
	if (0) {	// SETS IN BULK
		/*db.setBulk(
			[
				{name:'Joseph',		age:50},
				{name:'Anna',		age:44},
				{name:'Ralph',		age:68}
			],
			function(err, res) {
				if (err) {	throw err;	}
				console.log(res);
			}
		);*/
		
		var chars = '0123456789abcdefghiklmnopqrstuvwxyz';
		var randomString = function(n) {
			var res = [];
			while (n-- > 0) {
				res.push(	chars[	Math.floor(	Math.random() * chars.length	)	]	);
			}
			return res.join('');
		}
		
		var items = [];
		for (var i = 0; i < 30; ++i) {
			items.push({
				name:	randomString(6),
				age:	Math.floor(Math.random() * 60) + 16
			});
		}
		db.setBulk(items);
	}
	
	if (0) {	// DELS IN QUERY
		db.delQuery(
			function(o) {
				return (o.name.charAt(0) !== 'A');
			}
		);
	}
	
	if (0) {	// DELS IN BULK
		db.delBulk([
			'5f39a281-1314-46c7-b571-3b8b3b1c0a66',
			'd35f1d8c-ff0e-4fd8-bf66-8c0dbb28ebdf'
		]);
	}
	
	if (0) {	// UPDATE QUERY
		db.updateQuery(
			function(o) {
				return true;
			},
			function(o) {
				o.number = Math.floor(Math.random() * 100) + 1;
			}
		);
	}
	
});
