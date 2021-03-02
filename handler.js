'use strict';
const express = require("serverless-express/express")
const handler = require("serverless-express/handler")

const AWS = require('aws-sdk')
const path = require('path')

var app = express()

app.get('/artists', function(req, res){

  const bucketParams = {
      Bucket: 'cs493bucket',
      Delimiter: '/',
      Prefix: 'Artists/',
  };

  var artists = []

  var s3 = new AWS.S3();
  s3.listObjectsV2(bucketParams, function(err, data){
       
    if(err){res.send(err);return}
    for(var i = 0; i < data.CommonPrefixes.length; i++){

      var name = data.CommonPrefixes[i].Prefix
      name = name.substring(
      name.indexOf("/") +1,
      name.lastIndexOf("/"),
      )
      artists.push(name)
    }
    res.send(JSON.stringify(artists))
  });
});

app.get('/albums', function(req, res){

  const bucketParams = {
      Bucket: 'cs493bucket',
      Prefix: 'Artists/' + req.query.artist + "/",
  };

  var albums = []

  var s3 = new AWS.S3();
  s3.listObjectsV2(bucketParams, function(err, data){
       
    if(err){res.send(err);return}
    for(var i = 0; i < data.CommonPrefixes.length; i++){

      var name = data.CommonPrefixes[i].Prefix
      name = name.substring(
      name.indexOf("/") +1,
      name.lastIndexOf("/"),
      )
      albums.push(name)
    }
    res.send(JSON.stringify(data))
  });
}); 
module.exports.api = handler(app);
