'use strict'

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
    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));
    VideoChat.socket.emit('token');
  },

  readyToCall: function(event){
    VideoChat.callButton.removeAttribute('disabled');
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  },

  startCall: function(event){
    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
    VideoChat.socket.emit('token');
    VideoChat.peerConnection = new webkitRTCPeerConnection({
      iceServers: [{url: "stun:global.stun.twilio.com:3478?transport=udp" }]
    })
  },

  onToken: function(callback){
    return function(token){
      VideoChat.peerConnection = new webkitRTCPeerConnection({
        iceServers: token.iceServers
      });
      VideoChat.peerConnection.addStream(VideoChat.localStream);
      VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
      VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
      VideoChat.socket.on('candidate', VideoChat.onCandidate);
      VideoChat.socket.on('answer', VideoChat.onAnswer);
      callback();
    }
  },

  onAddStream: function(event){
    VideoChat.remoteVideo = document.getElementById('remote-video');
    VideoChat.remoteVideo.src = window.URL.createObjectURL(event.stream);
  },

  onAnswer: function(answer){
    let rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    VideoChat.peerConnection.setRemoteDescription(rtcAnswer);
  },

  createOffer: function(){
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

  createAnswer: function(offer){
    return function(){
      let rtcOffer = new RTCSessionDescription(JSON.parse(offer));
      VideoChat.peerConnection.setRemoteDescription(rtcOffer);
      VideoChat.peerConnection.createAnswer(
        function(answer){
          VideoChat.peerConnection.setLocalDescription(answer);
          VideoChat.socket.emit('answer', JSON.stringify(answer));
        },
        function(err){
          console.log(err);
        }
      );
    }
  },
  onIceCandidate: function(event){
    if(event.candidate){
      console.log('Generated candidate!');
      VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
    }
  },

  onCandidate: function(candidate){
    let rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
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

