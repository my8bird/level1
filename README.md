# level 1 - A simple leveldb wrapper for nodejs


## example

```javascript
var level1 = require('./level1');
level1('ONE.db', function(err, db) {
	if (err) {	throw err;	}
	// stores a document
	db.set(
		{	// document to store
			name:	'Afonso Henriques',	// no id passed, stores on new id
			age:	19
		},
		function(err, id) {				// callback fn
			if (err) {	throw err;	}
			console.log(id);			// returns the id
		}
	);
});
```


## level1 instance methods:



### get / query

```javascript
db.get(
	{String}			id,
	{Function(err, x)}	callback
)
```

---

```javascript
db.getOrUndefined(
	{String}			id,
	{Function(err, x)}	callback
)
```

---

```javascript
db.query(
	{Boolean Function(doc, index)}	filterFn,
	{Function(err, docs)}			callback
)
```



### advanced query ops

```javascript
db.count(
	[{Boolean Function(doc)}	filterFn],
	{Function(err, count)}		cb]
)
```

---

```javascript
{Object[]} db.sortPaginate(
	{Object[]}						docs,
	[{Boolean Function(doc1, doc2)}	sortFn],
	[{Number}						docsPerPage],
	[{Number}						pageNr]
)
```

Synchronous function that receives a query result and applies sorting and/or pagination.

---

```javascript
{Object[]} db.groupBy(
	{Object[]}						docs,
	{String|String Function(doc)}	propertyOrFn,
	[{Boolean}						asArray],
	[{Boolean}						skipDocs]
)
```

Synchronous function that receives a query result and groups it by a property or other criteria extracted via a function.

If asArray is trueish, the array of sorted results, each one `{key, count, [docs[]]}`.

Otherwise returns an object with propertyValues as keys and related docs as value.



### set (create/update)

```javascript
db.set(
	{Object}			doc,
	[{Function(err, x)}	callback]
)
```

---

```javascript
db.setBulk(
	{Object[]}			docs,
	[{Function(err, x)}	callback]
)
```

---

```javascript
db.updateQuery(
	{Boolean Function(doc, index)}	filterFn,
	{Function(doc)}					updateFn
)
```



### delete

```javascript
db.del(
	{String}			id,
	[{Function(err)}	callback]
)
```

---

```javascript
db.delBulk(
	{String[]}			arrayOfIds,
	[{Function(err)}	callback]
)
```

---

```javascript
db.delQuery(
	{Boolean Function(doc, index)}	filterFn,
	[{Function(err)}				callback]
)
```
