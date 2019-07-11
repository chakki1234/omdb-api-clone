const express = require(`express`),
    app = express(),
    body = require(`body-parser`),
    mongoose = require(`mongoose`),
    passport = require(`passport`),
    localstrategy = require(`passport-local`),
    passportlocalmongoose = require(`passport-local-mongoose`),
    expresssession = require(`express-session`),
    request = require(`request`);

mongoose.connect(`mongodb://localhost:27017/apiclone`, { useNewUrlParser: true });


let likeSchema = new mongoose.Schema({

    movie: String,
    imdbid: String,
    user: String
});
Like = mongoose.model('like', likeSchema);

let watchSchema = new mongoose.Schema({

    movie: String,
    imdbid: String,
    user: String
});
Watch = mongoose.model('watch', watchSchema);

let wtwSchema = new mongoose.Schema({

    movie: String,
    imdbid: String,
    user: String
});
Wtw = mongoose.model('wtw', wtwSchema);

let userSchema = new mongoose.Schema({

    username: String,
    password: String,
    like: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'like' 
        }],
    watch: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'watch'
        }],
    wtw:[{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'wtw'
    }]
});
userSchema.plugin(passportlocalmongoose);
User = mongoose.model(`user`, userSchema);

 app.use(require("express-session")({
        secret: "nothing",
        resave: false,
        saveUninitialized: false
    }));    
app.use(express.json());
app.use(express.text());
app.use(express.static(`public`));
app.use(body.urlencoded({ extended : true }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function loggedin(req, res, next){
    if(req.isAuthenticated())
       next()
    else
       res.redirect(`/login`); 
}

app.get(`/`, (req, res)=>{
    let title = `sign up`;
    res.render(`signup.ejs`, { title: title });
});

app.post(`/signup`, (req, res)=>{
User.register(new User ({ username: req.body.username }), req.body.password, (err, added)=>{
if(err)
console.log(err);
else
passport.authenticate(`local`)(req, res, function(err){
    res.redirect(`/dashboard`);
});
});
});

app.get(`/login`, (req, res)=>{
let title = `login`;
res.render(`login.ejs`, { title: title });
});

app.post(`/login`,passport.authenticate(`local`,{
    successRedirect: `/dashboard`,
    failureRedirect: `/login`
}), (req, res)=>{     
});

app.get(`/logout`, (req, res)=>{
req.logout();
res.redirect(`/`);
});

app.get(`/dashboard`,loggedin, (req, res)=>{
let title = `login`;
res.render(`dashboard.ejs`, { title: title });
});

app.get(`/id/:id`,loggedin, (req, res)=>{
let likec = 0 ,watchc = 0 ,wtwc = 0;
Like.findOne({ imdbid: req.params.id, user: req.user.username },(err, found)=>{
if(found)
likec = 1;
Watch.findOne({ imdbid: req.params.id, user: req.user.username },(err, found2)=>{
    if(found2)
    watchc = 1;
    Wtw.findOne({ imdbid: req.params.id, user: req.user.username },(err, found3)=>{
        if(found3)
        wtwc = 1;
        });
    });
});
request(`http://www.omdbapi.com/?i=${req.params.id}&apikey=thewdb`, (err, resp, body)=>{
let parse = JSON.parse(body);
let title = 'display';
res.render(`dtemp.ejs`, { title: title, result: parse, like: likec, watch: watchc, wtw: wtwc });
});
});

app.post(`/like/:id/:name`, (req, res)=>{
console.log('added a like');
Like.create({ movie: req.params.name, imdbid: req.params.id, user: req.user.username },(err, created)=>{
User.findOne({ username: req.user.username }).populate('like').exec((err, found)=>{
found.like.push(created._id);
found.save();
res.send(`done`);
});
});
});


app.post(`/watched/:id/:name`, (req, res)=>{
console.log('added watch');
Watch.create({ movie: req.params.name, imdbid: req.params.id, user: req.user.username }, (err, created)=>{
User.findOne({ username: req.user.username }).populate('watch').exec(function(err, found){
found.watch.push(created._id);
found.save();
res.send(`done`);
});
});
});


app.post(`/wanttowatch/:id/:name`, (req, res)=>{
console.log('added want to watch');
Wtw.create({ movie: req.params.name, imdbid: req.params.id, user: req.user.username }, (err, created)=>{
User.findOne({ username: req.user.username }).populate('wtw').exec((err, found)=>{
found.wtw.push(created._id);
found.save();
res.send(`done`);
});
});
});

app.post(`/likedel/:id/:movie`, (req, res)=>{
 console.log('deleted like');   
Like.findOne({ imdbid: req.params.id, user: req.user.username }, (err, found)=>{
Like.remove({ _id: found._id }, (err, removed)=>{
    if(err)
    console.log(err);
    else
    console.log(removed);
});
});
});

app.post(`/watcheddel/:id/:movie`, (req, res)=>{
 console.log('deleted watch');   
Watch.findOne({ imdbid: req.params.id, user: req.user.username }, (err, found)=>{
Watch.remove({ _id: found._id }, (err, removed)=>{
    if(err)
    console.log(err);
    else
    console.log(removed);
});
});
});

app.post(`/wanttowatchdel/:id/:movie`, (req, res)=>{
console.log(`deleted want to watch`);    
Wtw.findOne( { imdbid: req.params.id, user: req.user.username }, (err, found)=>{
Wtw.remove({ _id: found._id }, (err, removed)=>{
    if(err)
    console.log(err)
    else
console.log(removed);
});
});
});

app.listen(3000, ()=>{
   console.log(`Server started`); 
});


