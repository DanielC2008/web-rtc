'use strict'

// app.js
let VideoChat = {
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
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  }
};

VideoChat.videoButton = document.getElementById('get-video');

VideoChat.videoButton.addEventListener(
  'click',
  VideoChat.requestMediaStream,
  false
);

