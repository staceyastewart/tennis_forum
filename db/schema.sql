-- db name is tennis
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS courts;
-- DROP TABLE IF EXISTS onlineCourts;
-- DROP TABLE IF EXISTS tennisPermits;


CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_digest VARCHAR(255) NOT NULL,
  username TEXT UNIQUE NOT NULL,
  borough VARCHAR(50) NOT NULL,
  level VARCHAR(5) NOT NULL
);

-- CREATE TABLE courts (
--   id SERIAL PRIMARY KEY,
--   borough VARCHAR(10),
--   court_name VARCHAR(255),
--   court_address VARCHAR(500),
--   court_zip_code VARCHAR(50)
-- );

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content VARCHAR(550) NOT NULL,
  category VARCHAR(100) NOT NULL,
  level VARCHAR(5) NOT NULL,
  borough VARCHAR(50) NOT NULL,
  username TEXT NOT NULL
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  post_id INTEGER REFERENCES posts(id) NOT NULL,
  content VARCHAR(450) NOT NULL,
  level VARCHAR(5) NOT NULL,
  borough VARCHAR(50) NOT NULL,
  username TEXT NOT NULL
);

-- CREATE TABLE onlineCourts (
--   id SERIAL PRIMARY KEY,
--   first_reservation VARCHAR(150),
--   last_reservation VARCHAR(150),
--   location VARCHAR(100),
--   reservation_courts VARCHAR(10),
--   walk_on_courts VARCHAR(10)
-- );

-- CREATE TABLE tennisPermits (
--   id SERIAL PRIMARY KEY,
--   age_group VARCHAR(150),
--   fee VARCHAR(10)
-- );
