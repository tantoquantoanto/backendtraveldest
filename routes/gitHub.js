const express = require('express')
const github = express.Router()
const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy
const session = require('express-session')
const jwt = require('jsonwebtoken')
require('dotenv').config()


github.use(
    session({
        secret: process.env.CLIENT_SECRET,
        resave: false,
        saveUninitialized: false,
    })
)


github.use(passport.initialize())

github.use(passport.session())


passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})


passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: process.env.CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await UsersModel.findOne({ email: profile._json.email });
                if (!user) {
                    const { name, email, login, avatar_url } = profile._json;
                    
                    // Dividi il nome completo in nome e cognome
                    const [givenName, familyName = ""] = name ? name.split(" ") : [login, ""];
                    
                    const userToSave = new UsersModel({
                        name: givenName,
                        surname: familyName,
                        username: `${givenName}_${familyName}` || login,
                        email: email || `${login}@github.com`,
                        dob: new Date(),
                        password: "12345678",
                        role: "user",
                        img: avatar_url,
                    });
                    user = await userToSave.save();
                }
                done(null, user);
            } catch (error) {
                console.log("Error creating user:", error);
                done(error, null);
            }
        }
    )
);

github.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

github.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    async (req, res) => {
        try {
            let user = await UsersModel.findOne({ email: req.user._json.email });
            
            if (!user) {
                const { name, email, login, avatar_url } = req.user._json;
                
                const [givenName, familyName = ""] = name ? name.split(" ") : [login, ""];
                
                const newUser = new UsersModel({
                    name: givenName,
                    surname: familyName,
                    username: `${givenName}_${familyName}` || login,
                    email: email || `${login}@github.com`,
                    dob: new Date(),
                    password: "12345678",
                    role: "user",
                    img: avatar_url,
                });
                user = await newUser.save();
            }

            // Creazione del payload per il token JWT
            const payload = {
                userId: user._id, 
                email: user.email,
                role: user.role,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

            // Redirect alla pagina di successo con il token JWT
            const redirectUrl = `${process.env.VITE_CLIENT_BASE_URL}/success/${encodeURIComponent(token)}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error("Errore durante la generazione del token:", error);
            res.redirect("/");
        }
    }
);

github.get('/success', (req, res) => {
    res.redirect(process.env.VITE_CLIENT_BASE_URL)
})

github.get('/oauth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('errore')
        }

        req.session.destroy((error) => {
            if (error) {
                console.log(error || error.message)
            }

            res.redirect('/')
        })
    })
})

module.exports = github
