var http = require('http');
var https = require('https');
var querystring = require('querystring');
var config;

module.exports.commands = ["turntable", "tt", "playlist"];

module.exports.init = function(bot) {
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
  reply("command: " + args[0]);
  switch(args[0])
  {
    case "join":
      return joinRoom(from, reply, to);
    case "leave":
      return leaveRoom(from, reply, to);
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

function addSong(song_id, from, reply) {
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
    path: '/api/room/' + 'interns' + '/skip',
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
      reply(from + " and " + turntableData.votes + " others want to skip this song!");

    });
  });
  post_req.write(post_data);
  post_req.end();

}

function queueSong(song_id, from, reply) {
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
      
      reply("Added " + turntableData.title + " to the #interns queue, you are song number " + turntableData.queuePos);

    });
  });
  post_req.write(post_data);
  post_req.end();

}


