# mongoose-crate

[![Dependency Status](https://david-dm.org/achingbrain/mongoose-crate.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate) [![devDependency Status](https://david-dm.org/achingbrain/mongoose-crate/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrainmongoose-crate#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/mongoose-crate/master.svg)](https://travis-ci.org/achingbrain/mongoose-crate) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/mongoose-crate/master.svg)](https://coveralls.io/r/achingbrain/mongoose-crate)

mongoose-crate is a plugin for [Mongoose](http://mongoosejs.com/) that makes handling files a doddle.

It's nominally based on [mongoose-attachments](https://github.com/heapsource/mongoose-attachments) but without the absentee landlord.

## Usage

The following example extends the 'Post' model to use attachments with a property called 'attachment'.

```javascript
var mongoose = require("mongoose"),
  crate = require("mongoose-crate");

var PostSchema = new mongoose.Schema({
  title: String
});

PostSchema.plugin(crate, {
  storage: new LocalFS({
    directory: "/path/to/storage/directory"
  }),
  fields: {
    attachment: {}
  }
});

var Post = mongoose.model('Post', PostSchema);
```

.. then later:

```javascript
var post = new Post();
post.attach("attachment", {path: "/path/to/file"}, function(error) {
	// attachment is now attached and post.attachment is populated e.g.:
	// post.attachment.url

	// don't forget to save it..
	post.save(function(error) {
		// post is now persisted
	});
});
```

### Arrays

Files can be stored in arrays as well as individual properties. Just specify the `array` property to the field definition:

```javascript
var mongoose = require("mongoose"),
  crate = require("mongoose-crate");

var PostSchema = new mongoose.Schema({
  title: String
});

PostSchema.plugin(crate, {
  storage: new LocalFS({
    directory: "/path/to/storage/directory"
  }),
  fields: {
    attachments: {
      array: true
    }
  }
});

var Post = mongoose.model('Post', PostSchema);
```

.. then later:

```javascript
var post = new Post();
post.attach("attachments", {path: "/path/to/file"}, function(error) {
  // post.attachments.length == 1

  post.attach("attachments", {path: "/path/to/another/file"}, function(error) {
    // post.attachments.length == 2
  });
});
```
### Images

See mongoose-crate-imagemagick.

#### Using with Express.js uploads

Assuming that the HTML form sent a file in a field called 'image':

```javascript
app.post('/upload', function(req, res, next) {
  var post = new mongoose.model('Post')();
  post.title = req.body.title;
  post.description = req.body.description;
  post.attach('image', req.files.image, function(err) {
    if(err) return next(err);
    post.save(function(err) {
      if(err) return next(err);
      res.send('Post has been saved with file!');
    });
  })
});
```

#### Using with an stand-alone app files

```javascript
var post = new mongoose.model('Post')();
post.title = 'Title of the Post';
post.description = 'Description of the Post';
post.attach("image", "/path/to/the/file.png", function(err) {
    if(err) return next(err);
    post.save(function(err) {
      if(err) return next(err);
      console.log('Post has been Saved with file');
    });
})
```

### Metadata

Basic meta data is captured about uploaded files.

Example:

```javascript
{
  "name" : "dragon.png",
  "size" : 26887,
  "url" : "http://my_bucket.s3.amazonaws.com/folder/4fbaaa31db8cec0923000019-medium.png"
}
```
