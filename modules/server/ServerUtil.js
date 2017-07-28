var util = require('../public/util.js');

exports.generateRandomUniqueID = function(uniqueCheckArray, prefix){
  var IDisUnique = false;
  while(!IDisUnique){
    var randomID = generateRandomID(prefix);
    IDisUnique = true;
    for(var index in uniqueCheckArray){
      if(randomID == uniqueCheckArray[index].objectID){
        IDisUnique = false;
      }
    }
  }
  return randomID;
};
function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

exports.generateRandomPos = function(checkTree, minX, minY, maxX, maxY, radius, diffRangeWithOthers, objID, checkTree2){
  var isCollision = true;
  while(isCollision){
    isCollision = false;
    var pos = {
      x : Math.floor(Math.random()*(maxX - minX) + minX),
      y : Math.floor(Math.random()*(maxY - minY) + minY)
    }
    var collisionObjs = util.checkCircleCollision(checkTree, pos.x, pos.y, radius + diffRangeWithOthers, objID);
    if(collisionObjs.length > 0){
      isCollision = true;
    }else if(checkTree2){
      var collisionObjs = util.checkCircleCollision(checkTree2, pos.x, pos.y, radius + diffRangeWithOthers, objID);
      if(collisionObjs.length >0){
        isCollision = true;
      }
    }
  }
  return pos;
};
exports.getRandomNum = function(minVal, maxVal){
  return Math.floor(Math.random()*(maxVal - minVal) + minVal);
};

exports.expToRadius = function(exp){
  return 4 + Math.sqrt(exp) * 6;
};

exports.onUserDeath = function(attackUserID, exp, deadUser){
  if(attackUserID in this.users){
    this.users[attackUserID].getExp(exp);
  }else{
    console.log(attackUserID + ' is not exists');
  }
};
