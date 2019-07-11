let mongoose = require(`mongoose`),
    passportlocalmongoose = require(`passport-local-mongoose`);

let UserSchema = new mongoose.Schema({ 
  
    username : String,
    password : String,
    like : {
             movie: String,
             imdbid: Number 
    },
    watched: {
             movie: String,
             imdbid: Number
    },
    wanttowatch : {

             movie: String,
             imdbid: Number
    }

});

UserSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model(`User`, UserSchema);