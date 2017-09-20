var serverConfig = require('./serverConfig.json');
var util = require('../public/util.js');
var csvJson = require('../public/csvjson.js')
var dataJson = require('../public/data.json');

var buffGroupTable = csvJson.toObject(dataJson.buffGroupData, {delimiter : ',', quote : '"'});
var buffTable = csvJson.toObject(dataJson.buffData, {delimiter : ',', quote : '"'});

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
exports.goldToRadius = function(gold){
  return 4 + Math.sqrt(gold) * 6;
};

exports.onUserBuffExchange = function(user){
  this.onNeedInformBuffUpdate(user);
};
exports.onUserSkillUpgrade = function(socketID, beforeSkillIndex, afterSkillIndex){
  this.onNeedInformSkillUpgrade(socketID, beforeSkillIndex, afterSkillIndex);
};
exports.onUserChangePrivateStat = function(user){
  this.onNeedInformUserChangePrivateStat(user);
};
exports.onUserChangeStat = function(user){
  this.onNeedInformUserChangeStat(user);
};
exports.onUserTakeDamage = function(user, dmg){
  this.onNeedInformUserTakeDamage(user, dmg);
};
exports.onUserReduceMP = function(user){
  this.onNeedInformUserReduceMP(user);
};
exports.onUserGetExp = function(user){
  this.onNeedInformUserGetExp(user);
};
exports.onUserLevelUP = function(user){
  this.onNeedInformUserLevelUp(user);
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

    buffToTarget : skill.buffToTarget,
    additionalBuffToTarget : skill.additionalBuffToTarget
  }
};
exports.setAffectedEleColUserWithCollection = function(userID, affectedObj, collisionType){
  return{
    collisionType : collisionType,
    actorID : userID,
    affectedID : affectedObj.id,

    expAmount : affectedObj.expAmount || 0,
    goldAmount : affectedObj.goldAmount || 0,
    jewelAmount : affectedObj.jewelAmount || 0,
    skillIndex : affectedObj.skillIndex || 0
  }
};
exports.checkUserBuff = function(user, skillData){
  var fireBuffList = [];
  var hitBuffList = [];
  for(var i=0; i<user.passiveList.length; i++){
    var buffs = util.findAndSetBuffs(user.passiveList[i], buffTable, user.objectID);
    for(var j=0; j<buffs.length; j++){
      if(buffs[j].buffAdaptTime === serverConfig.BUFF_ADAPT_TIME_FIRE){
        if(buffs[j].skillProperty){
          if(buffs[j].skillProperty === skillData.property){
            if(buffs[j].fireUserCondition){
              if(user.conditions[buffs[j].fireUserCondition]){
                fireBuffList.push(buffs[j]);
              }
            }else{
              fireBuffList.push(buffs[j]);
            }
          }
        }else{
          fireBuffList.push(buffs[j]);
        }
      }else if(buffs[j].buffAdaptTime === serverConfig.BUFF_ADAPT_TIME_FIRE_AND_HIT){
        if(buffs[j].skillProperty){
          if(buffs[j].skillProperty === skillData.property){
            if(buffs[j].fireUserCondition){
              if(user.conditions[buffs[j].fireUserCondition]){
                hitBuffList.push(user.passiveList[i]);
                break;
              }
            }else{
              hitBuffList.push(user.passiveList[i]);
              break;
            }
          }
        }else{
          hitBuffList.push(user.passiveList[i]);
          break;
        }
      }
    }
  }
  for(var i=0; i<user.buffList.length; i++){
    var buffs = util.findAndSetBuffs(user.buffList[i], buffTable, user.objectID);
    for(var j=0; j<buffs.length; j++){
      if(buffs[j].buffAdaptTime === serverConfig.BUFF_ADAPT_TIME_FIRE){
        if(buffs[j].skillProperty){
          if(buffs[j].skillProperty === skillData.property){
            if(buffs[j].fireUserCondition){
              if(user.conditions[buffs[j].fireUserCondition]){
                fireBuffList.push(buffs[j]);
              }
            }else{
              fireBuffList.push(buffs[j]);
            }
          }
        }else{
          fireBuffList.push(buffs[j]);
        }
      }else if(buffs[j].buffAdaptTime === serverConfig.BUFF_ADAPT_TIME_FIRE_AND_HIT){
        if(buffs[j].skillProperty){
          if(buffs[j].skillProperty === skillData.property){
            if(buffs[j].fireUserCondition){
              if(user.conditions[buffs[j].fireUserCondition]){
                hitBuffList.push(user.buffList[i]);
                break;
              }
            }else{
              hitBuffList.push(user.buffList[i]);
              break;
            }
          }
        }else{
          hitBuffList.push(user.buffList[i]);
          break;
        }
      }
    }
  }
  var additionalDamage = 0,
      additionalFireDamage = 0,
      additionalFrostDamage = 0,
      additionalArcaneDamage = 0,
      additionalDamageRate = 100,
      additionalFireDamageRate = 100,
      additionalFrostDamageRate = 100,
      additionalArcaneDamageRate = 100;

  for(var i=0; i<fireBuffList.length; i++){
    if(fireBuffList[i].buffType === serverConfig.BUFF_TYPE_ADD_SECONDARY_STAT){
      if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE){
        additionalDamage += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE){
        additionalFireDamage += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE){
        additionalFrostDamage += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE){
        additionalArcaneDamage += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE_RATE){
        additionalDamageRate += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE_RATE){
        additionalFireDamageRate += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE_RATE){
        additionalFrostDamageRate += fireBuffList[i].buffAmount;
      }else if(fireBuffList[i].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE_RATE){
        additionalArcaneDamageRate += fireBuffList[i].buffAmount;
      }
    }else if(fireBuffList[i].buffType === serverConfig.BUFF_TYPE_ADD_BUFF){
      var addBuffGroupList = [];
      for(var j=0; j<serverConfig.BUFFTABLE_BUFFGROUP_LENGTH; j++){
        if(fireBuffList[i]['buffGroup' + (j + 1)]){
          addBuffGroupList.push(fireBuffList[i]['buffGroup' + (j + 1)]);
        }else{
          break;
        }
      }
      var randomIndex = Math.floor(Math.random() * (addBuffGroupList.length));
      var addBuffGroupIndex = addBuffGroupList[randomIndex];
      var addBuffGroupData = util.findData(buffGroupTable, 'index', addBuffGroupIndex);
      if(addBuffGroupData.isBuff){
        skillData.additionalBuffToSelf = addBuffGroupIndex;
      }else{
        skillData.additionalBuffToTarget = addBuffGroupIndex;
      }
    }
  }
  skillData.fireDamage = (additionalDamage + additionalFireDamage) * additionalFireDamageRate/100 * additionalDamageRate/100;
  skillData.frostDamage = (additionalDamage + additionalFrostDamage) * additionalFrostDamageRate/100 * additionalDamageRate/100;
  skillData.arcaneDamage = (additionalDamage + additionalArcaneDamage) * additionalArcaneDamageRate/100 * additionalDamageRate/100;
  skillData.hitBuffList = hitBuffList;
};
