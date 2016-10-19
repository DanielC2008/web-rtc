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
    VideoChat.socket.on('offer', VideoChat.onOffer);
  },

  onOffer: function(offer){
    console.log('Got an offer')
    console.log(offer);
  },

  readyToCall: function(event){
    VideoChat.callButton.removeAttribute('disabled');
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  },

  startCall: function(event){
    VideoChat.socket.on('token', VideoChat.onToken);
    VideoChat.socket.emit('token');
    VideoChat.peerConnection = new webkitRTCPeerConnection({
      iceServers: [{url: "stun:global.stun.twilio.com:3478?transport=udp" }]
    })
  },

  onToken: function(token){
    VideoChat.peerConnection = new webkitRTCPeerConnection({
      iceServers: token.iceServers
    });
    VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
    VideoChat.socket.on('candidate', VideoChat.onCandidate);
    VideoChat.peerConnection.addStream(VideoChat.localStream);
    VideoChat.peerConnection.createOffer(
      function(offer){
        VideoChat.peerConnection.setLocalDescription(offer);
        VideoChat.socket.emit('offer', JSON.stringify(offer));
      },
      function(err){
        console.log(err);
      }
    );
  },

  onIceCandidate: function(event){
    if(event.candidate){
      console.log('Generated candidate!');
      VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
    }
  },

  onCandidate: function(candidate){
    rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    VideoChat.peerConnection.addIceCandidate(rtcCandidate);
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

