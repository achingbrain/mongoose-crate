var PostSchema = function() {};

PostSchema.plugin(attachments, {
	storage: require('mongoose-crate-localfs')({
		directory: "/path/to/storage/directory"
	}),
	fields: {
		image: {
			processor: require('mongoose-crate-imagemagick')({
				transform: {
					original: {
						// keep the original file
					},
					small: {
						resize: '150x150',
						format: 'jpg'
					},
					medium: {
						resize: '120x120',
						format: 'jpg'
					}
				}
			})
		}
	}
});