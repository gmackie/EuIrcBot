var http = require('http');
var https = require('https');
var querystring = require('querystring');
var youtube = require("youtube-api");
var sleep = require('sleep');

var config;

module.exports.commands = ["turntable", "tt", "playlist"];

module.exports.init = function(bot) {
  bot.getConfig( "turntable.json", function( err, conf ) {
    if( err ) {
      console.log( err );
    } else {
      console.log(conf);
      config = conf;
      youtube.authenticate({
        type: "key",
        key: config.youtube_key
      });
    }
  });
  console.log("started turntable module");
};

module.exports.run = function(remainder, parts, reply, command, from, to, text, raw){
      switch(command)
      {
        case "tt":
          return turntable(remainder, from, to, reply);
        case "turntable":
          return turntable(remainder, from, to, reply);
        default:
          return reply("Error, command <" + command + "> not implemented!");
      }

};

function turntable(remainder, from, to, reply) {
  var command, args;
  args = remainder.split(" ");
  switch(args[0])
  {
    case "join":
      return joinRoom(from, reply, to);
    case "leave":
      return leaveRoom(from, reply, to);
    case "add":
      return addCommand(args, from, reply, to);
    case "skip":
      return skipSong(from,reply);
    case "queue": 
      return queueSong(args, from, reply);
    case "show":
      return showCommand(args, from, reply, to);
    default:
      return reply("Error, command <" + args[0] + "> not implemented!");
  }
}

function addCommand(args, from, reply, to) {
  if(args[2] == "playlist")
    return addPlaylist(args, from, reply, to, '');
  else
    return addSong(args, from, reply);
}

function showCommand(args, from, reply, to) {
  switch(args[1])
  {
    case "queue":
      return showQueue(args, from, reply, to);
    case "room":
      return showRoom(args, from, reply, to);
    default:
      return reply("Error, command !tt show <" + args[1] + "> not implemented!");
  }
}

function showQueue(args, from, reply, to) {
  if(args[2])
    return showUserQueue(args[2], reply);
  else
    return showUserQueue(from, reply);
}

function showUserQueue(from, reply) {
  http.get('http://turntable.dongs.in/api/users/' + from + '/queue',
    function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    var queueData;
    res.on('end', function() {
      try {
        queueData = JSON.parse(data.toString());
      } catch(e) {
        return reply("Error handling turntable response");
      }
      reply("Queue for " + from);
      for(var i = 0; i < queueData.length; i++)
      {
        var song = queueData[i];
        reply(i + ". " + song.title);
      }
      
    });
  });
}

function showRoom(args, from, reply, to) {
  http.get('http://turntable.dongs.in/api/rooms/' + 'interns' + '/djlist',
    function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    var roomData;
    res.on('end', function() {
      try {
        roomData = JSON.parse(data.toString());
      } catch(e) {
        return reply("Error handling turntable response");
      }
      reply("DJ Queue List for #" + 'interns');
      for(var i = 0; i < roomData.users.length; i++)
      {
        var user = roomData.users[i];
        reply(i + ". " + user.username + " : " + user.next_song);
      }
    });
  });
}

function leaveRoom(from, reply, to) {
  var post_data = querystring.stringify({
    'username' : from
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/rooms/' + 'interns' + '/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
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
      if (turntableData.error) 
      {
        return reply("Error: " + turntableData.error);
      }
      return reply("Added user " + turntableData.user + " to the room: interns!");
    });
  });
  post_req.write(post_data);
  post_req.end();
}

function joinRoom(from, reply, to) {
  var post_data = querystring.stringify({
    'username' : from
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/rooms/' + 'interns' + '/join',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
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
      if (turntableData.error) 
      {
        return reply("Error: " + turntableData.error);
      }
      return reply("Added user " + turntableData.user + " to the room: interns!");
    });
  });
  post_req.write(post_data);
  post_req.end();
}

function addPlaylist(args, from, reply, to, pageToken) {
  var playlist_id = args[2];
  youtube.playlistItem.list({
    "part": "snippet",
    "maxResults": 50,
    "pageToken": pageToken,
    "playlistId": playlist_id,
    "fields": "items(id,snippet)"
  }, function (err, data) {
    var songs = data.items;
    var title, yt_hash, author;
    for(i = 0; i < songs.length; ++i)
    {
      title = songs[i].snippet.title;
      yt_hash = songs[i].snippet.resourceId.videoId;
      author = songs[i].snippet.channelTitle;
      reply("Adding Song: " + title);
      addSongHash(yt_hash, from, reply);
      sleep.sleep(20);        
    }
    var pageToken, pageTokenString;
    pageToken = data.nextPageToken;
    if (typeof(pageToken) !== "undefined" )
    {
      pageTokenString = "pageToken=" + pageToken + "&";
      getPlaylist(args, from, reply, to, pageTokenString);
    } 
  });
}

function addSong(args, from, reply, to, pageToken) {
  args.splice(0,1);
  var querystring = args.join(' ');
  youtube.search.list({
    "part": "snippet",
    "maxResults": 1,
    "q": querystring
  }, function (err, data) {
    var songs = data.items;
    var title, yt_hash, author;
    title = songs[0].snippet.title;
    yt_hash = songs[0].id.videoId;
    author = songs[0].snippet.channelTitle;
    addSongHash(yt_hash, from, reply);
  });
}

function queueSong(args, from, reply) {
  args.splice(0,1);
  var querystring = args.join(' ');
  youtube.search.list({
    "part": "snippet",
    "maxResults": 1,
    "q": querystring
  }, function (err, data) {
    var songs = data.items;
    var title, yt_hash, author;
    title = songs[0].snippet.title;
    yt_hash = songs[0].id.videoId;
    author = songs[0].snippet.channelTitle;
    queueSongHash(yt_hash, from, reply);
  });
}

function addSongHash(song_id, from, reply, room) {
  var post_data = querystring.stringify({
    'hash' : song_id
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/songs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
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
    'room' : 'interns'
  });
  var post_options = {
    host: 'turntable.dongs.in',
    port: '80',
    path: '/api/rooms/' + 'interns' + '/skip',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
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
      if (turntableData.skips >= turntableData.req_skips)
      {
        reply("Skipping song: " + turntableData.title + ". Skips Reached : " + turntableData.skips);
      }
      else
      {
        reply(from + " and " + turntableData.skips - 1 + " others want to skip " + turntableData.title);
      }
    });
  });
  post_req.write(post_data);
  post_req.end();

}

function queueSongHash(song_id, from, reply) {
  var post_data = querystring.stringify({
    'hash' : song_id,
    'room' : 'interns'
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
  };
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
      
      reply("Added " + turntableData.title + " to the " + 'interns' + 'room');

    });
  });
  post_req.write(post_data);
  post_req.end();

}



