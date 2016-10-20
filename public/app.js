'use strict';

let rtc = require('rtc-everywhere')();

let VideoChat = {
  //initiate socket
  socket: io(),
  //request local media from browser
  requestMediaStream: function(event){

    rtc.getUserMedia({video: true, audio: true},function(err, stream){
      //browser responds with stream send on
      if (stream) {
        VideoChat.onMediaStream(stream)
      } else {
        //stream was rejected by user or err occured
        VideoChat.noMediaStream(err)
      }
    })
  },

  onMediaStream: function(stream){
    //get local video div and set to variable
    VideoChat.localVideo = document.getElementById('local-video');
    //set volume
    VideoChat.localVideo.volume = 0;
    //set stream to variable
    VideoChat.localStream = stream;
    //disable get video div
    VideoChat.videoButton.setAttribute('disabled', 'disabled');
    //creates and objURL and saves it to a variable
    let streamUrl = window.URL.createObjectURL(stream);
    //now set our local video div's source to our streamURL
    VideoChat.localVideo.src = streamUrl;
    //ask server to set up a room called test and join it
    //this needs to be specific to user
    VideoChat.socket.emit('join', 'test');
    // waits till the server emits that room has been joined by both clients and calls readyToCall
    VideoChat.socket.on('ready', VideoChat.readyToCall);
    //called browser recieves offer
    VideoChat.socket.on('offer', VideoChat.onOffer);
  },
  //media stream
  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  },

  onOffer: function(offer){
    //now when token is emited we create an answer from the offer obj that was sent
    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));
    VideoChat.socket.emit('token');
     //If the NAT/Firewall still won't allow the two hosts to connect directly, they make a connection to a server implementing Traversal Using Relay around NAT (TURN), which will relay media between the two parties.
  },

  readyToCall: function(event){
    //Enables Call button
    //If both users available both can call each other else "unavailable"
    VideoChat.callButton.removeAttribute('disabled');
  },
  //call button was hit runs this
  startCall: function(event){
    //when token is recieved onToken function runs
    //after we have created an offer pass it into the onToken function
    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
    //tell server to go get tokens
    VideoChat.socket.emit('token');
    //creates peerconnection and puts twilios stun server as iceserver url
    VideoChat.peerConnection = new rtc.RTCPeerConnection({
      iceServers: [{url: "stun:global.stun.twilio.com:3478?transport=udp" }]//A host uses Session Traversal Utilities for NAT (STUN) to discover its public IP address when it is located behind a NAT/Firewall
    })
  },
  //onToken takes a callback so we can decide what happens on an offer or an answer
  onToken: function(callback){
    return function(token){
      //set token on iceServers
      VideoChat.peerConnection = new rtc.RTCPeerConnection({
        iceServers: token.iceServers
      });
      VideoChat.peerConnection.addStream(VideoChat.localStream);
      //set ice candiate on peer connection obj
      VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
      //add remote stream to our peer connection obj
      VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
      //candidate has been sent by other browser
      VideoChat.socket.on('candidate', VideoChat.onCandidate);
      //add listener on socket to save answer as remote description
      VideoChat.socket.on('answer', VideoChat.onAnswer);
      callback();
    }
  },
  //sets remote video to this div
  onAddStream: function(event){
    VideoChat.remoteVideo = document.getElementById('remote-video');
    VideoChat.remoteVideo.src = window.URL.createObjectURL(event.stream);
  },

  onAnswer: function(answer){
    //grabs answer and sets it as remote description
    let rtcAnswer = new rtc.RTCSessionDescription(JSON.parse(answer));
    VideoChat.peerConnection.setRemoteDescription(rtcAnswer);
  },

  createOffer: function(){
    //caller creates offer on RTCSessionDescription obj
    VideoChat.peerConnection.createOffer(
      function(offer){
        //sets local description
        VideoChat.peerConnection.setLocalDescription(offer);
        //emits offer to the server
        VideoChat.socket.emit('offer', JSON.stringify(offer));
      },
      function(err){
        console.log(err);
      }
    );
  },

  createAnswer: function(offer){
    return function(){
      //parse offer and set variable
      let rtcOffer = new rtc.RTCSessionDescription(JSON.parse(offer));
      //set remote Description
      VideoChat.peerConnection.setRemoteDescription(rtcOffer);
      //set up answer to be sent to caller
      VideoChat.peerConnection.createAnswer(
        function(answer){
          //set own local description
          VideoChat.peerConnection.setLocalDescription(answer);
          //and send to server
          VideoChat.socket.emit('answer', JSON.stringify(answer));
        },
        function(err){
          console.log(err);
        }
      );
    }
  },

  //when generating token run thisfunction
  //this is a method on the RTCPeerConnection Obj
  onIceCandidate: function(event){
    if(event.candidate){
      //send candidate to server for broadcasting
      VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
    }
  },

  onCandidate: function(candidate){
    //turns candidate into RTCIceCandidate and set to variable
    let rtcCandidate = new rtc.RTCIceCandidate(JSON.parse(candidate));
    //add to peer connection Obj
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

