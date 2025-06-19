const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const db = new sqlite3.Database('messages.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    pseudo TEXT PRIMARY KEY,
    password TEXT,
    token TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromUser TEXT,
    toUser TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`INSERT OR IGNORE INTO users VALUES ('ADMIN', 'motsdepassa123', null)`);
});

app.post('/api/login', (req, res) => {
  const { pseudo, password } = req.body;
  db.get("SELECT * FROM users WHERE pseudo = ?", [pseudo], (err, row) => {
    if (row && row.password === password) {
      const token = crypto.randomBytes(16).toString('hex');
      db.run("UPDATE users SET token = ? WHERE pseudo = ?", [token, pseudo]);
      res.json({ success: true, token });
    } else if (!row) {
      const token = crypto.randomBytes(16).toString('hex');
      db.run("INSERT INTO users(pseudo, password, token) VALUES (?, ?, ?)", [pseudo, password, token]);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Mot de passe incorrect" });
    }
  });
});

app.post('/api/message', (req, res) => {
  const { token, message } = req.body;
  db.get("SELECT pseudo FROM users WHERE token = ?", [token], (err, row) => {
    if (!row) return res.status(403).end();
    const from = row.pseudo;
    if (message.startsWith("/msg ")) {
      const [_, toUser, ...msgParts] = message.split(" ");
      const text = msgParts.join(" ");
      db.run("INSERT INTO messages(fromUser, toUser, text) VALUES (?, ?, ?)", [from, toUser, text]);
    } else {
      db.run("INSERT INTO messages(fromUser, toUser, text) VALUES (?, NULL, ?)", [from, message]);
    }
    res.end();
  });
});

app.get('/api/messages', (req, res) => {
  db.all("SELECT fromUser AS from, text FROM messages WHERE toUser IS NULL ORDER BY id DESC LIMIT 50", (err, rows) => {
    res.json({ messages: rows.reverse() });
  });
});

app.listen(3000);