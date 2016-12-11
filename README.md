# mongoose-crate

[![Dependency Status](https://david-dm.org/achingbrain/mongoose-crate.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate) [![devDependency Status](https://david-dm.org/achingbrain/mongoose-crate/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/mongoose-crate/master.svg)](https://travis-ci.org/achingbrain/mongoose-crate) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/mongoose-crate/master.svg)](https://coveralls.io/r/achingbrain/mongoose-crate)

mongoose-crate is a plugin for [Mongoose](http://mongoosejs.com/) for attaching files to documents.

File meta data is stored in MongoDB, whereas the actual file itself is stored on the [local filesystem](https://github.com/achingbrain/mongoose-crate-localfs), [Amazon S3](https://github.com/achingbrain/mongoose-crate-s3) or [Google Cloud Storage](https://github.com/achingbrain/mongoose-crate-gcs).  For others pull requests are gratefully accepted.

Uploaded images can optionally be passed through [ImageMagick](https://github.com/achingbrain/mongoose-crate-imagemagick) to generate one or more images (e.g. thumbnails, full size, original image, etc) before saving.

The architecture is nominally based on [mongoose-attachments](https://github.com/heapsource/mongoose-attachments) but that project hasn't seen updates in a while.

## Usage

The following example extends the 'Post' model to use attachments with a property called 'attachment'.

```javascript
const mongoose = require('mongoose')
const crate = require('mongoose-crate')
const LocalFS = require('mongoose-crate-localfs')

const PostSchema = new mongoose.Schema({
  title: String
})

PostSchema.plugin(crate, {
  storage: new LocalFS({
    directory: '/path/to/storage/directory'
  }),
  fields: {
    attachment: {}
  }
})

const Post = mongoose.model('Post', PostSchema)
```

.. then later:

```javascript
const post = new Post()
post.attach('attachment', {path: '/path/to/file'}, (error) => {
	// attachment is now attached and post.attachment is populated e.g.:
	// post.attachment.url

	// don't forget to save it..
	post.save((error) => {
		// post is now persisted
	})
})
```

.. or using promises:

```javascript
const post = new Post()
post
  .attach('attachment', {path: '/path/to/file'})
  .then(() => post.save())
```

### Arrays

Files can be stored in arrays as well as individual properties. Just specify the `array` property to the field definition:

```javascript
const mongoose = require('mongoose')
const crate = require('mongoose-crate')
const LocalFS = require('mongoose-crate-localfs')

const PostSchema = new mongoose.Schema({
  title: String
})

PostSchema.plugin(crate, {
  storage: new LocalFS({
    directory: '/path/to/storage/directory'
  }),
  fields: {
    attachments: {
      array: true
    }
  }
})

const Post = mongoose.model('Post', PostSchema)
```

.. then later:

```javascript
const post = new Post()
post.attach('attachments', {path: '/path/to/file'}, (error) => {
  // post.attachments.length == 1

  post.attach('attachments', {path: '/path/to/another/file'}, (error) => {
    // post.attachments.length == 2
  })
})
```

.. or using promises:

```javascript
const post = new Post()
post.attach('attachments', {path: '/path/to/file'})
  .then(() => post.attach('attachments', {path: '/path/to/another/file'}))
```

### Images

See [mongoose-crate-gm](https://github.com/achingbrain/mongoose-crate-gm).

[mongoose-crate-imagemagick](https://github.com/achingbrain/mongoose-crate-imagemagick) is also available but should be considered deprecated because the underlying dependencies are no longer maintained.

#### Using with Express.js uploads

Assuming that the HTML form sent a file in a field called 'image':

```javascript
app.post('/upload', (req, res, next) => {
  const post = new mongoose.model('Post')()
  post.title = req.body.title
  post.description = req.body.description
  post.attach('image', req.files.image)
    .then(() => post.save())
    .then(() => res.send('Post has been saved with file!'))
    .catch(err => next(err))
})
```

### Metadata

Basic meta data is captured about uploaded files.

Example:

```javascript
{
  "name" : "dragon.png",
  "size" : 26887,
  "type": "image/png",
  "url" : "http://my_bucket.s3.amazonaws.com/folder/4fbaaa31db8cec0923000019-medium.png"
}
```

Plugins can add extra meta data.  E.g. [mongoose-crate-imagemagick](https://github.com/achingbrain/mongoose-crate-imagemagick) adds width, height, etc.

## Deletes and updates

If you delete a model, any attached files will be removed along with it (with one caveat, see Schema methods vs Queries below).  Similarly, if you attach a file to a field that already has an attachment, the old file will be deleted before the new one is added.

For attachment arrays, when the model is saved, any attachments that are no longer in the array will have their files removed.

### Schema methods vs Queries

Removal of files happens via middleware - if you use `findById`, `findOne` or anything else that returns a [Query](http://mongoosejs.com/docs/queries.html) and call methods on that query, middleware is not executed. See the [Mongoose middleware docs](http://mongoosejs.com/docs/middleware.html#notes) for more.

In short, do this sort of thing:

```javascript
MySchema.remove({...}, callback)
```

or this:

```javascript
MySchema.findOne({...}, (err, doc) => {
  doc.remove(callback)
})
```

..but not this:

```javascript
MySchema.findOne({...}).remove(callback)
```

### Array attachment deletion

```javascript
const mongoose = require('mongoose')
const crate = require('mongoose-crate')
const LocalFS = require('mongoose-crate-localfs')

const MySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})

MySchema.plugin(crate, {
  storage: new LocalFS({
    directory: '/path/to/storage/directory'
  }),
  fields: {
    files: {
      array: true
    }
  }
})

// ...

const model = new MySchema()
model.name = 'hello'
model.attach('files', {
    path: file
}, callback)

// some time later remove one of the array entries

model.files.pop()
model.save()
```

### Non array attachment deletion

```javascript
const mongoose = require('mongoose')
const crate = require('mongoose-crate')
const LocalFS = require('mongoose-crate-localfs')

const MySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})

MySchema.plugin(crate, {
  storage: new LocalFS({
    directory: '/path/to/storage/directory'
  }),
  fields: {
    file: {}
  }
})

// ...

const model = new MySchema()
model.name = 'hello'
model.attach('file', {
    path: file
}, callback)

// some time later delete the file

model.file = null
model.save()
```
