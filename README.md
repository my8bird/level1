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

```db.get(
	{String}			id,
	{Function(err, x)}	callback
)```

---

```db.getOrUndefined(
	{String}			id,
	{Function(err, x)}	callback
)```

---

```db.query(
	{Boolean Function(doc, index)}	filterFn,
	{Function(err, docs)}			callback
)```

---

```{Object[]} db.sortPaginate(
	{Object[]}						docs,
	[{Boolean Function(doc1, doc2)}	sortFn],
	[{Number}						docsPerPage],
	[{Number}						pageNr]
)```



### set (create/update)

```db.set(
	{Object}			doc,
	[{Function(err, x)}	callback]
)```

---

```db.setBulk(
	{Object[]}			docs,
	[{Function(err, x)}	callback]
)```

---

```db.updateQuery(
	{Boolean Function(doc, index)}	filterFn,
	{Function(doc)}					updateFn
	?
)```



### delete

```db.del(
	{String}			id,
	[{Function(err, x)}	callback]
)```

---

```db.delBulk(
	{String[]}			arrayOfIds,
	[{Function(err, x)}	callback]
	?
)```

---

```db.delQuery(
	{Boolean Function(doc, index)}	filterFn,
	[{Function(err, x)}	callback]
	?
)```
