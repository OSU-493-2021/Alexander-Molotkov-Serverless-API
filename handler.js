'use strict';
const express = require("serverless-express/express")
const handler = require("serverless-express/handler")

const AWS = require('aws-sdk')
const path = require('path')

var app = express()

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
      res.send(data.Items[0])
    }
  });
});

app.get('/songs/for/album', function(req,res){

});

module.exports.api = handler(app);
