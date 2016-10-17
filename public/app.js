'use strict'

// app.js
let VideoChat = {
  socket: io(),

  requestMediaStream: function(event){
    navigator.webkitGetUserMedia(
      {video: true, audio: true},
      VideoChat.onMediaStream,
      VideoChat.noMediaStream
    );
  },

  onMediaStream: function(stream){
    VideoChat.localVideo = document.getElementById('local-video');
    VideoChat.localVideo.volume = 0;
    VideoChat.localStream = stream;
    VideoChat.videoButton.setAttribute('disabled', 'disabled');
    let streamUrl = window.URL.createObjectURL(stream);
    VideoChat.localVideo.src = streamUrl;
    VideoChat.socket.emit('join', 'test');
    VideoChat.socket.on('ready', VideoChat.readyToCall);
  },

  readyToCall: function(event){
    VideoChat.callButton.removeAttribute('disabled');
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  },

  startCall: function(event){
    console.log("Things are going as planned!");
  }
};

VideoChat.videoButton = document.getElementById('get-video');

VideoChat.videoButton.addEventListener(
  'click',
  VideoChat.requestMediaStream,
  false
);

VideoChat.callButton = document.getElementById('call');

VideoChat.callButton.addEventListener(
  'click',
  VideoChat.startCall,
  false
);

