const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/confessionDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex" , true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
  });

  userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/" , function(req,res){
      res.render("home");
});

app.get("/about" , function(req,res){
      res.render("about");
});

app.get("/confessions" , function(req,res){
  User.find({"secret":{$ne:null}}, function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        res.render("confessions" , {userWithSecrets: foundUser})
      }
    }
  })
});

app.get("/contact" , function(req,res){
    res.render("contact");
});

app.get("/create" , function(req,res){
  if(req.isAuthenticated()){
    res.render("create");
  }else{
    res.redirect("/login");
  }
});

app.get("/login" , function(req,res){
    res.render("login");
});

app.get("/register" , function(req,res){
    res.render("register");
});

app.post("/register" , function(req,res){
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/confessions");
      })
    }
  });
});

app.post("/login" , function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/confessions");
      });
    }

  });
});

app.post("/create" , function(req,res){
  const submittedSecret = req.body.secret ;

  console.log(submittedSecret);

  User.findById(req.user.id  ,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret ;
        foundUser.save(function(){
          res.redirect("/confessions")
        });
      }
    }
  })
});

app.get("/logout" , function(req,res){
  req.logout();
  res.redirect("/");
});


 app.listen(3000, function() {
    console.log("server is running at port 3000");
  });