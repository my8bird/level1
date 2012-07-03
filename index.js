var leveldb		= require('leveldb');
var uuid		= require('node-uuid');



var level1 = function(pth, cb0) {
	
	leveldb.createClient(pth, {create_if_missing:true}, function(err) {
		if (err) {	cb0(err);	}
		
		var db = this;
		
		cb0(null, {
			
			/**
			 * @function ? creates/updates the given object to db
			 * @param {Object}						o		the object to store
			 * @param {optional	Function(err, id)}	cb		callback to invoke once object is stored
			 */
			set:	function(o, cb) {
				if (!('_id' in o)) {
					o._id = uuid();
				}
				
				db.put(
					new Buffer(o._id),
					new Buffer(	JSON.stringify(o)	),
					(cb
						?	function(err) {
								if (err) {	return cb ? cb(err) : undefined;	}
								if (cb) {	cb(null, o._id);	}
							}
						:	undefined
					)
				);
			},
			
			
			/**
			 * @function {String} ? gets  the given object from db
			 * @param {String}				id		the object key to look for
			 * @param {Function(err, o)}	cb		callback returning the found object
			 */
			get:	function(id, cb) {
				db.get(id, function(err, val) {
					if (err) {		return cb(err);									}
					if (!val) {	return cb('object with id = "' + id + '" was not found!');	}
					var o = JSON.parse(	val.toString()	);
					cb(null, o);
				});
			},
			
			
			/**
			 * @function {String} ? gets  the given object from db or undefined if not found
			 * @param {String}				id		the object key to look for
			 * @param {Function(err, o)}	cb		callback returning the found object
			 */
			getOrUndefined:	function(id, cb) {
				db.get(id, function(err, val) {
					if (err) {		return cb(err);	}
					if (!val) {	return cb(null);	}
					var o = JSON.parse(	val.toString()	);
					cb(null, o);
				});
			},
			
			
			/**
			 * @function ? removes the object from the db
			 * @param {String}					id		object's id to remove
			 * @param {optional Function(err)}	cb		callback to invoke once object is removed
			 */
			del:	function(id, cb) {
				db.del(id, function(err, asd) {
					if (err) {	return cb ? cb(err) : undefined;	}
					
					console.log(arguments);
					if (cb) {	cb(null);	}
				});
			},
			
			
			/**
			 * @function ? queries for objects according to a filter function
			 * @param {optional	Function(o, idx)}	filterFn	filter function. return true if you want the object to be returned
			 * @param {			Function(err)}		cb			callback to invoke once all objects are found
			 */
			query:	function(filterFn, cb) {
				if (cb === undefined) {
					cb = filterFn;
					filterFn = function() {	return true;	};
				}
				
				var res = [];
				var it = db.newIterator();
				var idx = 0;
				var o, val;
				it.seekToFirst(function() {
					while (it.valid()) {
						val = it.value();
						if (val === null) {	it.next();	continue;	}
						o = JSON.parse(	val.toString()	);
						if (	filterFn(o, idx)	) {	res.push(o);	}
						++idx;
						it.next();
					}
					cb(null, res);
				});
			},
			
			
			sortPaginate:	function(res, sortFn, pageSize, pageNumber) {
				if (sortFn) {
					res.sort(sortFn);
				}
				
				if (pageNumber === undefined) {
					pageNumber = 0;
				}
				
				var from = pageNumber * pageSize;
				var to = from + pageSize;
				return res.slice(from, to);
			},
			
			
			/**
			 * @function ? sets several objects
			 * @param {			Object[]}		objects to store
			 * @param {optional	Function(err)}	callback to invoke once all objects are stored
			 */
			setBulk:	function(objs, cb) {
				var res = objs.slice();
				var left = res.length;
				var that = this;
				
				var innerCb = function(err, id) {
					--left;
					if (err) {	return cb ? cb(err) : undefined;	}
					if (left === 0 && cb) {	cb(null);	}
				};
				
				for (var i = 0, f = res.length; i < f; ++i) {
					that.set(res[i], innerCb);
				}
			},
			
			
			/**
			 * @function ? deletes several objects
			 * @param {			String[]}		ids of objects to delete
			 * @param {optional	Function(err)}	callback to invoke once all objects are deleted
			 */
			delBulk:	function(ids, cb) {
				var res = ids.slice();
				var left = res.length;
				var that = this;
				
				var innerCb = function(err, id) {
					--left;
					if (err) {	return cb ? cb(err) : undefined;	}
					if (left === 0 && cb) {	cb(null);	}
				};
				
				for (var i = 0, f = res.length; i < f; ++i) {
					that.del(res[i], innerCb);
				}
			},
			
			
			/**
			 * @function ? deletes objects according to a filter function
			 * @param {optional	Function(o)}	fn		filter function. return true if you want the object to be deleted
			 * @param {optional	Function(err)}	cb		callback to invoke once all objects are parsed
			 */
			delQuery:	function(fn, cb) {
				if (cb === undefined) {
					cb = fn;
					fn = function() {	return true;	};
				}
				
				var ids = [];
				var it = db.newIterator();
				var o, val;
				var that = this;
				it.seekToFirst(function() {
					while (it.valid()) {
						val = it.value();
						if (val === null) {	it.next();	continue;	}
						o = JSON.parse(	val.toString()	);
						if (	fn(o)	) {	ids.push(o._id);	}
						it.next();
					}
					that.delBulk(ids, cb);
				});
			},
			
			
			/**
			 * @function ? updates objects which pass filter function
			 * @param {			Function(o)}	filterFn		filter function. return true if you want the object to be changed
			 * @param {			Function(o)}	updateFn		update function. change object internally
			 * @param {			Function(err)}	cb				callback to invoke once all objects are updated
			 */
			updateQuery:	function(filterFn, updateFn, cb) {				
				var res = [];
				var it = db.newIterator();
				var o, val;
				var that = this;
				it.seekToFirst(function() {
					while (it.valid()) {
						val = it.value();
						if (val === null) {	it.next();	continue;	}
						o = JSON.parse(	val.toString()	);
						if (	filterFn(o)	) {
							updateFn(o);
							res.push(o);
						}
						it.next();
					}
					that.setBulk(res, cb);
				});
			}
			
		});
	});
};



module.exports = level1;
