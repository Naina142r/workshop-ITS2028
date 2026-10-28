-- Chive Journey database schema + starter data
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, hash TEXT, salt TEXT, planted TEXT, points INTEGER DEFAULT 0, joined TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER);
CREATE TABLE IF NOT EXISTS checkins(user_id INTEGER, day TEXT, note TEXT, height REAL, watered INTEGER, PRIMARY KEY(user_id, day));
CREATE TABLE IF NOT EXISTS completions(user_id INTEGER, week INTEGER, PRIMARY KEY(user_id, week));
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, body TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY, post_id INTEGER, user_id INTEGER, body TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS polls(id INTEGER PRIMARY KEY, question TEXT, user_id INTEGER);
CREATE TABLE IF NOT EXISTS poll_options(id INTEGER PRIMARY KEY, poll_id INTEGER, label TEXT);
CREATE TABLE IF NOT EXISTS votes(user_id INTEGER, poll_id INTEGER, option_id INTEGER, PRIMARY KEY(user_id, poll_id));

-- Starter poll for the workshop audience
INSERT INTO polls(id, question) VALUES(1, 'What is your biggest Chinese chive challenge?');
INSERT INTO poll_options(poll_id, label) VALUES(1,'Slow growth'),(1,'Pests'),(1,'Knowing when to harvest'),(1,'Winter care');
