var GameObject = require('./GameObject.js');

function OBJSkill(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.skillIndex = 11;
  this.skillProperty = 1;

  this.collectionEle = {};
};
OBJSkill.prototype = Object.create(GameObject.prototype);
OBJSkill.prototype.constructor = OBJSkill;

OBJSkill.prototype.initOBJSkill = function(position, radius, skillIndex, skillProperty){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.skillIndex = skillIndex;
  this.skillProperty = skillProperty;
};
OBJSkill.prototype.setCollectionEle = function(){
  this.collectionEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    skillIndex : this.skillIndex,
  }
};

module.exports.OBJSkill = OBJSkill;

function OBJGold(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.goldAmount = 0;

  this.collectionEle = {};
};
OBJGold.prototype = Object.create(GameObject.prototype);
OBJGold.prototype.constructor = OBJGold;

OBJGold.prototype.initOBJGold = function(position, radius, goldAmount){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.goldAmount = goldAmount;
};
OBJGold.prototype.setCollectionEle = function(){
  this.collectionEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    goldAmount : this.goldAmount
  }
};
module.exports.OBJGold = OBJGold;

function OBJJewel(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.jewelAmount = 1;

  this.collectionEle = {};
};
OBJJewel.prototype = Object.create(GameObject.prototype);
OBJJewel.prototype.constructor = OBJJewel;

OBJJewel.prototype.initOBJJewel = function(position, radius, jewelAmount){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.jewelAmount = jewelAmount;
};
OBJJewel.prototype.setCollectionEle = function(){
  this.collectionEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    jewelAmount : this.jewelAmount
  }
};
module.exports.OBJJewel = OBJJewel;

// function OBJExp(objectID){
//   GameObject.call(this);
//   this.objectID = objectID;
//
//   this.expAmount = 0;
//
//   this.collectionEle = {};
// };
// OBJExp.prototype = Object.create(GameObject.prototype);
// OBJExp.prototype.constructor = OBJExp;
//
// OBJExp.prototype.initOBJExp = function(position, radius, expAmount){
//   this.setSize(radius * 2, radius * 2);
//   this.setPosition(position.x, position.y);
//   this.expAmount = expAmount;
// };
// OBJExp.prototype.setCollectionEle = function(){
//   this.collectionEle = {
//     id : this.objectID,
//     x : this.position.x,
//     y : this.position.y,
//     width : this.size.width,
//     height : this.size.height,
//     expAmount : this.expAmount
//   };
// };
// module.exports.OBJExp = OBJExp;

function OBJChest(objectID, locationID){
  GameObject.call(this);
  this.objectID = objectID;
  this.locationID = locationID;

  this.maxHP = 0;
  this.HP = 0;

  this.grade = 0;
  // this.exps = [];
  this.golds = [];
  this.jewels = [];
  this.skills = [];

  this.entityTreeEle = {}

  this.onTakeDamage = new Function();
  this.onDestroy = new Function();
  this.onCreateExp = new Function();
  this.onCreateSkill = new Function();
};
OBJChest.prototype = Object.create(GameObject.prototype);
OBJChest.prototype.constructor = OBJChest;

OBJChest.prototype.takeDamage = function(attackUser, damage){
  console.log(this.objectID + ' is hit by ' + attackUser);
  this.HP -= damage;
  console.log(this.HP);
  if(this.HP <= 0){
    this.destroy();
  }else{
    this.onTakeDamage(this.locationID, this.HP);
  }
};
OBJChest.prototype.destroy = function(){
  this.onDestroy(this);
};
OBJChest.prototype.initOBJChest = function(position, radius, chestData){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.maxHP = chestData.HP;
  this.HP = this.maxHP;
  this.grade = chestData.grade;
  this.setGolds(chestData);
  this.setJewels(chestData);
  // this.setExps(chestData);
  this.setSkills(chestData);
  console.log(this);
};
OBJChest.prototype.setGolds = function(chestData){
  var goldCount = Math.floor(Math.random() * (chestData.maxGoldCount - chestData.minGoldCount + 1) + chestData.minGoldCount);
  for(var i=0; i<goldCount; i++){
    var goldAmount = Math.floor(Math.random() * (chestData.maxGoldAmount - chestData.minGoldAmount + 1) + chestData.minGoldAmount);
    this.golds.push(goldAmount);
  }
};
OBJChest.prototype.setJewels = function(chestData){
  var jewelCount = Math.floor(Math.random() * (chestData.maxJewelCount - chestData.minJewelCount + 1) + chestData.minJewelCount);
  for(var i=0; i<jewelCount; i++){
    var jewelAmount = Math.floor(Math.random() * (chestData.maxJewelAmount - chestData.minJewelAmount + 1) + chestData.minJewelAmount);
    this.jewels.push(jewelAmount);
  }
}
// OBJChest.prototype.setExps = function(chestData){
//   var expCount = Math.floor(Math.random() * (chestData.maxExpCount - chestData.minExpCount + 1) + chestData.minExpCount);
//   for(var i=0; i<expCount; i++){
//     var expAmount = Math.floor(Math.random() * (chestData.maxExpAmount - chestData.minExpAmount + 1) + chestData.minExpAmount);
//     this.exps.push(expAmount);
//   }
// };
OBJChest.prototype.setSkills = function(chestData){
  var totalRate = 0;
  for(var i=0; i<20; i++){
    if(chestData['SkillDropRate' + (i + 1)]){
      totalRate += chestData['SkillDropRate' + (i + 1)];
    }else{
      break;
    }
  }
  var skillCount = Math.floor(Math.random() * (chestData.maxSkillCount - chestData.minSkillCount + 1) + chestData.minSkillCount);
  for(var i=0; i<skillCount; i++){
    var randVal = Math.floor(Math.random() * totalRate);
    var sumOfRate = 0;
    for(var j=0; j<20; j++){
      if(chestData['SkillDropRate' + (j + 1)]){
        sumOfRate += chestData['SkillDropRate' + (j + 1)];
        if(sumOfRate > randVal){
          var skillIndex = chestData['SkillIndex' + (j + 1)];
          this.skills.push(skillIndex);
          break;
        }
      }else{
        break;
      }
    }
  }
};
OBJChest.prototype.setEntityEle = function(){
  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};
module.exports.OBJChest = OBJChest;
