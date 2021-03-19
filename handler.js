'use strict';
const express = require("serverless-express/express")
const handler = require("serverless-express/handler")

const AWS = require('aws-sdk')
const path = require('path')
var sqs = new AWS.SQS()

var bodyParser = require('body-parser')
var app = express()

var jsonParser = bodyParser.json()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.get('/artists', function (req, res){

  var ddb = new AWS.DynamoDB({region: 'us-east-1'});

    var params = {
      TableName: 'music',
      AttributesToGet:['Artists']
    }

    ddb.scan(params, function(err, data){
      if(err){console.log(err)}
      else{
        var artists = {Artists: []}
        data.Items.forEach(function(element){
          var g = AWS.DynamoDB.Converter.unmarshall(element).Artists
          if(!artists.Artists.includes(g)){
            artists.Artists.push(g);
          }
        })
        res.send(artists)
      }
    })
})


app.get('/genres', function (req, res){

  var ddb = new AWS.DynamoDB({region: 'us-east-1'});

    var params = {
      TableName: 'music',
      AttributesToGet:['Genres']
    }

    ddb.scan(params, function(err, data){
      if(err){console.log(err)}
      else{
        var genres = {Genres: []}
        data.Items.forEach(function(element){
          var g = AWS.DynamoDB.Converter.unmarshall(element).Genres
          if(!genres.Genres.includes(g)){
            genres.Genres.push(g);
          }
        })
        res.send(genres)
      }
    })
})

app.get('/artists/for/genre', function(req,res){

  var genre = req.query.genre;

  var ddb = new AWS.DynamoDB({region: 'us-east-1'});

  var params = {
    TableName: 'music',
    KeyConditions: {
      'Genres':{
        'ComparisonOperator': 'EQ',
        'AttributeValueList': [{'S' :genre}]
      }
    },
  }

  ddb.query(params, function(err, data){
    if(err){console.log(err)}
    else{
      var artists = {Artists: []}
      data.Items.forEach(function(element){
        var g = AWS.DynamoDB.Converter.unmarshall(element).Artists
        if(!artists.Artists.includes(g)){
          artists.Artists.push(g);
        }
      })
      res.send(artists)
    }
  })
});

app.get('/albums/for/artist', function(req,res){

  var artist = req.query.artist;

  var ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

  var params = {
    TableName: 'music',
    FilterExpression: 'Artists = :a',
    ExpressionAttributeValues:{
      ':a':artist
    },
    ProjectionExpression: 'Albums'
  }

  ddb.scan(params, function(err, data){
    if(err){console.log(err)}
    else{
        var albums = {Albums: []}
        data.Items[0].Albums.forEach(function(element){
          albums.Albums.push(element);
        });
        res.send(albums)
      }
  });
});

app.get('/songs/for/album', function(req,res){

  var album = req.query.album;

  var ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

  var params = {
    TableName: 'songs',
    FilterExpression: 'Albums = :a',
    ExpressionAttributeValues:{
    ':a':album
    },
    ProjectionExpressions: "Songs"
  }

  ddb.scan(params, function(err, data){
    if(err){console.log(err)}
    else{
        var songs = {Songs: []}
        data.Items.forEach(function(element){
          songs.Songs.push(element.Songs)
        });
        res.send(songs)
      }
  });
});

app.get('/song', function(req, res){

  var song = req.query.song;

  var ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

  var params = {
    TableName: 'songs',
    FilterExpression: 'Songs = :a',
    ExpressionAttributeValues:{
    ':a':song
    },
    ProjectionExpressions: "SongURL"
  }
  
  ddb.scan(params, function(err, data){
    if(err){console.log(err)}
    else{
        var songURL = {SongURL: []}
        data.Items.forEach(function(element){
          songURL.SongURL.push(element.SongURL)
        });
        res.send(songURL)
      }
  });
});

app.post('/play', jsonParser, function(req,res){

  var song = req.body.Song;
  var album = req.body.Album;
  var artist = req.body.Artist;

  console.log("song", song)
  console.log("album", album)
  console.log("artist", artist)

  var body = "Played song: " + song + ", from artist: " + artist + ", from album: " + album + ".";

  var params = {
    DelaySeconds: 10,
    MessageAttributes: {
      "Song": {
        DataType: "String",
        StringValue: song
      },
      "Album": {
        DataType: "String",
        StringValue: album
      },
      "Artist": {
        DataType: "String",
        StringValue: artist
      }
    },
    MessageBody: body,
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/751454240071/music"
  };

  sqs.sendMessage(params, function(err,data){
    if(err){console.log(err)}
    else{
      console.log("Success", data.MessageId)
    }
  })
  res.send({Artist: artist})
});

module.exports.api = handler(app);

module.exports.log = async (event, context) => {

    console.log(event.Records[0].body)
}
