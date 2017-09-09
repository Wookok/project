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
  var repeatCount = 1;

  while(isCollision){
    if (repeatCount > 20){
      isCollision = false;
    }else{
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
    repeatCount++;
  }
  return pos;
};
exports.generateNearPos = function(position, range){
  var addPosX = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random()*range);
  var addPosY = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random()*range);

  return {x : position.x + addPosX, y : position.y + addPosY};
};
exports.getRandomNum = function(minVal, maxVal){
  return Math.floor(Math.random()*(maxVal - minVal) + minVal);
};

exports.expToRadius = function(exp){
  return 4 + Math.sqrt(exp) * 6;
};

exports.onUserBuffExchange = function(user){
  this.onNeedInformBuffUpdate(user);
};
exports.onUserSkillUpgrade = function(socketID, beforeSkillIndex, afterSkillIndex){
  this.onNeedInformSkillUpgrade(socketID, beforeSkillIndex, afterSkillIndex);
};
exports.onUserChangeStat = function(user){
  this.onNeedInformUserChangeStat(user);
};
exports.onUserDeath = function(attackUserID, exp, deadUser){
  if(attackUserID in this.users){
    this.users[attackUserID].getExp(exp);
  }else{
    console.log(attackUserID + ' is not exists');
  }
};
exports.setAffectedEleColSkillWithEntity = function(skill, affectedID, collisionType){
  return {
    collisionType : collisionType,
    skillType : skill.type,

    projectileID : skill.objectID || 0,
    actorID : skill.id,
    affectedID : affectedID,

    fireDamage : skill.fireDamage || 0,
    frostDamage : skill.frostDamage || 0,
    arcaneDamage : skill.arcaneDamage || 0,
    damageToMP : skill.damageToMP || 0,

    buffToTarget : skill.buffToTarget
  }
};
exports.setAffectedEleColUserWithCollection = function(userID, affectedObj, collisionType){
  return{
    collisionType : collisionType,
    actorID : userID,
    affectedID : affectedObj.id,

    expAmount : affectedObj.expAmount || 0,
    goldAmount : affectedObj.goldAmount || 0,
    skillIndex : affectedObj.skillIndex || 0
  }
};
