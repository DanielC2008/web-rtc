'use strict'

let Hapi = require('hapi');
let server = new Hapi.Server()
server.connection({
  'host': 'localhost',
  'port': 3000
});
let socketio = require("socket.io");
let io = socketio(server.listener);
let twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
let wrtc = require('wrtc')


// Serve static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

io.on('connection', function(socket){
  //when someone presses the get video button
  // could also be online offline
  socket.on('join', function(room){
    //set up a room for users to join
    //this needs to be something specific to the user setting it up
    let clients = io.sockets.adapter.rooms[room];
    //make sure that only two clients in one room
    let numClients = (clients !== undefined) ? clients.length : 0;
    if(numClients == 0){
    	socket.join(room)
    }else if(numClients == 1){
      socket.join(room)
      //emits room is ready and call can be made
      io.emit('ready', room);
    }else{
      socket.emit('full', room);
    }
  });

  socket.on('token', function(){
  //request tokens from twilio
    twilio.tokens.create(function(err, response){
      if(err){
        console.log(err);
      }else{
        //sends response to client side
        socket.emit('token', response);
      }
    });
  });
  //tell everyone a new candidate has joined the server
  socket.on('candidate', function(candidate){
    socket.broadcast.emit('candidate', candidate);
  });
  //broadcasts offer to other browser
  socket.on('offer', function(offer){
    socket.broadcast.emit('offer', offer);
  });
  //original caller receives an answer
  socket.on('answer', function(answer){
    socket.broadcast.emit('answer', answer);
  });
});
// Start the server
server.start(() =>{
  console.log('Server running at:', server.info.uri);
});
