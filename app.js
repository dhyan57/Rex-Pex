const express = require("express");
const app = express();
const path = require("path");
const passport = require("passport");
const dotenv = require("dotenv").config();
const session = require("express-session");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter=  require('./routes/adminRouter')

// Initialize Database
db();

// Middleware for parsing request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
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

// Passport Middleware
require("./config/passport"); // Import Passport strategy configuration
app.use(passport.initialize());
app.use(passport.session());

// Prevent caching
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")]);

// Serve Static Files
app.use(express.static("public"));

// Routes
app.use("/", userRouter);
app.use('/admin',adminRouter)


// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
