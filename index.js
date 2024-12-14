const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const bookRoutes = require('./router/books');

const app = express();
const PORT = 5000;

let users = [];


app.use(express.json());
app.use(session({
    secret: "fingerprint_secret",
    resave: true,
    saveUninitialized: true
}));

app.get("/" , (req,res)=>{
    res.send("Welcome in our book app")
})

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send({ message: "Missing username or password" });
    }

    if (users.find(user => user.username === username)) {
        return res.status(409).send({ message: "User already exists" });
    }

    users.push({ username, password });
    res.status(201).send({ message: "User registered successfully!" });
});


app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);

    if (!user) {
        return res.status(401).send({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });
    req.session.authorization = { accessToken };
    res.status(200).send({ message: "Login successful", token: accessToken });
});


app.use("/books", bookRoutes);

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
