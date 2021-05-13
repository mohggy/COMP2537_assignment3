const express =  require('express');
const session = require('express-session');
const app = express();
const fs = require("fs");
const { JSDOM } = require('jsdom');

app.use('/css', express.static('assets/css'));
app.use('/html', express.static('assets/html'));
app.use('/imgs', express.static('assets/imgs'));
app.use('/script', express.static('assets/script'));

app.use(session(
    {
        secret:'you shall not pass',
        name:'abc1234',
        resave: false,
        saveUninitialized: true })); app.get('/', function (req, res) {
      let doc = fs.readFileSync('./assets/html/index.html', "utf8");
  
      let dom = new JSDOM(doc);
      let $ = require("jquery")(dom.window);
  
      $("#footer").append("<p id='copyright'>Copyright ©2021, (Taqwa Oumed A01046211, Maggie Dou A01067756, Shizuka (Izzy) Sato A01166545, ChunNok Ho A01260929), Inc.</p>");
      createDB();
      res.set('Server', 'InSync Engine');
      res.set('X-Powered-By', 'InSync');
      res.send(dom.serialize());
});
  
async function createDB() {

    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS test;
        use test;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        email varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));`;

    await connection.query(createDBAndTables);
    let results = await connection.query("SELECT COUNT(*) FROM user");
    let count = results[0][0]['COUNT(*)'];

    if(count < 1) {
        results = await connection.query("INSERT INTO user (email, password) values ('arron_ferguson@bcit.ca', 'admin')");
        console.log("Added one user record.");
    }
    connection.end();
}

app.get('/landing', function(req, res) {
    if(req.session.loggedIn) {
        let templateFile = fs.readFileSync('./assets/templates/landing.html', "utf8");
        let templateDOM = new JSDOM(templateFile);
        let $template = require("jquery")(templateDOM.window);

        $template("#welcomeSection").html(`Welcome ${req.session.email} !`);

        let left = fs.readFileSync('./assets/templates/intro.html', "utf8");
        let leftDOM = new JSDOM(left);
        let $left = require("jquery")(leftDOM.window);
        $template("#introSection").replaceWith($left("#intro"));

        let middle = fs.readFileSync('./assets/templates/aboutUs.html', "utf8");
        let middleDOM = new JSDOM(middle);
        let $middle = require("jquery")(middleDOM.window);
        $template("#aboutUsSection").replaceWith($middle("#about"));

        res.set('Server', 'InSync Engine');
        res.set('X-Powered-By', 'InSync');
        res.send(templateDOM.serialize());

    } else {
        res.redirect('/');
    }


});

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.post('/authenticate', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    
    let results = authenticate(req.body.email, req.body.password,
        function(rows) {
            if(rows == null) {
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                req.session.loggedIn = true;
                req.session.email = rows.email;
                req.session.save(function(err) {
                    // session saved
                })
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});


function authenticate(email, pwd, callback) {

    const mysql = require('mysql2');
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test'
    });

    connection.query(
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function (error, results) {
        if (error) {
            throw error;
        }

        if(results.length > 0) {
            return callback(results[0]);
        } else {
            return callback(null);
        }

    });

}

app.get('/logout', function(req,res){
    req.session.destroy(function(error){
        if(error) {
            console.log(error);
        }
    });
    res.redirect("/landing");
})

let port = 8000;
app.listen(port, function () {
    console.log('Listening on port ' + port + '!');
})
