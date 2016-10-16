'use strict'

// index.js
let Hapi = require('hapi');
let server = new Hapi.Server()
server.connection({
  'host': 'localhost',
  'port': 3000
});
let socketio = require("socket.io");
let io = socketio(server.listener);
let twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Serve static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

// Start the server
server.start(() =>{
  console.log('Server running at:', server.info.uri);
});
