const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

let books = {
    "11111": {
        title: "Don Quixote",
        author: "Miguel de Cervantes",
        reviews: [
            { username: "Karam Dargham", review: "Great book!" },
            { username: "John", review: "Informative read." }
        ]
    },
    "22222": {
        title: "The Lord of the Rings",
        author: "John Ronald Reuel Tolkien",
        reviews: []
    }
};

const authenticate = (req, res, next) => {
    const token = req.session?.authorization?.accessToken;

    if (!token) {
        return res.status(403).send({ message: "User not logged in" });
    }

    jwt.verify(token, 'access', (err, user) => {
        if (err) {
            return res.status(403).send({ message: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

const getAllBooks = (callback) => {
    setTimeout(() => {
        callback(null, Object.values(books));
    }, 1000); 
};

router.get("/", async (req, res) => {
    try {
        console.log("Fetching all books...");
        getAllBooks((error, booksList) => {
            if (error) {
                return res.status(500).json({ message: "Error retrieving books", error });
            }
            res.status(200).json(booksList);
        });
    } catch (error) {
        console.error("Error retrieving books:", error);
        res.status(500).json({ message: "Error retrieving books", error });
    }
});


const getBookByIsbn = (isbn) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const book = books[isbn];
            if (book) {
                resolve(book);
            } else {
                reject("Book not found"); 
            }
        }, 1000);
    });
};

router.get("/:isbn", async (req, res) => {
    const isbn = req.params.isbn;
    try {
        const book = await getBookByIsbn(isbn); 
        res.status(200).json(book);
    } catch (error) {
        res.status(404).send({ message: error });
    }
});

router.get("/author/:author", (req, res) => {
    const author = req.params.author;

    const booksByAuthor = Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase());

    if (booksByAuthor.length > 0) {
        res.status(200).json(booksByAuthor);
    } else {
        res.status(404).send({ message: "No books found for the given author" });
    }
});


router.get("/title/:title", (req, res) => {
    const title = req.params.title.toLowerCase();

    const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase().includes(title));

    if (booksByTitle.length > 0) {
        res.status(200).json(booksByTitle);
    } else {
        res.status(404).send({ message: "No books found for the given title" });
    }
});

router.get("/:isbn/reviews", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book) {
        res.status(200).json(book.reviews);
    } else {
        res.status(404).send({ message: "Book not found" });
    }
});




const addReview = (isbn, username, review) => {
    return new Promise((resolve, reject) => {
        console.log(`Simulating delay for adding review to book with ISBN: ${isbn}...`);
        setTimeout(() => {
            if (books[isbn]) {
                books[isbn].reviews.push({ username, review });
                resolve(books[isbn].reviews);
            } else {
                reject("Book not found");
            }
        }, 1000);
    });
};


router.post("/:isbn/review", authenticate, async (req, res) => {
    const isbn = req.params.isbn;
    const { username, review } = req.body;
    
    try {
        console.log(`Starting to add review to book with ISBN: ${isbn}`);
        const reviews = await addReview(isbn, username, review); 
        console.log("Review added successfully.");
        res.status(201).json({ message: "Review added successfully", reviews });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(404).json({ message: error });
    }
});


router.put("/:isbn/review", authenticate, (req, res) => {
    const isbn = req.params.isbn;
    const { username, review } = req.body;

    if (!books[isbn]) {
        return res.status(404).send({ message: "Book not found" });
    }

    const userReview = books[isbn].reviews.find(r => r.username === username);
    if (!userReview) {
        return res.status(404).send({ message: "Review not found for this user" });
    }

    userReview.review = review;
    res.status(200).send({ message: "Review updated successfully", reviews: books[isbn].reviews });
});


router.delete("/:isbn/review", authenticate, (req, res) => {
    const isbn = req.params.isbn;
    const { username } = req.body;

    if (!books[isbn]) {
        return res.status(404).send({ message: "Book not found" });
    }

    const reviewIndex = books[isbn].reviews.findIndex(r => r.username === username);
    if (reviewIndex === -1) {
        return res.status(404).send({ message: "Review not found for this user" });
    }

    books[isbn].reviews.splice(reviewIndex, 1);
    res.status(200).send({ message: "Review deleted successfully", reviews: books[isbn].reviews });
});

module.exports = router;