require('dotenv').config();


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const flash = require('connect-flash');
const passport = require('passport')
const LocalStratergy = require("passport-local");

const User = require("./models/user.js");
const ExpressError = require('./utils/ExpressError.js');

const app = express();
const listingRouter = require('./routes/listings.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');


const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    crypto: {
        secret: process.env.SESSION_SECRET
    },
    touchAfter: 24*3600
});

store.on("error", ()=>{
    console.log("error in mongo session store", error)
})

const sessionOptions = {
    store: store,
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 *3,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly : true
    }
};


app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride("_method"));
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})



/* app.get('/', (req,res)=>{
    res.render("root.ejs");
}); */










app.use('/listings', listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);




app.all('*', (req,res,next)=>{
    next(new ExpressError(404, "Page Not Found!"))
});

app.use((err, req, res, next)=>{
    let {statusCode = 500, message="something went wrong"} = err;
    res.status(statusCode);
    res.render('error.ejs',{statusCode, message})
})



mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("connected to db")
})
.then(()=>{
    app.listen(8080, (error)=>{
        if(!error){
            console.log(`Server listening at port: 8080`)
        }
        else{
            console.log(error, ` error listening to the server.`)
        }
    })
})
.catch((err)=>{
    console.log(err)
});