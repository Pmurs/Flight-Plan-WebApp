
'use strict';

var express         = require('express'),
    session         = require('express-session'),
    bodyParser      = require('body-parser'),
    logger          = require('morgan'),
    _               = require('underscore'),
    mongoose        = require('mongoose'),
    redis           = require('redis'),
    geolib          = require('geolib'),
    airportloader   = require('./airports/airportloader.js');


mongoose.connect('mongodb://localhost:27017/murraypg');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Airport = airportloader.Airport;
Airport.find(function(err, docs) {
    if (err) {
        console.log(err);
    }
    if (docs[0] == null) {
        airportloader.load();
    }
});


var redisClient = redis.createClient(6379, 'localhost');
redisClient.on('ready', function() {
    console.log('Redis Connected.');
}).on('error', function() {
    console.log('Not able to connect to Redis.');
    process.exit(-1);
});



var lowerCase = function(str) {
    return str.toLowerCase();
}

var generatePlanID = function(str) {
    str = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    return str;
}

var app = express();
app.use(session({
    secret: "...?",
    resave: false,
    saveUninitialized: true,
    cookie: {path: '/cookie', httpOnly: true, maxAge: 2592000000}
}))

app.use(express.static('public'));
app.use(logger('combined'));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'jade');
app.set('views', './views');

app.get('/profile.html', function(req, res) {
    res.render('profile');
})


var userSchema = Schema({
    username: {type: String, required: true, unique: true, set: lowerCase},
    first_name: {type: String, required: true, default: ''},
    last_name: {type: String, required: true, default: ''},
    password: {type: String, required: true},
    dob: {type: String, default: ''},
    address_street: {type: String, default: ''},
    address_city: {type: String, default: ''},
    address_state: {type: String, default: ''},
    address_zip: {type: String, default: ''},
    primary_phone: {type: Number, default: null},
    primary_email: {type: String, required: true, unique: true},
    date_created: {type: Date, required:true, default: Date.now()},
    date_updated: {type: Date, default: Date.now()},
    active_status: {type: Boolean, default: true}
});

var planSchema = Schema({
    id: {type: String, unique: true, default: generatePlanID},
    type: {type: String, required: true},
    ident: {type: String, required: true},
    special_equip: {type: String, required: true},
    true_airspeed: {type: Number, required: true},
    departure: {type: String, required: true},
    dept_time_proposed: {type: String, required: true},
    dept_time_actual: {type: String, required: true},
    cruise_alt: {type: String, required: true},
    route: {type: String, required: true},
    dst: {type: String, required: true},
    ete: {type: Number, required: true},
    remarks: {type: String, required: true},
    fuel: {type: Number, required: true},
    alt_airports: {type: String, required: true},
    name: {type: String, required: true},
    num_aboard: {type: Number, required: true},
    color: {type: String, required: true},
    dst_contact: {type: String, required: true},
    date_created: {type: Date, required:true, default: Date.now()},
    date_updated: {type: Date, default: Date.now()},
    completed: {type: Boolean, default: false},
    associated_account: {type: ObjectId, ref: 'User'}
});

var User = mongoose.model('User', userSchema);
var Plan = mongoose.model('Plan', planSchema);




// Handle GET to fetch map tiles
app.get('/v1/map_images', function(req, res) {
    res.sendFile(req.query.y + '.png', {root: './map_images/' + req.query.z + '/' + req.query.x}, function(err) {
        if (err) {
            console.log(err);
            res.status(404).send('Map image not found');
        }
        else{
            res.status(200);
        }
    });
});


// Handle GET to get nearest airport
app.get('/v1/airport', function(req, res) {
    Airport.find({pos: {$near: {$geometry: {type: "Point", coordinates: [req.query.lng, req.query.lat]}, $maxdistance: req.query.maxDist}}}).sort().exec( function(err, docs) {
        if (err) {
           console.log(err);
        }
        else if (!docs) {
            res.status(404).send('No airports within ' + req.query.maxDist + ' meters of click');
        }
        else {
            res.status(200).send('Found airport nearby');
        }
    });
});


// Handle POST to create a new user account
app.post('/v1/user', function(req, res) {
    var data = req.body;
    data.username = data.username.toLowerCase();
    if (!data || !data.username || !data.password || !data.first_name || !data.last_name || !data.primary_email) {
        console.log('Missing required fields.')
        res.status(400).send({ error: 'username, password, first_name, last_name and primary_email required.' });
    }
    else {
        var newUser = new User(data);
        newUser.save(function (err) {
            if (err) {
                console.log(err);
                res.status(400).send({error: 'error creating user account'});
            }
            else {
                redisClient.set('USER:' + req.params.username, JSON.stringify(data));
                console.log('New User: ' + data.username);
                res.status(201).send({username: data.username});
            }
        });
    }
});

