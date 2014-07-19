var http = require('http');
var https = require('https');
var config;

module.exports.commands = ["turntable", "tt", "playlist"];

module.exports.init = function(bot) {
  bot.getConfig( "turntable.json", function( err, conf ) {
    if( err ) {
      console.log( err );
    } else {
      config = conf;
    }
  });
};

module.exports.run = function(remainder, parts, reply, command, from, to, text, raw){
      switch(command)
      {
        case "tt":
          return turntable(remainder, from, reply);
        case "turntable":
          return turntable(remainder, from, reply);
        case "playlist":
          return getPlaylist(remainder, reply, '');
        default:
          return reply("Error, command <" + command + "> not implemented!");
      }

};

function turntable(remainder, from, reply) {
  var command, args;
  args = remainder.split(" ");
  reply("command: " + args[0]);
  switch(args[0])
  {
    case "add":
      return addSong(args[1], from, reply);
    case "skip":
      return skipSong(from,reply);
    case "queue": 
      return queueSong(args[1], from, reply);
    default:
      return reply("Error, command <" + args[0] + "> not implemented!");
  }
}

function addSong(song_id, from, reply) {
  var post_data = querystring.stringify({
    'hash' : song_id,
    'room' : '#interns'
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  });
  var post_req = http.request(post_options, function(res) { 
    var ttdata = '';
    res.on('data', function(chunk) {
      ttdata += chunk;
    });
    var turntableData;
    res.on('end', function() {
      try {
        turntableData = JSON.parse(ttdata.toString());
      } catch(e) {
        return reply("Error handling turntable response");
      }
      if (turntableData.success) 
      {
        reply("Added song " + turntableData.title + " to the library!");
      }
      else if (turntableData.uploaded)
      {
        reply("The song " + turntableData.title + " was already uploaded!");
      }

      else
      {
        reply("There was an error uploading your song! yt_hash: " + song_id);
      }

    });
  });
  post_req.write(post_data);
  post_req.end();
}

function skipSong(from, reply) {
  var post_data = querystring.stringify({
    'username' : from,
    'room' : '#interns'
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/room/#interns/skip',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  });
  var post_req = http.request(post_options, function(res) { 
    var ttdata = '';
    res.on('data', function(chunk) {
      ttdata += chunk;
    });
    var turntableData;
    res.on('end', function() {
      try {
        turntableData = JSON.parse(ttdata.toString());
      } catch(e) {
        return reply("Error handling turntable response");
      }
      reply(from + " and " + turntableData.votes + " others want to skip this song!");

    });
  });
  post_req.write(post_data);
  post_req.end();

}

function queueSong(song_id, from, reply) {
  var post_data = querystring.stringify({
    'hash' : song_id,
    'room' : '#interns'
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/users/' + from + '/queue',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  });
  var post_req = http.request(post_options, function(res) { 
    var ttdata = '';
    res.on('data', function(chunk) {
      ttdata += chunk;
    });
    var turntableData;
    res.on('end', function() {
      try {
        turntableData = JSON.parse(ttdata.toString());
      } catch(e) {
        return reply("Error handling turntable response");
      }
      
      reply("Added " + turntableData.title + " to the #interns queue, you are song number " + turntableData.queuePos);

    });
  });
  post_req.write(post_data);
  post_req.end();

}

function getPlaylist(remainder, reply, pageToken) {
  var playlist_id = remainder;
  https.get('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&'
      + pageToken + 'playlistId=' + playlist_id + '&key=' + config.youtube_key, function(res) {
    var pdata = '';
    res.on('data', function(chunk) {
      pdata += chunk;
    });
    var playlistData;
    res.on('end', function() {
      try {
        playlistData = JSON.parse(pdata.toString());
      } catch(e) {
        return reply("Error handling youtube");
      }
      var songs = playlistData.items;
      var title, yt_hash, author
      for(i = 0; i < songs.length; ++i)
      {
        title = songs[i].snippet.title;
        yt_hash = songs[i].snippet.resourceId.videoId;
        author = songs[i].snippet.channelTitle;
        reply(title);
        //reply(title + " : " + author + " : " + yt_hash);
      }
      var pageToken, pageTokenString;
      pageToken = playlistData.nextPageToken;
      if (typeof(pageToken) !== "undefined" )
      {
        pageTokenString = "pageToken=" + pageToken + "&";
        getPlaylist(remainder, reply, pageTokenString)
      } 
    });
 });
}

