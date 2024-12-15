const express = require("express");
const app = express();
const path = require("path");
const passport = require("passport");
require("./config/passport");
const dotenv = require("dotenv").config();
const session = require("express-session");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter=  require('./routes/adminRouter')

db();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,  
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")]);


app.use(express.static("public"));

// app.use((req, res, next) => {
//     // console.log("Session ID:", req.sessionID);
//     // console.log("Session User:", req.user);
//     next();
// });


app.use("/", userRouter);
app.use('/admin',adminRouter)



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
