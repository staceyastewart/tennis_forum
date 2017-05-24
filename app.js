const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const bodyParser = require("body-parser");
const session = require('express-session');
let methodOverride = require('method-override');
var fetch = require('node-fetch');

/* BCrypt stuff here */
const bcrypt = require('bcrypt');
const salt = bcrypt.genSalt(10);

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method')); //method override

app.use(session({
  secret: 'TENNISPARTNERS',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

var db = pgp('postgres://staceyastewart@localhost:5432/tennis');

app.listen(3000, function () {
  console.log('Shoebill Auth App: listening on port 3000!');
});

//renders the homepage
app.get("/", function(req, res){
  if(req.session.user){
    //user is logged in
    let data = {
      "logged_in": true,
      "email": req.session.user.email
    }
    res.render("index", data)
  } else {
    //user is not logged in
    res.render("index")
  }
});

//renders the signup page
app.get('/signup', function(req, res){
  res.render('signup/index');
});

//lets you sign up
app.post('/signup', function(req, res){
  let data = req.body
  bcrypt
    .hash(data.password_digest, 10, function(err, hash) {
      db
        .none("INSERT INTO users(first_name, last_name, email, password_digest, username, borough, level) VALUES ($1, $2, $3, $4, $5, $6, $7)", [data.first_name, data.last_name, data.email, hash, data.username, data.borough, data.level])
        .then(function(id){
          db
            .one("SELECT * FROM users WHERE email = $1", [data.email])
            .then(function(el){
              req.session.user = el
              res.redirect("/partners");
            })
        })
        .catch(function(e){
          res.render("signup/show")
        })
      })
  });

//renders login page
app.get('/login', function(req, res){
  res.render('login/index');
});

//actually lets you log in
app.post('/login', function(req, res){
  let data = req.body
  db
    .one("SELECT * FROM users WHERE email = $1", [data.email])
    .then(function(user){
      //let the user in
      bcrypt.compare(data.password, user.password_digest, function(err, comp){
        if (comp){
          //create a session for the user
          req.session.user = user;
          res.redirect("/partners")
        } else {
          res.render("login/show")
        }
      })
    })
    .catch(function(){
      //in case something goes wrong
      res.render("login/show")
    })
});

//renders the partner forums home page
app.get('/partners', function(req, res){
  if(req.session.user){
    //user is logged in
    let data = {
      "logged_in": true,
      "email": req.session.user.email
    }
    res.render("partners/index", data)
  } else {
    //user is not logged in
    res.render("partners/index")
  }
});

//renders page to create new post
app.get('/partners/new', function(req, res){
  // console.log(req.session.user)
  if(req.session.user){

    db
      .one("SELECT * FROM users WHERE email = $1", [req.session.user.email])
      .then(function(data){
        // console.log(data)
        let view_data = {
          user: data,
          logged_in: true,
          email: req.session.user.email
        }
        res.render("partners/new", view_data)
      })
  } else {
    //user is not logged in
    res.redirect("/login")
  }
});

//lets you create a new post in for the forum
//when you do, it redirects you to your post
app.post('/new', function(req, res){
  console.log("POST DATA")
  console.log(req.session.user)
  let data = req.body
  console.log(data)
  db
    .one("INSERT INTO posts (user_id, title, content, category, level, borough, username) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id as new_id", [req.session.user.id, data.title, data.content, data.category, data.level, data.borough, req.session.user.username])
    .then(function(data){
      res.redirect("/partners/" + data.new_id)
    })
    .catch(function(){
      //should add a view
      res.send("Oops! Something bad happened")
    })
});

//renders the posts page
app.get("/partners/all", function(req, res){
  if(req.session.user){
    //user is logged in
    db
      .any("SELECT * FROM posts ORDER BY id DESC")
      .then(function(data){
        // console.log(data)
        let view_data = {
          posts: data,
          logged_in: true,
          email: req.session.user.email,
          viewing_all: true
        }
        res.render("partners/all", view_data)
      })
  } else {
    //user is not logged in
    res.redirect("/login")
  }
});

//renders each individual post page
app.get("/partners/:id", function(req, res){
  let id = req.params.id;
  let view_data = {};

  if(req.session.user){
    db
    .one("SELECT * FROM posts WHERE id = $1", id)
    .then(function(post){
      db
        .any("SELECT * FROM comments WHERE post_id = $1", id)
        .then(function(comments){
  	      view_data.post = post;
  	      view_data.comments = comments;
  	      view_data.logged_in = true;
  	      view_data.email = req.session.user.email;
  	      view_data.user = req.session.user;
          //bryan helped with this
          comments.forEach(function(comment){
            comment.current_users_comment = (req.session.user.id === comment.user_id) ? true : false;
          })
          if(post.user_id === req.session.user.id){
	          view_data.this_users_post = true;
          }
          res.render("partners/id", view_data);
        });
    });
  } else {
    res.redirect("/login")
  }
});


//lets the user delete their own post
app.delete("/partners/:id", function(req, res){
  id = req.params.id
  user = Number(req.body.posts_user_id)
  if(user===req.session.user.id) {
    db
      .none("DELETE FROM posts WHERE id = $1", [id])
      .then(function(data){
        res.redirect("/partners/all")
      })
  }
})

//renders the update page
app.get("/partners/update/:id", function(req, res){
  let id = req.params.id
  if(req.session.user){
    db
    .one("SELECT * FROM posts WHERE id = $1", id)
    .then(function(data){
      console.log(data) //this gives the data of the post
      //if the user in this session is the author of the post
      if(data.user_id===req.session.user.id){
        let view_data = {
          post: data,
          logged_in: true,
          email: req.session.user.email,
          this_users_post: true
        }
        res.render("partners/updateid", view_data);
      } else {
        //if this is not your post
        res.redirect("/partners/"+id)
      }
    })
  } else {
    //you are not logged in
    res.redirect("/login")
  }
});

// updates the post
app.put("/post/:id", function(req,res){
  let data = req.body
  db
  .none("UPDATE posts SET title = $1, content = $2, category = $3, level = $4, borough = $5 WHERE id = $6", [data.title, data.content, data.updatecategory, data.level, data.borough, req.params.id])
  .then(function(){
    res.redirect("/partners/"+req.params.id)
  })
  .catch(function(){
    //need to put in a catch
    res.send("fail")
  })
})

//lets you create a new comment on one post
//when you do, it should not refresh the page, but should append to the page
// app.post('posts/:id/comment', function(req, res){
//   // console.log(req.session.user)
//   let current_user = req.session.user
//   let data = req.body
//   let post_id = req.params.id;
//   // console.log(data)
//   // console.log(req.params)
//   console.log('Route HIT!!!!!!!!! YEAH ')
//   db
//     .none("INSERT INTO comments (user_id, post_id, content, level, borough, username) VALUES ($1, $2, $3, $4, $5, $6)", [current_user.id, post_id, data.content, data.level, data.borough, current_user.username])
//     .then(function(newCommentData){
//       res.redirect("/partners/" + data.post_id)
//       // res.send(newCommentData)
//     })
//     .catch(function(){
//       //should add a view
//       res.send("Oops! Something bad happened")
//     })
// });



//lets you create a new comment on one post
//when you do, below will refresh the page and show the new comment
app.post('/comment', function(req, res){
  // console.log(req.session.user)
  let current_user = req.session.user
  let data = req.body
  // console.log(data)
  // console.log(req.params)
  db
    .one("INSERT INTO comments (user_id, post_id, content, level, borough, username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id as new_id", [current_user.id, data.post_id, data.content, data.level, data.borough, current_user.username])
    .then(function(el){
      res.redirect("/partners/" + data.post_id)
    })
    .catch(function(){
      //should add a view
      res.send("Oops! Something bad happened")
    })
});





//lets the user delete their own comments
app.delete("/partners/comment/:id", function(req, res){
  id = req.params.id
  user = Number(req.body.comments_user_id)
  post = req.body.post_id
  if(user===req.session.user.id) {
    db
      .none("DELETE FROM comments WHERE id = $1", [id])
      .then(function(data){
        res.redirect("/partners/" + post)
      })
  }
})

//renders the courts page
//should be able to view even if you are not logged in
app.get("/courts", function(req, res){
  let view_data = {}
  db
    .any("SELECT * FROM courts")
    .then(function(data){
      view_data.courts = data
      if(req.session.user){
        view_data.logged_in = true
      }
      res.render("courts/index", view_data)
    })
});

//renders the online court page
app.get("/courts/onlinebooking", function(req,res){
  let view_data = {}
  db
    .any("SELECT * FROM onlineCourts")
    .then(function(data){
      view_data.onlineCourts = data
      if(req.session.user){
        view_data.logged_in = true
      }
      res.render("courts/online", view_data)
    })
})

//renders 5 borough pages
app.get("/courts/:id", function(req, res){
  let id = req.params.id;
  let view_data = {};
  let borough = id[0] //only works for manhattan, queens and brooklyn
  if(id === "StatenIsland"){
    borough = "R"
  } else if(id==="Bronx"){
    borough = "X"
  } else if(id==="Manhattan" || id==="Brooklyn" || id==="Queens"){
    borough = id[0]
  } else{
    res.redirect("/courts")
  }
  db
    .any("SELECT * FROM courts WHERE borough = $1", [borough])
    .then(function(courts){
      view_data.location = id;
      view_data.courts = courts;
      if(req.session.user){
        view_data.logged_in = true
      }
      res.render("courts/show", view_data)
    })
})

//renders the permits page
//should be able to view even if you are not logged in
app.get("/permits", function(req, res){
  let view_data = {};
  db
    .any("SELECT * FROM tennisPermits")
    .then(function(data){
      view_data.permits = data
      if(req.session.user){
        view_data.logged_in = true
      }
      res.render("permits/index", view_data)
    })
});

//renders the user's account page
app.get("/account", function(req, res){
  if(req.session.user){
      db
    .one("SELECT * FROM users WHERE email = $1", req.session.user.email)
    .then(function(data){
      db
        .any("SELECT * FROM posts WHERE user_id = $1", [data.id])
        .then(function(posts){
          let view_data = {
            posts: posts,
            user: data
          }
          res.render("account/index", view_data)
        })
    })
  } else{
    //user is not logged in
    res.redirect("/login")
  }

});

//renders the category pages
app.get("/partners/all/:id", function(req, res){
  let id = req.params.id
  if(req.session.user){
    db
    .any("SELECT * FROM posts WHERE category = $1", id)
    .then(function(data){
      let view_data = {
        posts: data,
        logged_in: true,
        email: req.session.user.email,
        category: id
      }
      res.render("partners/all", view_data)
    })
  } else {
    //you are not logged in
    res.redirect("/login")
  }
});

//renders the update account page
app.get("/account/update/:id", function(req, res){
  let id = req.params.id
  if(req.session.user){
    db
    .one("SELECT * FROM users WHERE id = $1", id)
    .then(function(data){
      console.log(data)
      //if the user in this session is the account holder
      if(data.id===req.session.user.id){
        let view_data = {
          user: data,
          logged_in: true,
          email: req.session.user.email,
        }
        res.render("account/view", view_data);
      } else {
        //if this is not your account
        res.redirect("/account")
      }
    })
  } else {
    //you are not logged in
    res.redirect("/login")
  }
});

// updates the account
app.put("/post/account/:id", function(req,res){
  let data = req.body
  db
  .none("UPDATE users SET first_name = $1, last_name = $2, email = $3, username = $4, borough = $5, level = $6 WHERE id = $7", [data.first_name, data.last_name, data.email, data.username, data.borough, data.level, req.params.id])
  .then(function(){
    res.redirect("/account")
  })
  .catch(function(){
    //need to put in a catch
    res.send("fail")
  })
})

//lets you logout
app.get('/logout', function(req, res){
  req.session.user = false
  res.redirect("/")
});




