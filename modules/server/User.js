var LivingEntity = require('./LivingEntity.js');

var util = require('../public/util.js');
var csvJson = require('../public/csvjson');

var dataJson = require('../public/data.json');
var userStatTable = csvJson.toObject(dataJson.userStatData, {delimiter : ',', quote : '"'});
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var buffGroupTable = csvJson.toObject(dataJson.buffGroupData, {delimiter : ',', quote : '"'});
var buffTable = csvJson.toObject(dataJson.buffData, {delimiter : ',', quote : '"'});

// var userLevelDataTable = csvJson.toObject(dataJson.userLevelData, {delimiter : ',', quote : '"'});
var gameConfig = require('../public/gameConfig.json');
var serverConfig = require('./serverConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

function User(socketID, userStat, userBase, exp, baseSkillLevel){
  LivingEntity.call(this);
  // base setting;
  this.type = userStat.type;

  this.baseMight = userStat.might;
  this.baseIntellect = userStat.intellect;
  this.basePerception = userStat.perception;

  this.might = 0;
  this.intellect = 0;
  this.perception = 0;

  this.baseHP = userBase.baseHP;
  this.baseMP = userBase.baseMP;
  this.baseHPRegen = userBase.baseHPRegen;
  this.baseMPRegen = userBase.baseMPRegen;
  this.baseHPRegenRate = userBase.baseHPRegenRate;
  this.baseMPRegenRate = userBase.baseMPRegenRate;
  this.baseMoveSpeed = userBase.baseMoveSpeed;
  this.baseRotateSpeed = userBase.baseRotateSpeed;
  this.baseCastSpeed = userBase.baseCastSpeed;
  this.baseDamage = userBase.baseDamage;
  this.baseFireDamage = userBase.baseFireDamage;
  this.baseFrostDamage = userBase.baseFrostDamage;
  this.baseArcaneDamage = userBase.baseArcaneDamage;
  this.baseDamageRate = userBase.baseDamageRate;
  this.baseFireDamageRate = userBase.baseFireDamageRate;
  this.baseFrostDamageRate = userBase.baseFrostDamageRate;
  this.baseArcaneDamageRate = userBase.baseArcaneDamageRate;
  this.baseResistAll = userBase.baseResistAll;
  this.baseResistFire = userBase.baseResistFire;
  this.baseResistFrost = userBase.baseResistFrost;
  this.baseResistArcane = userBase.baseResistArcane;
  this.baseReductionAll = userBase.baseReductionAll;
  this.baseReductionFire = userBase.baseReductionFire;
  this.baseReductionFrost = userBase.baseReductionFrost;
  this.baseReductionArcane = userBase.baseReductionArcane;

  this.level = 1;
  this.exp = exp;

  this.conditions = {};
  this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = false;
  this.conditions[gameConfig.USER_CONDITION_CHILL] = false;
  this.conditions[gameConfig.USER_CONDITION_FREEZE] = false;
  this.conditions[gameConfig.USER_CONDITION_SILENCE] = false;
  this.conditions[gameConfig.USER_CONDITION_IGNITE] = false;
  this.conditions[gameConfig.USER_CONDITION_BLUR] = false;

  this.buffList = [];
  this.passiveList = [];

  //current stat
  this.maxHP = 0;  this.maxMP = 0;  this.HP = 0;  this.MP = 0;  this.HPRegen = 0;
  this.moveSpeed = 0; this.rotateSpeed = 0;
  this.MPRegen = 0;  this.moveSpeed = 0;  this.rotateSpeed = 0;  this.castSpeed = 0;
  this.damage = 0;  this.fireDamage = 0;  this.frostDamage = 0;  this.arcaneDamage = 0;
  this.damageRate = 0; this.fireDamageRate = 0; this.frostDamageRate = 0; this.arcaneDamageRate = 0;
  this.resistAll = 0;  this.resistFire = 0;  this.resistFrost = 0;  this.resistArcane = 0;
  this.reductionAll = 0;  this.reductionFire = 0;  this.reductionFrost = 0;  this.reductionArcane = 0;

  this.baseSkill = 0;
  this.equipSkills = [];
  this.possessSkills = [];

  this.socketID = socketID;

  this.currentSkill = undefined;

  this.buffUpdateInterval = false;
  this.regenInterval = false;

  this.onSkillUpgrade = new Function();
  this.onBuffExchange = new Function();
  this.onChangeStat = new Function();
  this.onDeath = new Function();

  this.getExp(0);
  this.initStat();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

User.prototype.setSkills = function(baseSkill, equipSkills, possessSkills){
  this.baseSkill = baseSkill;
  this.equipSkills = equipSkills;
  this.possessSkills = possessSkills;
};
//init user current stat
User.prototype.initStat = function(){
  this.Might = this.baseMight;
  this.Intellect = this.baseIntellect;
  this.Perception = this.basePerception;

  this.maxHP = this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.Might;
  this.maxMP = this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.Intellect;
  this.HPRegen = this.baseHPRegen + this.maxHP * this.baseHPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.Might;
  this.MPRegen = this.baseMPRegen + this.maxMP * this.baseMPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.Intellect;
  this.castSpeed = this.baseCastSpeed;
  this.damage = this.baseDamage;
  this.fireDamage = this.baseFireDamage;
  this.frostDamage = this.baseFrostDamage;
  this.arcaneDamage = this.baseArcaneDamage;
  this.damageRate = this.baseDamageRate;
  this.fireDamageRate = this.baseFireDamageRate;
  this.frostDamageRate = this.baseFrostDamageRate;
  this.arcaneDamageRate = this.baseArcaneDamageRate;
  this.resistAll = this.baseResistAll;
  this.resistFire = this.baseResistFire;
  this.resistFrost = this.baseResistFrost;
  this.resistArcane = this.baseResistArcane;
  this.reductionAll = this.baseReductionAll;
  this.reductionFire = this.baseReductionFire;
  this.reductionFrost = this.baseReductionFrost;
  this.reductionArcane = this.baseReductionArcane;

  this.HP = this.maxHP;
  this.MP = this.maxMP;

  this.moveSpeed = this.baseMoveSpeed;
  this.rotateSpeed = this.baseRotateSpeed;

  this.setMaxSpeed(this.moveSpeed);
  this.setRotateSpeed(this.rotateSpeed);
};
User.prototype.updateStatAndCondition = function(){
  var additionalMight = 0, additionalIntellect = 0, additionalPerception = 0,
      additionalMaxHP = 0, additionalMaxMP = 0, additionalMaxHPRate = 100, additionalMaxMPRate = 100,
      additionalHPRegen = 0, additionalHPRegenRate = 0, additionalMPRegen = 0, additionalMPRegenRate = 0,
      additionalMoveSpeedRate = 100, additionalRotateSpeedRate = 100, additionalCastSpeedRate = 0,
      additionalDamage = 0, additionalFireDamage = 0, additionalFrostDamage = 0, additionalArcaneDamage = 0,
      additionalDamageRate = 100, additionalFireDamageRate = 100, additionalFrostDamageRate = 100, additionalArcaneDamageRate = 100,
      additionalResistAll = 0, additionalResistFire = 0, additionalResistFrost = 0, additionalResistArcane = 0,
      additionalReductionAll = 0, additionalReductionFire = 0, additionalReductionFrost = 0, additionalReductionArcane = 0;

  var additionalHP = 0; additionalMP = 0;

  var disperBuffCount = 0;
  var disperDebuffCount = 0;
  var disperAllCount = 0;

  var beforeConditionImmortal = this.conditions[gameConfig.USER_CONDITION_IMMORTAL];
  var beforeConditionChill = this.conditions[gameConfig.USER_CONDITION_CHILL];
  var beforeConditionFreeze = this.conditions[gameConfig.USER_CONDITION_FREEZE];
  var beforeConditionSilence = this.conditions[gameConfig.USER_CONDITION_SILENCE];
  var beforeConditionIgnite = this.conditions[gameConfig.USER_CONDITION_IGNITE];
  var beforeConditionBlur = this.conditions[gameConfig.USER_CONDITION_BLUR];

  this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = false;
  this.conditions[gameConfig.USER_CONDITION_CHILL] = false;
  this.conditions[gameConfig.USER_CONDITION_FREEZE] = false;
  this.conditions[gameConfig.USER_CONDITION_SILENCE] = false;
  this.conditions[gameConfig.USER_CONDITION_IGNITE] = false;
  this.conditions[gameConfig.USER_CONDITION_BLUR] = false;

  var buffList = [];
  //set passive buffs
  for(var i=0; i<this.passiveList.length; i++){
    var buffs = util.findAndSetBuffs(this.passiveList[i], buffTable, this.objectID);
    for(var j=0; j<buffs.length; j++){
      buffList.push(buffs[j]);
    }
  }
  var beforeBuffListLength = this.buffList.length;
  for(var i=this.buffList.length-1; i>=0; i--){
    if(Date.now() - this.buffList[i].startTime > this.buffList[i].buffLifeTime){
      this.buffList.splice(i, 1);
    }else{
      var buffs = util.findAndSetBuffs(this.buffList[i], buffTable, this.buffList[i].actorID);
      for(var j=0; j<buffs.length; j++){
        if(Date.now() - this.buffList[i].tickStartTime > buffs[j].buffTickTime){
          buffList.push(buffs[j]);
          this.buffList[i].tickStartTime = Date.now();
        }
      }
    }
  }
  var buffIndex = buffList.length;
  if(buffIndex > 0){
    while(buffIndex--){
      // skillData.buffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'buffToSelf', 3, user.objectID);
      switch (buffList[buffIndex].buffType) {
        case serverConfig.BUFF_TYPE_ADD_STAT:
          if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_MIGHT){
            additionalMight += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_INTELLECT){
            additionalIntellect += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_PERCEPTION){
            additionalPerception += buffList[buffIndex].buffAmount;
          }else{
            console.log('check buff index : ' + buffList[buffIndex]);
          }
          break;
        case serverConfig.BUFF_TYPE_ADD_SECONDARY_STAT:
          if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_HP){
            additionalMaxHP += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_MP){
            additionalMaxMP += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_HP_RATE){
            additionalMaxHPRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_MP_RATE){
            additionalMaxMPRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_HP_REGEN){
            additionalHPRegen += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_HP_REGEN_RATE){
            additionalHPRegenRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MP_REGEN){
            additionalMPRegen += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MP_REGEN_RATE){
            additionalMPRegenRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MOVE_SPEED_RATE){
            //add MoveSpeed and RotateSpeed
            additionalMoveSpeedRate += buffList[buffIndex].buffAmount;
            additionalRotateSpeedRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_CAST_SPEED_RATE){
            additionalCastSpeedRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE){
            additionalDamage += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE){
            additionalFireDamage += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE){
            additionalFrostDamage += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE){
            additionalArcaneDamage += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE_RATE){
            additionalDamageRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE_RATE){
            additionalFireDamageRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE_RATE){
            additionalFrostDamageRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE_RATE){
            additionalArcaneDamageRate += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_ALL){
            additionalResistAll += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_FIRE){
            additionalResistFire += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_FROST){
            additionalResistFrost += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_ARCANE){
            additionalResistArcane += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_ALL){
            additionalReductionAll += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_FIRE){
            additionalReductionFire += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_FROST){
            additionalReductionFrost += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_ARCANE){
            additionalReductionArcane += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE_RATE_BY_LIFE){
            var rateOfLife = 100 - (this.HP/this.maxHP) * 100;
            var rate = parseInt(rateOfLife / buffList[buffIndex].buffApplyHPTickPercent);
            additionalDamage += rate * buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MOVE_SPEED_BY_LIFE){
            var rateOfLife = 100 - (this.HP/this.maxHP) * 100;
            var rate = parseInt(rateOfLife / buffList[buffIndex].buffApplyHPTickPercent);
            additionalMoveSpeedRate += rate * buffList[buffIndex].buffAmount;
            additionalRotateSpeedRate += rate * buffList[buffIndex].buffAmount;
          }else{
            console.log('check buff index : ' + buffList[buffIndex]);
          }
          break;
        case serverConfig.BUFF_TYPE_HEAL:
          if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_HP){
            additionalHP += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_HP_RATE){
            additionalHP += this.maxHP * buffList[buffIndex].buffAmount/100;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_MP){
            additionalMP += buffList[buffIndex].buffAmount/100;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_MP_RATE){
            additionalMP += this.maxMP * buffList[buffIndex].buffAmount/100;
          }else{
            console.log('check buff index : ' + buffList[buffIndex]);
          }
          break;
        case serverConfig.BUFF_TYPE_DISPEL:
          if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_BUFF){
            disperBuffCount += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_DEBUFF){
            disperDebuffCount += buffList[buffIndex].buffAmount;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_ALL){
            disperAllCount += buffList[buffIndex].buffAmount;
          }else{
            console.log('check buff index : ' + buffList[buffIndex]);
          }
          break;
        case serverConfig.BUFF_TYPE_SET_CONDITION:
          if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_IMMORTAL){
            this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = buffList[buffIndex].actorID;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_CHILL){
            this.conditions[gameConfig.USER_CONDITION_CHILL] = buffList[buffIndex].actorID;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_FREEZE){
            this.conditions[gameConfig.USER_CONDITION_FREEZE] = buffList[buffIndex].actorID;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_SILENCE){
            this.conditions[gameConfig.USER_CONDITION_SILENCE] = buffList[buffIndex].actorID;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_IGNITE){
            this.conditions[gameConfig.USER_CONDITION_IGNITE] = buffList[buffIndex].actorID;
          }else if(buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_BLUR){
            this.conditions[gameConfig.USER_CONDITION_BLUR] = buffList[buffIndex].actorID;
          }else{
            console.log('check buff index : ' + buffList[buffIndex]);
          }
          break;
        default:
          console.log('check buff index : ' + buffList[buffIndex]);
          break;
      }
    }
  }

  //disper apply
  for(var i=0; i<disperBuffCount; i++){
    if(this.buffList.length){
      for(var j=0; j<this.buffList.length; j++){
        if(this.buffList[j].isBuff){
          this.buffList.splice(j, 1);
          break;
        }
      }
    }else{
      break;
    }
  }
  for(var i=0; i<disperDebuffCount; i++){
    if(this.buffList.length){
      for(var j=0; j<this.buffList.length; j++){
        if(!this.buffList[j].isBuff){
          this.buffList.splice(j, 1);
          break;
        }
      }
    }else{
      break;
    }
  }
  for(var i=0; i<disperAllCount; i++){
    if(this.buffList.length){
      this.buffList.splice[0, 1];
    }else{
      break;
    }
  }

  this.might = this.baseMight + additionalMight;
  this.intellect = this.baseIntellect + additionalIntellect;
  this.perception = this.basePerception + additionalPerception;

  var beforeMaxHP = this.maxHP;
  var beforeMaxMP = this.maxMP;
  var beforeHP = this.HP;
  var beforeMP = this.MP;
  var beforeCastSpeed = this.castSpeed;
  var beforeMoveSpeed = this.moveSpeed;
  var beforeRotateSpeed = this.rotateSpeed;

  this.maxHP = (this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.might + additionalMaxHP) * additionalMaxHPRate/100;
  this.maxMP = (this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.intellect + additionalMaxMP) * additionalMaxMPRate/100;
  var HPRegenRate = this.baseHPRegenRate + additionalHPRegenRate;
  var MPRegenRate = this.baseMPRegenRate + additionalMPRegenRate;
  this.HPRegen = this.baseHPRegen + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.might + additionalHPRegen + this.maxHP * HPRegenRate/100;
  this.MPRegen = this.baseMPRegen + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.intellect + additionalMPRegen + this.maxMP * MPRegenRate/100;
  this.castSpeed = this.baseCastSpeed + additionalCastSpeedRate;
  this.damage = this.baseDamage + additionalDamage;
  this.fireDamage = this.baseFireDamage + additionalFireDamage;
  this.frostDamage = this.baseFrostDamage + additionalFrostDamage;
  this.arcaneDamage = this.baseArcaneDamage + additionalArcaneDamage;
  this.damageRate = this.baseDamageRate + additionalDamageRate;
  this.fireDamageRate = this.baseFireDamageRate + additionalFireDamageRate;
  this.frostDamageRate = this.baseFrostDamageRate + additionalFrostDamageRate;
  this.arcaneDamageRate = this.baseArcaneDamageRate + additionalArcaneDamageRate;
  this.resistAll = this.baseResistAll + additionalResistAll;
  this.resistFire = this.baseResistFire + additionalResistFire;
  this.resistFrost = this.baseResistFrost + additionalResistFrost;
  this.resistArcane = this.baseResistArcane + additionalResistArcane;
  this.reductionAll = this.baseReductionAll + additionalReductionAll;
  this.reductionFire = this.baseReductionFire + additionalReductionFire;
  this.reductionFrost = this.baseReductionFrost + additionalReductionFrost;
  this.reductionArcane = this.baseReductionArcane + additionalReductionArcane;

  this.moveSpeed = this.baseMoveSpeed * additionalMoveSpeedRate/100;
  this.rotateSpeed = this.baseRotateSpeed * additionalRotateSpeedRate/100;

  if(additionalHP){
    this.healHP(additionalHP);
  }
  if(additionalMP){
    this.healMP(additionalMP);
  }

  this.setMaxSpeed(this.moveSpeed);
  this.setRotateSpeed(this.rotateSpeed);

  if( beforeConditionImmortal !== this.conditions[gameConfig.USER_CONDITION_IMMORTAL] || beforeConditionChill !== this.conditions[gameConfig.USER_CONDITION_CHILL] ||
      beforeConditionFreeze !== this.conditions[gameConfig.USER_CONDITION_FREEZE] || beforeConditionSilence !== this.conditions[gameConfig.USER_CONDITION_SILENCE] ||
      beforeConditionIgnite !== this.conditions[gameConfig.USER_CONDITION_IGNITE] || beforeConditionBlur !== this.conditions[gameConfig.USER_CONDITION_BLUR] ||
      beforeMaxHP !== this.maxHP  || beforeMaxMP !== this.maxMP  ||
      beforeHP !== this.HP || beforeMP !== this.MP || beforeCastSpeed !== this.castSpeed || beforeMoveSpeed !== this.moveSpeed || beforeRotateSpeed !== this.rotateSpeed){
        this.onChangeStat(this);
  }
  if( beforeBuffListLength !== this.buffList.length){
    this.onBuffExchange(this);
  }
};
User.prototype.regenHPMP = function(){
  this.healHP(this.HPRegen);
  this.healMP(this.MPRegen);
};
User.prototype.igniteHP = function(attackUserID){
  var igniteDamage = this.maxHP * serverConfig.IGNITE_DAMAGE_RATE/100;
  console.log('ignite ' + this.objectID + ' : ' + igniteDamage);
  this.takeDamage(attackUserID, igniteDamage);
  // this.takeDamage(igniteDamage);
};
User.prototype.buffUpdate = function(){
  if(!this.buffUpdateInterval){
    this.buffUpdateInterval = setInterval(buffUpdateHandler.bind(this), INTERVAL_TIMER);
  }
  if(!this.regenInterval){
    this.regenInterval = setInterval(regenIntervalHandler.bind(this), serverConfig.USER_REGEN_TIMER);
  }
};
function buffUpdateHandler(){
  this.updateStatAndCondition();
};
function regenIntervalHandler(){
  this.regenHPMP();
  if(this.conditions[gameConfig.USER_CONDITION_IGNITE]){
    this.igniteHP(this.conditions[gameConfig.USER_CONDITION_IGNITE]);
  }
};
User.prototype.addBuff = function(buffGroupIndex, actorID){
  //check apply rate with resist
  var buffGroupData = util.findData(buffGroupTable, 'index', buffGroupIndex);
  if(buffGroupData){
    var isApply = false;
    var rate = Math.floor(Math.random() * 101);
    if(buffGroupData.buffApplyRate > rate){
      isApply = true;
      buffGroupData.actorID = actorID;
    }
    //set duration and startTime
    //if duplicate condition, set as later condition buff. delete fore buff and debuff
    //set buffTickTime
    if(isApply){
      buffGroupData.startTime = Date.now();
      buffGroupData.tickStartTime = Date.now();
      this.buffList.push(buffGroupData);
    }
  }
  this.onBuffExchange(this);
};
//Instantiate base attack
User.prototype.changeEquipSkills = function(newSkillList){
  var skillList = [];
  //validate skill
  for(var i=0; i<newSkillList.length; i++){
    for(var j=0; j<possessSkills.length; j++){
      if(newSkillList[i] === possessSkills[j]){
        skillList.push(newSkillList[i]);
      }
    }
  }
  this.equipSkills = skillList;
};
User.prototype.getSkill = function(index){
  //check skill possession
  var skillData = util.findData(skillTable, 'index', index);
  var possessSkill = false;
  for(var i=0; i<this.possessSkills.length; i++){
    var tempSkillData = util.findData(skillTable, 'index', this.possessSkills[i]);
    if(skillData.groupIndex === tempSkillData.groupIndex){
      possessSkill = tempSkillData;
      break;
    }
  }
  //check possible levelup
  if(!possessSkill){
    this.possessSkills.push(skillData.index);
    return this.possessSkills;
  }else{
    if(possessSkill.nextSkillIndex !== -1){
      var changeSkillIndex = this.possessSkills.indexOf(possessSkill.index);
      if(changeSkillIndex === -1){
        console.log('cant find skill index at possess skill array');
        return this.possessSkills;
      }else{
        this.possessSkills[changeSkillIndex] = possessSkill.nextSkillIndex;
        console.log('level up skill' + possessSkill.index);
        console.log('currentPossessSkills');
        console.log(this.possessSkills);
        return this.possessSkills;
      }
    }else{
      //do nothing
      console.log('skill reach max level');
    }
  }
};
User.prototype.upgradeSkill = function(skillIndex){
  //check possess skill
  var isBaseSkill = false;
  var isPossession = false;
  if(this.baseSkill === skillIndex){
    isBaseSkill = true;
  }
  for(var i=0; i<this.possessSkills.length; i++){
    if(this.possessSkills[i] === skillIndex){
      isPossession = true;
    }
  }
  if(isBaseSkill || isPossession){
    var skillData = util.findData(skillTable, 'index', skillIndex);
    var nextSkillIndex = skillData.nextSkillIndex;
    if(nextSkillIndex !== -1){
      if(isBaseSkill){
        this.baseSkill = nextSkillIndex;
        this.onSkillUpgrade(skillIndex, nextSkillIndex);
      }else if(isPossession){
        var index = this.possessSkills.indexOf(skillIndex);
        this.possessSkills.splice(index, 1);
        this.possessSkills.push(nextSkillIndex);
        this.onSkillUpgrade(skillIndex, nextSkillIndex);
      }
    }
  }else{
    console.log('dont possess skill : ' + skillIndex);
  }
  this.onBuffExchange(this);
};
User.prototype.exchangePassive = function(beforeBuffGID, afterBuffGID){
  var beforeBuffGroupDate = util.findData(buffGroupTable, 'index', beforeBuffGID);
  var afterBuffGroupDate = util.findData(buffGroupTable, 'index', afterBuffGID);
  for(var i=0; i<this.passiveList.length; i++){
    if(this.passiveList[i].index === beforeBuffGroupDate.index){
      var index = i;
      break;
    }
  }
  if(index >= 0){
    this.passiveList.splice(index, 1);
  }
  if(afterBuffGroupDate){
    this.passiveList.push(afterBuffGroupDate);
  }
  this.onBuffExchange(this);
}
User.prototype.equipPassive = function(buffIndex){
  var buffGroupData = util.findData(buffGroupTable, 'index', buffIndex);
  this.passiveList.push(buffGroupData);
  this.onBuffExchange(this);
};
User.prototype.unequipPassive = function(buffIndex){
  var buffGroupData = util.findData(buffGroupTable, 'index', buffIndex);
  for(var i=0; i<this.passiveList.length; i++){
    if(this.passiveList[i].index === buffGroupData.index){
      var index = i;
      break;
    }
  }
  if(index >= 0){
    this.passiveList.splice(index, 1);
  }
  this.onBuffExchange(this);
};
User.prototype.stop = function(){
  if(this.updateInterval){
    clearInterval(this.updateInterval);
    this.updateInterval = false;
  }
  if(this.currentSkill){
    this.currentSkill = undefined;
  }
};
User.prototype.takeDamage = function(attackUserID, fireDamage, frostDamage, arcaneDamage, damageToMP){
  var dmg = 0;
  var dmgToMP = 0;
  if(!isNaN(fireDamage)){
    var dmgFire = fireDamage * (1 - this.resistAll/100) * (1 - this.resistFire/100) - (this.reductionAll + this.reductionFire);
    dmg += dmgFire;
  }
  if(!isNaN(frostDamage)){
    var dmgFrost = frostDamage * (1 - this.resistAll/100) * (1 - this.resistFrost/100) - (this.reductionAll + this.reductionFrost);
    dmg += dmgFrost;
  }
  if(!isNaN(arcaneDamage)){
    var dmgArcane = arcaneDamage * (1 - this.resistAll/100) * (1 - this.resistArcane/100) - (this.reductionAll + this.reductionArcane);
    dmg += dmgFrost;
    if(!isNaN(damageToMP)){
      dmgToMP = damageToMP;
    }
  }
  if(dmg < 0){
    //minimum damage
    dmg = 1;
  }

  this.HP -= dmg;
  console.log(this.objectID + ' : ' + this.HP);
  if(dmgToMP > 0){
    this.takeDamageToMP(dmgToMP);
  }
  if(this.HP <= 0){
    this.death(attackUserID);
  }
};
// User.prototype.takeDamage = function(attackUserID, dmg){
//   console.log(this);
//   this.HP -= dmg;
//   console.log(this.objectID + ' : ' + this.HP);
//   if(this.HP <= 0){
//     this.death(attackUserID);
//   }
// };
User.prototype.consumeMP = function(mpAmount){
  this.MP -= mpAmount;
  if(this.MP < 0){
    this.MP = 0;
  }
};
User.prototype.takeDamageToMP = function(dmgToMP){
  if(dmgToMP > 0){
    this.MP -= dmgToMP;
  }
  if(this.MP < 0){
    this.MP = 0;
  }
};
User.prototype.healHPMP = function(hpAmount, mpAmount){
  var beforeHP = this.HP;
  var beforeMP = this.MP;
  if(!isNaN(hpAmount)){
    this.healHP(hpAmount);
  }
  if(!isNaN(mpAmount)){
    this.healMP(mpAmount)
  }
  if(beforeHP !== this.HP || beforeMP !== this.MP){
    this.onChangeStat(this);
  }
};
User.prototype.healHP = function(amount){
  if(this.maxHP < this.HP + amount){
    this.HP = this.maxHP;
  }else{
    this.HP += amount;
  }
};
User.prototype.healMP = function(amount){
  if(this.maxMP < this.MP + amount){
    this.MP = this.maxMP;
  }else{
    this.MP += amount;
  }
};
User.prototype.death = function(attackUserID){
  //calculate exp to attacker
  console.log(this.objectID + ' is dead by ' + attackUserID);
  var exp = this.level *  10000;
  this.onDeath(attackUserID, exp, this);
};


User.prototype.getExp = function(exp){
  this.exp += exp;
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);
  if(userLevelData.needExp === -1){
    console.log('user reach max level');
  }else if(this.exp >= userLevelData.needExp){
    this.levelUp();
  }
};
User.prototype.levelUp = function(){
  this.level ++;
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);
  console.log('level up to ' + this.level);
  //add levelBonus
  //additional level up check.
  this.updateUserBaseStat();
  this.restoreWhenLevelUp();
  this.getExp(0);
};

//execute when level up or down
User.prototype.updateUserBaseStat = function(){
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);

  this.baseMight = userLevelData.might;
  this.baseIntellect = userLevelData.intellect;
  this.basePerception = userLevelData.perception;
};
User.prototype.restoreWhenLevelUp = function(){
  var healHPAmount = this.maxHP * serverConfig.USER_LEVEL_UPGRADE_RESTORE_RATE / 100;
  var healMPAmount = this.maxMP * serverConfig.USER_LEVEL_UPGRADE_RESTORE_RATE / 100;
  this.healHPMP(healHPAmount, healMPAmount);
};

module.exports = User;
