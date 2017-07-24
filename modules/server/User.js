var LivingEntity = require('./LivingEntity.js');

var util = require('../public/util.js');
var csvJson = require('../public/csvjson');

var dataJson = require('../public/data.json');
var userLevelDataTable = csvJson.toObject(dataJson.userLevelData, {delimiter : ',', quote : '"'});

function User(id, userBaseTable, Exp){
  LivingEntity.call(this, Exp);
  // base setting;
  this.baseHP = userBaseTable.baseHP;
  this.baseMP = userBaseTable.baseMP;
  this.baseMaxSpeed = userBaseTable.baseMaxSpeed;
  this.baseRotateSpeed = userBaseTable.baseRotateSpeed;
  this.baseHPRegen = userBaseTable.baseHPRegen;
  this.baseMPRegen = userBaseTable.baseMPRegen;
  this.baseHPRegenRate = userBaseTable.baseHPRegenRate;
  this.baseMPRegenRate = userBaseTable.baseMPRegenRate;
  this.baseAttackSpeed = userBaseTable.baseAttackSpeed;
  this.baseCastSpeed = userBaseTable.baseCastSpeed;
  this.baseDamageRate = userBaseTable.baseDamageRate;

  this.level = 1;
  this.Exp = Exp;

  this.levelBonus = {

  };
  this.buffList = [];
  this.debuffList = [];

  //current stat
  this.HP;
  this.currentHP = 100;
  this.MP;
  this.currentMP;
  // this.maxSpeed;
  // this.rotateSpeed;
  this.HPRegen;
  this.MPRegen;
  this.attackSpeed;
  this.castSpeed;
  this.damageRate;

  this.socketID = id;

  this.buffUpdateInterval = false;

  this.onDeath = new Function();

  this.getExp(0);
  this.setUserStatToMaxBase();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

User.prototype.takeDamage = function(attackUserID, dmg){
  this.currentHP -= dmg;
  if(this.currentHP <= 0){
    this.death(attackUserID);
  }
};
User.prototype.death = function(attackUserID){
  //calculate exp to attacker
  console.log(this.objectID + ' is dead by ' + attackUserID);
  var exp = this.level *  10000;
  this.onDeath(attackUserID, exp, this);
};
User.prototype.buffUpdate = function(){
  if(!this.buffUpdateInterval){
    this.buffUpdateInterval = setInterval(buffUpdateHandler.bind(this), 1000);
  }
};
function buffUpdateHandler(){
  for(var i=0; i<this.buffList.length; i++){
    this[this.buffList[i].buffType] += this.buffList[i].buffAmount;
  }
  for(var i=0; i<this.debuffList.length; i++){
    this[this.debuffList[i].buffType] += this.debuffList[i].buffAmount;
  }
};
User.prototype.getExp = function(exp){
  this.Exp += exp;
  var userLevelData = util.findData(userLevelDataTable, 'level', this.level);
  if(userLevelData.needExp === -1){
    console.log('user reach max level');
  }else if(this.Exp >= userLevelData.needExp){
    this.levelUp();
  }
};
User.prototype.levelUp = function(){
  this.level ++;
  var userLevelData = util.findData(userLevelDataTable, 'level', this.level);
  console.log('level up to ' + this.level);
  //add levelBonus
  //additional level up check.
  this.updateUserBaseStat();
  this.getExp(0);
};
//execute when level up or down
User.prototype.updateUserBaseStat = function(){
  for(var index in this.levelBonus){
    switch (index) {
      case "baseHP":
        break;
      default:

    }
  }
  this.baseHP;
  this.baseMP;
  this.baseMaxSpeed;
  this.baseRotateSpeed;
  this.baseHPRegen;
  this.baseMPRegen;
  this.baseHPRegenRate;
  this.baseMPRegenRate;
  this.baseAttackSpeed;
  this.baseCastSpeed;
  this.baseDamageRate;
};
User.prototype.setUserStatToMaxBase = function(){
  this.HP           = this.baseHP           ;
  this.MP           = this.baseMP           ;
  this.maxSpeed     = 10     ;
  this.HPRegen      = this.baseHPRegen      ;
  this.MPRegen      = this.baseMPRegen      ;
  this.attackSpeed  = this.baseAttackSpeed  ;
  this.castSpeed    = this.baseCastSpeed    ;
  this.damageRate   = this.baseDamageRate   ;
  this.rotateSpeed  = 10                    ;
};
//execute every frame?
User.prototype.updateUserStat = function(){
  for(var index in this.buffList){

  }
  for(var index in this.debuffList){

  }
  this.HP           = this.baseHP           ;
  this.MP           = this.baseMP           ;
  this.maxSpeed     = 10     ;
  this.HPRegen      = this.baseHPRegen      ;
  this.MPRegen      = this.baseMPRegen      ;
  this.attackSpeed  = this.baseAttackSpeed  ;
  this.castSpeed    = this.baseCastSpeed    ;
  this.damageRate   = this.baseDamageRate   ;
  this.rotateSpeed  = 10                    ;
};

module.exports = User;
