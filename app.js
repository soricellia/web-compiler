var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var router = require('./router');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(router);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handler middleware

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err.stack);
        res.status(err.status || 500);
        res.render('pages/error', {
            message: err.message,
            status: err.status,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.status(err.status || 500);
    res.render('pages/error', {
        message: err.message,
        status: err.status,
        error: err.message
    });
});


app.use(function(err, req, res, next){
  console.log("I CAUGHT ITTTTT");
    console.error(err.stack);
    next(err);
})

app.on('uncaughtException', function(err) {
  console.log("uncaughtException\n" + util.inspect(err));
});
app.on('error', function(err){
  console.log("uncaughtException\n" + util.inspect(err));   
});

module.exports = app;
