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
  this.currentHP;
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

  this.getExp(0);
  this.updateUserStat();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

User.prototype.getExp = function(exp){
  this.Exp += exp;
  var userLevelData = util.findData(userLevelDataTable, 'level', this.level);
  if(this.Exp >= userLevelData.needExp){
    this.levelUp();
  }
};
User.prototype.levelUp = function(){
  this.level ++;
  var userLevelData = util.findData(userLevelDataTable, 'level', this.level);
  //add levelBonus
  //additional level up check.
  this.updateUserBaseStat();
  this.getExp(0);
};
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
}
User.prototype.updateUserStat = function(){
  for(var index in this.buffList){

  }
  for(var index in this.debuffList){

  }
  this.HP           = this.baseHP           ;
  this.MP           = this.baseMP           ;
  this.maxSpeed     = this.baseMaxSpeed     ;
  this.HPRegen      = this.baseHPRegen      ;
  this.MPRegen      = this.baseMPRegen      ;
  this.attackSpeed  = this.baseAttackSpeed  ;
  this.castSpeed    = this.baseCastSpeed    ;
  this.damageRate   = this.baseDamageRate   ;
  this.rotateSpeed  = 20                    ;
};

module.exports = User;
