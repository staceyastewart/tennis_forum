//Bryan and Taj helped with this extensively
//run node db/seeds.js  in terminal

var fetch = require('node-fetch');
const pgp = require('pg-promise')();
var db = pgp('postgres://staceyastewart@localhost:5432/tennis');
let url = "http://www.nycgovparks.org/bigapps/DPR_Parks_001.json";
let urlOnlineCourts = "https://data.cityofnewyork.us/resource/dr4a-dx5a.json"
let urlFee="https://data.cityofnewyork.us/resource/jumu-9v4u.json"


fetch(url)
  .then(function(r){
    // console.log(r)
    return r.json();
  })
  .then(function(json){
    for (var i = 0; i < json.length; i++) {
      // console.log(json[i].Name);
      // console.log(json[i].Location);
      // console.log(json[i].Zip);
      db
        .any("INSERT INTO courts (borough, court_name, court_address, court_zip_code) VALUES ($1,$2,$3, $4)", [json[i].Prop_ID[0], json[i].Name, json[i].Location, json[i].Zip])
        .catch(function(err){
          console.log(err)
        })
    }
  })


fetch(urlOnlineCourts)
  .then(function(s){
    return s.json();
  })
  .then(function(json){
    for (var i = 0; i < json.length; i++) {
      db
        .any("INSERT INTO onlineCourts (first_reservation, last_reservation, location, reservation_courts, walk_on_courts) VALUES ($1,$2,$3, $4, $5)", [json[i].first_reservation, json[i].last_reservation, json[i].location, json[i].reservation_courts, json[i].walk_on_courts])
        .catch(function(err){
          console.log(err)
        })
    }
  })


fetch(urlFee)
  .then(function(t){
    return t.json();
  })
  .then(function(json){
    for (var i = 0; i < json.length; i++) {
      db
        .any("INSERT INTO tennisPermits (age_group, fee) VALUES ($1,$2)", [json[i].age, json[i].fee])
        .catch(function(err){
          console.log(err)
        })
    }
  })
