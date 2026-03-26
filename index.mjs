import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({extended:true}));
//setting up database connection pool, replace values in red
const pool = mysql.createPool({
    host: "hcm4e9frmbwfez47.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "qql8f5gjoz6h26i9",
    password: "wxqdkp8x24gcm0b1",
    database: "cwu2z0h9g8btcsgr",
    connectionLimit: 10,
    waitForConnections: true
});
//routes
app.get('/', async (req, res) => {
    let sql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
    try {
        const [authors] = await pool.query(sql);
        const [categories] = await pool.query("SELECT DISTINCT category FROM quotes ORDER BY category");

        res.render('home.ejs', { authors, categories });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByKeyword", async(req, res) => {
   try {
        let keyword = req.query.keyword;
        let sql = "SELECT quote, firstName, lastName FROM quotes NATURAL JOIN authors WHERE quote LIKE ?";
        let sqlParam = [`%${keyword}%`];
        const [rows] = await pool.query(sql, sqlParam);
        res.render('quotes.ejs', { rows });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByAuthor", async(req, res) => {
    try {
        let authorId = req.query.authorId;
        let sql = "SELECT quote, firstName, lastName FROM quotes NATURAL JOIN authors WHERE authorId = ?";
        let sqlParam = [authorId];
        const [rows] = await pool.query(sql, sqlParam);
        res.render('quotes.ejs', { rows });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByCategory", async(req, res) => {
    try {
        let category = req.query.category;
        let sql = "SELECT quote, firstName, lastName FROM quotes NATURAL JOIN authors WHERE category = ?";
        let sqlParam = [category];
        const [rows] = await pool.query(sql, sqlParam);
        res.render('quotes.ejs', { rows });
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
        let sql = "SELECT quote, firstName, lastName, likes FROM quotes NATURAL JOIN authors WHERE likes BETWEEN ? AND ? ORDER BY likes DESC";
        let sqlParams = [minLikes, maxLikes];
        const [rows] = await pool.query(sql, sqlParams);
        res.render('likes.ejs', { rows, minLikes, maxLikes });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.listen(3000, ()=>{
    console.log("Express server running")
})
