
var socket = io();
var userName;
var canvas;
var ctx;

setupSocket();

document.getElementById('startButton').onclick = function(){
  reqStartGame();
};

function setupSocket(){
  socket.on('resStartGame', function(data){
    console.log(data);
    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');
    canvasSetting();
  });
  var temp = undefined;
  socket.on('resMove', function(data){
    console.log('move start');
    clearInterval(temp);
    temp = setInterval(function(){
      data.position.x += 1;
      data.position.y += 1;
      console.log(data.position);
    }, 1000);
  })
};

function reqStartGame(){
  socket.emit('reqStartGame');
};

function canvasSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    socket.emit('reqMove', targetPosition);
  }, false);
}
// window.onbeforeunload = function(e){
//   return 'Are you sure';
// }
