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
    }],
    activity: [ String ]
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
found.activity.push(`You have liked ${req.params.name}`);
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
found.activity.push(`You marked ${req.params.name} as watched`);
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
found.activity.push(`You added  ${req.params.name}  to your wishlist`);
found.save();
res.send(`done`);
});
});
});

app.post(`/likedel/:id/:movie`, (req, res)=>{
 console.log('deleted like');   
User.findOne({ username: req.user.username }, (err, user)=>{
user.activity.push(`You have removed ${req.params.movie} from your favourites`);
user.save();
});
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
req.connection.setTimeout( 1000 * 60 * 10 );
console.log('deleted watch');   
User.findOne({ username: req.user.username }, (err, user)=>{
    user.activity.push(`You have removed ${req.params.movie} from your watched list`);
    user.save();
    });
Watch.findOne({ imdbid: req.params.id, user: req.user.username }, (err, found)=>{
    if(err){
        console.log(err);
    }else{
        if(found){
            console.log('VALUE PRESENT');
            Watch.remove({ _id: found._id }, (err, removed)=>{
                if(err)
                console.log(err);
                else
                console.log(removed);
            });
    }else{
        console.log('value not found');
    }
}
});
});

app.post(`/wanttowatchdel/:id/:movie`, (req, res)=>{
console.log(`deleted want to watch`);    
User.findOne({ username: req.user.username }, (err, user)=>{
    user.activity.push(`You have removed ${req.params.movie} from your wish list`);
    user.save();
    });
Wtw.findOne( { imdbid: req.params.id, user: req.user.username }, (err, found)=>{
Wtw.remove({ _id: found._id }, (err, removed)=>{
    if(err)
    console.log(err)
    else
console.log(removed);
});
});
});

app.get(`/likes`, loggedin, (req, res)=>{
let title = 'favorites';
res.render(`fav.ejs`, { title: title, user: req.user.username });
});

app.get(`/watched`,loggedin, (req, res)=>{
    let title = 'watched';
    res.render(`watch.ejs`, { title: title, user: req.user.username });
    });
    
app.get(`/wtw`,loggedin, (req, res)=>{
    let title = 'in line';
    res.render(`wtw.ejs`, { title: title, user: req.user.username });
    });
        
app.get('/detaillike/:user', (req, res)=>{
User.findOne({ username: req.params.user }).populate('like').exec((err, found)=>{
console.log(found);
res.send(JSON.stringify(found));
});
});  
   
app.get('/detailwatch/:user', (req, res)=>{
    User.findOne({ username: req.params.user }).populate('watch').exec((err, found)=>{
    console.log(found);
    res.send(JSON.stringify(found));
    });
    });

app.get('/detailwtw/:user', (req, res)=>{
    User.findOne({ username: req.params.user }).populate('wtw').exec((err, found)=>{
    console.log(found);
    res.send(JSON.stringify(found));
    });
    });

 app.get(`/activity`, loggedin, (req, res)=>{
     let title = 'activity'; 
 res.render(`activity.ejs`, { title: title } );
 }); 

 app.post(`/addtrailer/:movie`, (req, res)=>{
 User.findOne({ username: req.user.username }, (err, user)=>{ 
 user.activity.push(`You watched the trailer of ${req.params.movie}`);
 user.save();
 });
 });

app.post('/delact', (req, res)=>{
console.log('clicked delact');
User.findOne({ username: req.user.username }, (err, user)=>{
console.log(user);
user.activity.splice(0,user.activity.length);
user.save();
console.log(user);
res.send('got it ');
// console.log(user);
// console.log(user.activity.length);
// for(let i=1;i<=user.activity.length;++i){
// console.log(i);
// user.activity.pop();
// console.log(user);
// }

});
});

 app.post(`/activitydetail`, (req, res)=>{
 User.findOne({ username: req.user.username },(err, found)=>{
 res.send(JSON.stringify(found));
 });
 });

app.listen(3000, ()=>{
   console.log(`Server started`); 
});
