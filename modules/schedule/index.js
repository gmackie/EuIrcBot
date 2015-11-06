var later = require('later');

var bot;

var schedules = [];

function writeSchedule(data) {
  bot.writeDataFile("later.json", 
      JSON.stringify({'data': data}), function(err) {
        if(err) console.log("Error writing command file: " + err);
  });
}

function newSchedule(data) {
  //keys: 'schedule', 'created', 'from', 'command'
  
  // check that this is a valid schedule
  var s;

  try {
    s = later.parse.text(data['schedule']);
  } catch (ex) {
    return ex;
  }

  if( s == 0 )
    return "Provided schedule query doesn't parse.";
  
  data['schedule'] = s;

  // check frequency is below some minimum
  
  // check valid command
  

  registerCommand(data);

  schedules.push(data);
  writeSchedule(schedules);
}

function registerCommand(data)
{
  var command;

  //If it's a command, emulate being sent a command. Otherwise say it.
  if( data['command'].match(/^!/) )
  {
    command = function() {
      //FIXME: Properly implement raw.
      bot.client.emit('message', data['blame'], data['channel'], 
        data['command'], data['command']);
    };
  }
  else
  {
    command = function() {
      bot.sayTo(data['channel'], data['command']);
    };
  }

  later.setInterval(command, data['schedule']);
}

module.exports.init = function(b) {
  bot = b;
  bot.readDataFile("later.json", function(err, data) {
    console.log("Read data file w/ error '" + err + "'");
    if(err) {
      console.log("Initializing later.json");
      schedules = [];
      writeSchedule(schedules);
    } else {
      try {
        console.log("Parsing later.json...");
        schedules = JSON.parse(data)['data'];

        // process schedules
        schedules.forEach(function(e, i, d) {
          registerCommand(e);
        });
      } catch(ex) {
        console.log("Error parsing: " + ex);
        console.log("Corrupted later.json for schedule! Resetting file...");
        schedules = [];
        writeSchedule(schedules);
      }
    }
  });

};

//  bot.getConfig("dumbcommand.json", function(err, conf) {
//    if(!err) {
//      allowCmds = conf['allow_commands'];
//    }
//  });


module.exports.commands = {
  schedule: {
    _default: function(x,y,reply) {
      reply("Usage: schedule [<add>|<remove>|<list>|<blame>] \"<schedule>\" \"<command>\"");
    },
    add: function(r, parts, reply, command, from, to, text, raw) {
      if(parts.length !== 2) return reply("add must have *exactly* two arguments");

      // check and add schedule
      var err = newSchedule({
        'blame': from,
        'created': new Date(),
        'schedule': parts[0],
        'command': parts[1],
        'channel': to
      });

      if( err )
        reply(err);
      else
        reply("Added");
    }

    /*
    blame: function(r, parts, reply) {
      if(parts.length === 0) return reply("please specify a command to blame");
      if(typeof commandDict[parts[0]] === 'undefined') return reply("No such command");
      reply("Blame " + commandDict[parts[0]].blame + " for this");
    },
    remove: function(r, parts, reply) {
      if(parts.length !== 1) return reply("remove must have *exactly* one argument");

      if(typeof commandDict[parts[0]] === 'undefined') return reply("No such command");

      delete commandDict[parts[0]];
      reply("Removed command " + parts[0]);

      writeSchedule();
    },
    list: function(x,parts,reply) {
      if(parts.length === 0) {
        reply("Commands: " + Object.keys(commandDict).join(","));
      } else {
        reply(parts.map(function(key) { return commandDict[key] ? key + " -> " + commandDict[key] : ''; })
            .filter(function(item) { return item.length > 0; }).join(" | "));
      }
    */
  }
};
