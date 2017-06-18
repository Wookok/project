

var socket = io();
var userName;
setupSocket();

$('#startButton').click(function(){
  reqStartGame();
});

function setupSocket(){
  socket.on('resStartGame', function(data){
    console.log(data);
    $('#infoScene').css('display', 'none');
    $('#gameScene').css('display', 'block');
  });
};

function reqStartGame(){
  socket.emit('reqStartGame');
};
// window.onbeforeunload = function(e){
//   return 'Are you sure';
// }
