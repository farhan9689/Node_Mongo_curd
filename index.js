//index.js
var express = require('express'),
	MongoClient = require('mongodb').MongoClient,
	app = express(),
	mongoUrl = 'mongodb://localhost:27017/textmonkey';
	const bodyparser = require('body-parser');
var redisClient = require('redis').createClient;
var redis = redisClient(6379, "localhost");
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());
var access = require('./access.js');

MongoClient.connect(mongoUrl, function(err, db) {
	if (err)
		throw 'Error connecting to database - ' + err;
	
	app.post('/book', function(req,res) {
		if (!req.body.title || !req.body.author)
			res.status(400).send("Please send a title and an author for the book");
		else if (!req.body.text)
			res.status(400).send("Please send some text for the book");
		else {
			access.saveBook(db, req.body.title, req.body.author, req.body.text, function(err) {
				if (err)
					res.status(500).send("Server error"); 
				else
					res.status(201).send("Saved");
			}); 
		}
	});
	
	app.get('/bookTitle', function(req,res) {
        var title = req.query.title;
        console.log(title);
        if (!title)
			res.status(400).send("Please send a proper title");
		else {
			access.findBookByTitleCached(db, redis, title, function(book) {
				if (!book)
					res.status(500).send("Server error");
				else
					res.status(200).send(book);
			});
		}
	});

	app.put('/book_update', function(req,res) {
		if(!req.query.title)
			res.status(400).send("Please send the book title");
		else if (!req.query.title)
			res.status(400).send("Please send the new text");
		else {
			access.updateBookByTitle(db, redis, req.query.title, req.query.text, function(result) {
				if(result == "Missing book")
					res.status(404).send("Book not found");
				else if(!result)
					res.status(500).send("Server error");
				else
					res.status(200).send("Updated");
			});
		}
	});
	
	app.listen(8000, function() {
		console.log('Listening on port 8000');
	});
});