// Handle POST to edit a user account
app.post('/v1/editProfile:username', function(req, res) {
    var data = req.body.formData;
    console.log(req.body.username);
    User.findOne({username: req.body.username}, function (err, docs) {
        if (err || !docs) {
            res.status(404).send({error: 'no user found: ' + req.body.username});
        }
        else {
            console.log('Updated User: ' + req.body.username);
            data.username = data.username.toLowerCase();
            User.update({username: docs.username}, data, function(err) {
                if (err) {
                   console.log(err);
                }
                if (req.body.username !== data.username) {
                    redisClient.del('USER:' + req.body.username);
                    console.log('Set new username: ' + data.username);
                }
                redisClient.set('USER:' + data.username, JSON.stringify(docs));
            });
            res.status(201).send({username: data.username});
        }
    })
});


// Handle POST to create a user session
app.post('/v1/session', function(req, res) {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(400).send({ error: 'username and password required' });
    }
    else {
        redisClient.get('USER:' + req.body.username, function(err, data) {
            if (err) {
                res.status(404).send({error: 'redis error'});
            }
            else if (!data) {
                console.log('Using Mongo');
                User.findOne({username: req.body.username.toLowerCase()}, function (err, docs) {
                    if (err || docs.length === 0) {
                        res.status(404).send({error: 'no user found: ' + req.body.username});
                    }
                    else if (req.body.password != docs.password){
                        res.status(401).send({error: 'unauthorized'});
                    }
                    else {
                        redisClient.set('USER:' + docs.username, JSON.stringify(docs));
                        res.status(201).send({
                            username:       docs.username,
                            primary_email:  docs.password
                        });
                    }
                });
            }
            else {
                console.log('Using Redis');
                data = JSON.parse(data);
                if (req.body.password !== data.password) {
                    res.status(401).send({error: 'unauthorized'});
                }
                else {
                    res.status(201).send({
                        username: data.username,
                        primary_email: data.password
                    });
                }
            }
        });
    }
});

// Handle GET to fetch user information
app.get('/v1/user/:username', function(req, res) {
    redisClient.get('USER:' + req.params.username, function(err, data) {
        if (err) {
            res.status(404).send({ error: 'redis error' });
        }
        else if (!data) {
            console.log('Using Mongo');
            User.findOne({username: req.params.username.toLowerCase()}, function (err, user) {
                if (err || !user) {
                    res.status(404).send({error: 'unknown user'});
                }
                else {
                    redisClient.set('USER:' + req.params.username, JSON.stringify(user));
                    res.status(200).send(user);
                }
            });
        }
        else {
            console.log('Using Redis');
            res.status(200).send(JSON.parse(data));
        }
    });
});


// Handle POST to deactivate user account
app.post('/v1/user/:username', function(req, res) {
    User.findOne({ username: req.params.username}, function(err, docs){
        if (err || !docs) {
            res.status(404).send({ error: 'unknown user' });
        }
        else {
            docs.active_status = false;
            docs.save(function (err) {
                if (err) {res.status(404).send({error: "unknown user"})}
                else {redisClient.set('USER:' + req.params.username, JSON.stringify(docs));}
            });
            res.status(201).send(docs);
        }
    })
});


// Flight plan fields:
//  1. TYPE as type
//  2. AIRCRAFT IDENTIFICATION as ident
//  3. AIRCRAFT TYPE / SPECIAL EQUIPMENT as special_equip
//  4. TRUE AIRSPEED as true_airspeed
//  5. DEPARTURE POINT as departure
//  6a. DEPARTURE TIME PROPOSED as dept_time_proposed
//  6b. DEPARTURE TIME ACTUAL as dept_time_actual
//  7. CRUISING ALTITUDE as cruise_alt
//  8. ROUTE OF FLIGHT as route
//  9. DESTINATION (Name of airport and city) as dst
//  10. EST. TIME ENROUTE as ete
//  11. REMARKS as remarks
//  12. FUEL ON BOARD as fuel
//  13. ALTERNATE AIRPORT(S) as alt_airports
//  14. PILOT'S NAME, ADDRESS & TELEPHONE NUMBER & AIRCRAFT HOME BASE as name
//  15. NUMBER ABOARD as num_aboard
//  16. COLOR OF AIRCRAFT as color
//  17. DESTINATION CONTACT/TELEPHONE (OPTIONAL) as dst_contact

