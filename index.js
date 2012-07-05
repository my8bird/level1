/*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global */



var leveldb		= require('leveldb');
var uuid		= require('node-uuid');



/**
 * @function ?
 *
 * @param	{String}			pth		path to db folder (creates one if not there already)
 * @param	{Function(err, db)	cb0		returns the level1 API for the given leveldb database
 */
var level1 = function(pth, cb0) {

	'use strict';
	
	leveldb.createClient(pth, {create_if_missing:true}, function(err) {
		if (err) {	cb0(err);	}
		
		var db = this;
		
		cb0(null, {

			/***************
			 * GET / QUERY *
			 ***************/

			/**
			 * @function {String} ? gets  the given object from db
			 *
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
			 *
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
			 * @function ? queries for objects according to a filter function
			 *
			 * @param {optional	Function(o, idx)}		filterFn	filter function. return true if you want the object to be returned
			 * @param {			Function(err, docs)}	cb			callback to invoke once all objects are found
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



			/**********************
			 * ADVANCED QUERY OPS *
			 **********************/

			/**
			 * @function ? queries for objects according to a filter function
			 *
			 * @param {optional	Function(o, idx)}	filterFn	filter function. return true if you want alls objects to be counted
			 * @param {			Function(err)}		cb			callback to invoke once all objects are found
			 */
			count:	function(filterFn, cb) {
				if (cb === undefined) {
					cb = filterFn;
					filterFn = function() {	return true;	};
				}

				var res = 0;
				var it = db.newIterator();
				var idx = 0;
				var o, val;
				it.seekToFirst(function() {
					while (it.valid()) {
						val = it.value();
						if (val === null) {	it.next();	continue;	}
						o = JSON.parse(	val.toString()	);
						if (	filterFn(o, idx)	) {	++res;	}
						++idx;
						it.next();
					}
					cb(null, res);
				});
			},

			/**
			 * @function {Object[]} ? synchronous function that takes documents and performs sorting and pagination
			 *
			 * @param {Object[]}				docs		the documents array to sort and paginate
			 * @param {Function(doc1, doc2)}	sortFn		sort function. should return a negative number if doc1 < doc2
			 * @param {Number}					pageSize	the size of the docs resulting page
			 * @param {optional Number}			pageNumber	nth page to display (defaults to first 1, that is 0)
			 *
			 * @returns {Object[]}				the resulting page of sorted documents
			 */
			sortPaginate:	function(docs, sortFn, pageSize, pageNumber) {
				if (sortFn) {
					docs.sort(sortFn);
				}
				
				if (pageNumber === undefined) {
					pageNumber = 0;
				}
				
				var from = pageNumber * pageSize;
				var to = from + pageSize;
				return docs.slice(from, to);
			},

			/**
			 * @function {Object[]|Object} ? synchronous function that returns the documents grouped by property/fn
			 *
			 * @param {Object[]}				docs
			 * @param {String|Function(doc)}	propertyOrFn	object property or function which composes several property values
			 * @param {optional Boolean}		asArray			returns array with {key, count, [docs[]]}, otherwise returns hash of key -> docs[].
			 * @param {optional Boolean}		skipDocs		if trueish, docs a
			 *
			 * @returns {Object[]|Object}		if asArray is trueish, the array of sorted results, each one {key, count, docs}.
			 *									Otherwise returns an object with propertyValues as keys and related docs as value.
			 */
			groupBy:	function(docs, propertyOrFn, asArray, skipDocs) {
				var docsAux = {};
				var key, doc, isProp = (typeof propertyOrFn === 'string');
				for (var i = 0, f = docs.length; i < f; ++i) {
					doc = docs[i];
					key = isProp ? doc[propertyOrFn] : propertyOrFn(doc);

					if (!(key in docsAux)) {	docsAux[key] = [doc];	}
					else {						docsAux[key].push(doc);	}
				}

				var keys;
				if (asArray) {	// returns array of {key, count, [docs[]]}
					var docs2 = [];
					keys = Object.keys(docsAux);
					var vals, row;
					for (i = 0, f = keys.length; i < f; ++i) {
						key = keys[i];
						vals = docsAux[key];
						row = {
							key:	key,
							count:	vals.length
						};
						if (!skipDocs) {	// send docs array on each resulting row
							row.docs = vals;
						}
						docs2.push(row);
					}

					return docs2;
				}
				else {	// retruns hash of key -> docs[] or count
					if (skipDocs) {	// replaces array of docs for their lengths
						keys = Object.keys(docsAux);
						for (i = 0, f = keys.length; i < f; ++i) {
							key = keys[i];
							docsAux[key] = docsAux[key].length;
						}
					}
					return docsAux;
				}
			},



			/***********************
			 * SET (CREATE/UPDATE) *
			 ***********************/

			/**
			 * @function ? creates/updates the given object to db
			 *
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
			 * @function ? sets several objects
			 *
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
			 * @function ? updates objects which pass filter function
			 *
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
			},
			
			
			
			/**********
			 * DELETE *
			 **********/
			
			/**
			 * @function ? removes the object from the db
			 *
			 * @param {String}					id		object's id to remove
			 * @param {optional Function(err)}	cb		callback to invoke once object is removed
			 */
			del:	function(id, cb) {
				db.del(id, function(err) {
					if (err) {	return cb ? cb(err) : undefined;	}
					
					if (cb) {	cb(null);	}
				});
			},
			
			/**
			 * @function ? deletes several objects
			 *
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
			 *
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
			}
			
		});
	});
};



module.exports = level1;
