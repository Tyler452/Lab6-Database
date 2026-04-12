import 'dotenv/config';

import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({extended:true}));
//setting up database connection pool, replace values in red with environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PWD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true
});

async function getSearchOptions() {
    const [authors] = await pool.query("SELECT authorId, firstName, lastName FROM authors ORDER BY lastName, firstName");
    const [categories] = await pool.query("SELECT DISTINCT category FROM quotes ORDER BY category");

    return { authors, categories };
}

function buildHomeViewModel({ authors, categories, keywordError = '', formValues = {} }) {
    return {
        authors,
        categories,
        keywordError,
        formValues: {
            keyword: formValues.keyword ?? '',
            authorId: formValues.authorId ?? '',
            category: formValues.category ?? '',
            minLikes: formValues.minLikes ?? '',
            maxLikes: formValues.maxLikes ?? ''
        }
    };
}
//routes
app.get('/', async (req, res) => {
    try {
        const { authors, categories } = await getSearchOptions();
        res.render('home.ejs', buildHomeViewModel({ authors, categories }));
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByKeyword", async(req, res) => {
   try {
        let keyword = (req.query.keyword || '').trim();

        if (keyword.length < 3) {
            const { authors, categories } = await getSearchOptions();

            return res.status(400).render('home.ejs', buildHomeViewModel({
                authors,
                categories,
                keywordError: 'Keyword must be at least 3 characters long.',
                formValues: { keyword }
            }));
        }

        let sql = "SELECT quote, firstName, lastName, authorId FROM quotes NATURAL JOIN authors WHERE quote LIKE ?";
        let sqlParam = [`%${keyword}%`];
        const [rows] = await pool.query(sql, sqlParam);
        res.render('quotes.ejs', { rows, searchLabel: `Results for keyword \"${keyword}\"` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByAuthor", async(req, res) => {
    try {
        let authorId = req.query.authorId;
        let sql = "SELECT quote, firstName, lastName, authorId FROM quotes NATURAL JOIN authors WHERE authorId = ?";
        let sqlParam = [authorId];
        const [rows] = await pool.query(sql, sqlParam);
        const authorName = rows[0] ? `${rows[0].firstName} ${rows[0].lastName}` : 'selected author';
        res.render('quotes.ejs', { rows, searchLabel: `Results for ${authorName}` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByCategory", async(req, res) => {
    try {
        let category = req.query.category;
        let sql = "SELECT quote, firstName, lastName, authorId FROM quotes NATURAL JOIN authors WHERE category = ?";
        let sqlParam = [category];
        const [rows] = await pool.query(sql, sqlParam);
        res.render('quotes.ejs', { rows, searchLabel: `Category: ${category}` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByLikes", async(req, res) => {
    try {
        let minLikes = req.query.minLikes ? Number(req.query.minLikes) : 0;
        let maxLikes = req.query.maxLikes ? Number(req.query.maxLikes) : 999999;
        if (Number.isNaN(minLikes)) {
            minLikes = 0;
        }
        if (Number.isNaN(maxLikes)) {
            maxLikes = 999999;
        }
        if (minLikes > maxLikes) {
            const temp = minLikes;
            minLikes = maxLikes;
            maxLikes = temp;
        }
        let sql = "SELECT quote, firstName, lastName, authorId, likes FROM quotes NATURAL JOIN authors WHERE likes BETWEEN ? AND ? ORDER BY likes DESC";
        let sqlParams = [minLikes, maxLikes];
        const [rows] = await pool.query(sql, sqlParams);
        res.render('likes.ejs', { rows, minLikes, maxLikes });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

//API to get the author information by authorId
app.get("/api/author/:authorId", async(req, res) => {
    try {
        let authorId = req.params.authorId;
        let sql = "SELECT * FROM authors WHERE authorId = ?";
        const [authorInfo] = await pool.query(sql, [authorId]);
        if(authorInfo.length === 0) {
            return res.status(404).json({ error: "Author not found" });
        }

        res.json(authorInfo[0]);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});


app.listen(3000, ()=>{
    console.log("Express server running")
})