// Handle POST to create a new flight plan
app.post('/v1/plan', function(req, res) {
    var data = req.body.formData;
    console.log(req.body.username);
    if (!req.body.username) {
        res.status(400).send({ error: 'must be logged in to create flight plan'});
    }
    if (!data ||
        !data.type ||
        !data.ident ||
        !data.special_equip ||
        !data.true_airspeed ||
        !data.departure ||
        !data.dept_time_proposed ||
        !data.dept_time_actual ||
        !data.cruise_alt ||
        !data.route ||
        !data.dst ||
        !data.ete ||
        !data.remarks ||
        !data.fuel ||
        !data.alt_airports ||
        !data.name ||
        !data.num_aboard ||
        !data.color ||
        !data.dst_contact) {
        res.status(400).send({ error: 'all form fields required' });
    }
    else {
        var newPlan = new Plan(data);
        User.findOne({username: req.body.username}, function(err, docs){
           if (err){
               console.log(err);
               res.status(404).send({error: 'username: ' + req.body.username + ' not found'});
           }
            newPlan.associated_account = docs._id;
            newPlan.save(function (err) {
                if (err) {
                    console.log(err);
                    res.status(400).send({error: 'error creating flight plan'});
                }
                else {
                    redisClient.set('PLAN:' + newPlan.id, JSON.stringify(data));
                    console.log('New Plan: ' + newPlan.id);
                    res.status(201).send({planid: newPlan.id});
                }
            })
        });
    }
});

// Handle POST to update a flight plan
app.post('/v1/editPlan:id', function(req, res) {
    var data = req.body.formData;
    if (!req.body.username) {
        res.status(400).send({ error: 'must be logged in to update flight plan'});
    }
    if (!data ||
        !data.type ||
        !data.ident ||
        !data.special_equip ||
        !data.true_airspeed ||
        !data.departure ||
        !data.dept_time_proposed ||
        !data.dept_time_actual ||
        !data.cruise_alt ||
        !data.route ||
        !data.dst ||
        !data.ete ||
        !data.remarks ||
        !data.fuel ||
        !data.alt_airports ||
        !data.name ||
        !data.num_aboard ||
        !data.color ||
        !data.dst_contact) {
        res.status(400).send({ error: 'all form fields required' });
    }
    else {
        User.findOne({username: req.body.username}, function(err, docs) {
            if (err) {
                console.log(err);
                res.status(404).send({error: 'no plans with username: ' + req.body.username + ' found'});
            }
            var user_id = docs._id;
            Plan.findOneAndUpdate({id: req.body.id, associated_account: user_id}, data, function (err, docs) {
                console.log(docs);
                if (err || !docs) {
                    res.status(404).send({error: 'plan not found for this user: ' + req.body.data.id});
                }
                else {
                    redisClient.set('PLAN:' + docs.id, JSON.stringify(data));
                    console.log('Updated Plan: ' + docs.id);
                    res.status(201).send({planid: docs.id});
                }
            });
        });
    }
});


// Handle POST to complete or delete a flight plan
app.post('/v1/review_plan:id', function(req, res) {
    User.findOne({username: req.body.username}, function(err, docs) {
        if (err) {
            console.log(err);
            res.status(404).send({error: 'no plans with username: ' + req.body.username + ' found'});
        }
        var user_id = docs._id;
        Plan.findOne({ associated_account: user_id, id: req.body.id}, function(err, docs){
            if (err || !docs) {
                res.status(404).send({ error: 'could not find plan with that user' });
            }
            else {
                console.log(req.body.complete_delete);
                // delete
                if (req.body.complete_delete == 1) {
                    console.log('delete');
                    Plan.remove({associated_account: docs.associated_account, id: docs.id}, function(err) {
                        if (err) {
                            console.log(err);
                        }
                        redisClient.del('PLAN:' + docs.id);
                    });
                }
                // complete
                else {
                    console.log('complete');
                    docs.completed = true;
                    docs.save(function (err) {
                        if (err) {res.status(404).send({error: "unknown plan"})}
                        else {redisClient.set('PLAN:' + docs.id, JSON.stringify(docs));}
                    });
                }
                res.status(201).send({planid: docs.id});
            }
        });
    });
});


// Handle GET to fetch flight plan information to populate the page
app.get('/v1/plan/:id', function(req, res) {
    redisClient.get('PLAN:' + req.params.id, function(err, data) {
        if (err) {
            res.status(404).send({error: 'redis error'});
        }
        else if (!data) {
            console.log('Using Mongo');
            Plan.findOne({id: req.params.id}, function (err, docs) {
                if (err || !docs) {
                    res.status(404).send({error: 'unknown flight plan'});
                }
                else {
                    redisClient.set('PLAN:' + docs.id, JSON.stringify(docs));
                    res.status(200).send(docs);
                }
            });
        }
        else {
            console.log('Using Redis');
            res.status(200).send(JSON.parse(data));
        }
    });
});


var server = app.listen(8080, function () {
    console.log('Example app listening on ' + server.address().port);
});