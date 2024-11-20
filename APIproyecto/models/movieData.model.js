const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const movieSchema = new Schema({
    id: {
        type: Number,
        unique: true
    },
    title: {
        type: String,
    },
    synopsis: {
        type: String,
    },
    duration: {
        type: String,
    },
    actors: [{
        name: String,
        profileUrl: String
    }],
    coverPhoto: {
        type: String,
    },
    categories: [{
        type: String,
    }]
}, { timestamps: true });

movieSchema.plugin(AutoIncrement, { inc_field: 'id' });

movieSchema.pre('save', function (next) {
    const xss = require('xss');
    this.title = xss(this.title);
    this.synopsis = xss(this.synopsis);
    this.duration = xss(this.duration);
    
    next();
});
const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
