// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');
var csvJson = require('../../modules/public/csvjson.js');
var dataJson = require('../../modules/public/data.json');

var csvJsonOption = {delimiter : ',', quote : '"'};
var userStatTable = csvJson.toObject(dataJson.userStatData, csvJsonOption);
var skillTable = csvJson.toObject(dataJson.skillData, csvJsonOption);
var buffGroupTable = csvJson.toObject(dataJson.buffGroupData, csvJsonOption);
var resourceTable = csvJson.toObject(dataJson.resourceData, csvJsonOption);
var iconResourceTable = csvJson.toObject(dataJson.iconResourceData, csvJsonOption);
var obstacleTable = csvJson.toObject(dataJson.obstacleData, csvJsonOption);
var effectGroupTable = csvJson.toObject(dataJson.effectGroupData, csvJsonOption);

var socket;

// document elements
// var startScene, gameScene, standingScene;
// var startButton;

var CUIManager = require('../../modules/client/CUIManager.js');
var UIManager;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/gameConfig.FPS;
var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

// game var
var Manager;

// resource var
var resources;
var loadedResourcesCount = 0;
var resourceObject, resourceCharacter, resourceUI, resourceSkillEffect, resourceSkillIcon;

var userHandImgData = new Array(5);
var objGoldImgData, objJewelImgData, objSkillFireImgData, objSkillFrostImgData, objSkillArcaneImgData;
var castFireImgData, castFrostImgData, castArcaneImgData;
var projectileFireImgData, projectileFrostImgData, projectileArcaneImgData;
var skillFireImgData, skillFrostImgData, skillArcaneImgData;
var projectileSkillArrowImgData;
// var conditionFreezeImgData, conditionChillImgData, conditionImmortalImgData, conditionSilenceImgData,
//     conditionIgnite1ImgData, conditionIgnite2ImgData, conditionIgnite3ImgData, conditionIgnite4ImgData, conditionIgnite5ImgData;
// var userImage, userHand;
// var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = stateFuncLoad;
var gameUpdateFunc = null;

var latency = 0;
var drawInterval = false;
var userDataUpdateInterval = false;

//draw skills range, explosionRadius.
var drawMode = gameConfig.DRAW_MODE_NORMAL;
//use when draw mode skill.
var mousePoint = {x : 0, y : 0};
var currentSkillData = null;

var characterType = 1;

var firoBaseSkill = gameConfig.SKILL_INDEX_FIRO_BASE, firoInherentPassiveSkill = gameConfig.SKILL_INDEX_FIRO_PASSIVE, firoEquipSkills = new Array(4),
    freezerBaseSkill = gameConfig.SKILL_INDEX_FROST_BASE, freezerInherentPassiveSkill = gameConfig.SKILL_INDEX_FROST_PASSIVE, freezerEquipSkills = new Array(4),
    mysterBaseSkill = gameConfig.SKILL_INDEX_ARCANE_BASE, mysterInherentPassiveSkill = gameConfig.SKILL_INDEX_ARCANE_PASSIVE, mysterEquipSkills = new Array(4);

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

var killUser = null;
//state changer
function changeState(newState){
  clearInterval(drawInterval);
  clearInterval(userDataUpdateInterval);
  drawInterval = false;
  userDataUpdateInterval = false;

  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = stateFuncLoad;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncStandby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = stateFuncStart;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncGame;
      break;
    case gameConfig.GAME_STATE_END:
      gameState = newState;
      gameSetupFunc = stateFuncEnd;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_RESTART_SCENE:
      gameState = newState;
      gameSetupFunc = null;
      gameUpdateFunc = stateFuncStandbyRestart;
      break;
    case gameConfig.GAME_STATE_RESTART:
      gameState = newState;
      gameSetupFunc = stateFuncRestart;
      gameUpdateFunc = null;
      break;
  }
  update();
};

function update(){
  if(gameSetupFunc === null && gameUpdateFunc !== null){
    drawInterval = setInterval(gameUpdateFunc,fps);
  }else if(gameSetupFunc !==null && gameUpdateFunc === null){
    gameSetupFunc();
  }
};

//load resource, base setting
function stateFuncLoad(){
  setBaseSetting();
  setCanvasSize();
  window.oncontextmenu = function(){
    return false;
  };
  window.onresize = function(){
    setCanvasSize();
  };
  // UIManager.setSkillChangeBtn();
  // loadResources();
  // UIManager.setSkillIconResource(resourceSkillIcon);
};
//when all resource loaded. just draw start scene
function stateFuncStandby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function stateFuncStart(){
  UIManager.disableStartScene();
  setupSocket();
  socket.emit('reqStartGame', characterType);
};
//game play on
function stateFuncGame(){
  drawGame();
};
//show end message and restart button
function stateFuncEnd(){
  //should init variables
  updateCharTypeSkill(characterType);

  canvasDisableEvent();
  documentDisableEvent();
  if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  };
  setTimeout(function(){
    UIManager.playDeadScene(killUser);
  }, gameConfig.DEAD_SCENE_PLAY_DELAY_TIME);
  setTimeout(function(){
    UIManager.disableDeadScene();
    UIManager.initStandingScene(characterType);
    UIManager.setPopUpSkillChange(true);

    changeState(gameConfig.GAME_STATE_RESTART_SCENE);
  }, gameConfig.DEAD_SCENE_PLAY_TIME);
};
function stateFuncStandbyRestart(){
  drawRestartScene();
}
function stateFuncRestart(){
  UIManager.disableStandingScene();
  socket.emit('reqRestartGame', characterType, equipSkills);
};
//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  UIManager = new CUIManager(skillTable, buffGroupTable, iconResourceTable);
  UIManager.onStartBtnClick = function(charType, clickButton){
    characterType = charType;
    if(clickButton === gameConfig.START_BUTTON){
      changeState(gameConfig.GAME_STATE_GAME_START);
    }else if(clickButton === gameConfig.RESTART_BUTTON){
      changeState(gameConfig.GAME_STATE_RESTART);
    }
  };
  UIManager.onSkillUpgrade = function(skillIndex){
    socket.emit('upgradeSkill', skillIndex);
  };
  UIManager.onExchangeSkill = function(charType){
    updateCharTypeSkill(charType);
  };
  UIManager.onExchangePassive = function(beforeBuffGID, afterBuffGID){
    socket.emit('exchangePassive', beforeBuffGID, afterBuffGID);
  };
  UIManager.onEquipPassive = function(buffGroupIndex){
    console.log('equip Passive : ' + buffGroupIndex);
    socket.emit('equipPassive', buffGroupIndex);
  };
  UIManager.onUnequipPassive = function(buffGroupIndex){
    console.log('unequip Passive : ' + buffGroupIndex);
    socket.emit('unequipPassive', buffGroupIndex);
  };
  UIManager.onSkillIconClick = function(skillSlot){
    if(skillSlot === gameConfig.SKILL_BASIC_INDEX){
      // if(UIManager.checkCooltime(gameConfig.SKILL_BASIC_INDEX)){
      var skillData = Object.assign({}, baseSkillData);
      // }
    }else if(skillSlot === gameConfig.SKILL_EQUIP1_INDEX){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP1_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[0]);
      // }
    }else if(skillSlot === gameConfig.SKILL_EQUIP2_INDEX){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP2_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[1]);
      // }
    }else if(skillSlot === gameConfig.SKILL_EQUIP3_INDEX){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP3_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[2]);
      // }
    }else if(skillSlot === gameConfig.SKILL_EQUIP4_INDEX){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP4_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[3]);
      // }
    }
    checkSkillConditionAndUse(skillData);
  };
  UIManager.onSelectSkillCancelBtnClick = function(){
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  };
  UIManager.onSelectCharIcon = function(type){
    characterType = type;
    switch (type) {
      case gameConfig.CHAR_TYPE_FIRE:
        baseSkill = firoBaseSkill;
        for(var i=0; i<4; i++){
          equipSkills[i] = firoEquipSkills[i]
        }
        inherentPassiveSkill = firoInherentPassiveSkill;
        break;
      case gameConfig.CHAR_TYPE_FROST:
        baseSkill = freezerBaseSkill;
        for(var i=0; i<4; i++){
          equipSkills[i] = freezerEquipSkills[i]
        }
        inherentPassiveSkill = freezerInherentPassiveSkill;
        break;
      case gameConfig.CHAR_TYPE_ARCANE:
        baseSkill = mysterBaseSkill;
        for(var i=0; i<4; i++){
          equipSkills[i] = mysterEquipSkills[i]
        }
        inherentPassiveSkill = mysterInherentPassiveSkill;
        break;
      default:
    }
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', baseSkill));
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', inherentPassiveSkill));
    for(var i=0; i<4; i++){
      if(equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };
    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setPopUpSkillChange(true);
  };
  // UIManager.initStartScene();
  // UIManager.initHUD();
  // UIManager.initPopUpSkillChanger();

  document.body.onmousedown = function(e){
    if(e.button === 2){
      if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
        changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
      }
    }
  };

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);
  Manager.onSkillFire = onSkillFireHandler;
  Manager.onProjectileSkillFire = onProjectileSkillFireHandler;
  Manager.onCancelCasting = onCancelCastingHandler;
  // resource 관련
  resources = require('../../modules/public/resources.json');

  resourceObject = new Image()
  resourceCharacter = new Image();
  resourceUI = new Image();
  resourceSkillEffect = new Image();
  resourceSkillIcon = new Image();

  userHandImgData[0] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_1));
  userHandImgData[1] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_2));
  userHandImgData[2] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_3));
  userHandImgData[3] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_4));
  userHandImgData[4] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_5));

  objGoldImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_GOLD));
  objJewelImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_JEWEL));
  objSkillFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_FIRE));
  objSkillFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_FROST));
  objSkillArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_ARCANE));

  castFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_FIRE));
  castFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_FROST));
  castArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_ARCANE));

  projectileFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_FIRE));
  projectileFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_FROST));
  projectileArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_ARCANE));

  skillFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_FIRE));
  skillFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_FROST));
  skillArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_ARCANE));

  projectileSkillArrowImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_SKILL_ARROW));
  // conditionFreezeImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_FREEZE));
  // conditionChillImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_CHILL));
  // conditionImmortalImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IMMORTAL));
  // conditionSilenceImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_SILENCE));
  // conditionIgnite1ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE1));
  // conditionIgnite2ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE2));
  // conditionIgnite3ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE3));
  // conditionIgnite4ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE4));
  // conditionIgnite5ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE5));
  // grid = new Image();
  // grid.src = resources.GRID_SRC;
  loadResources();
  UIManager.setSkillIconResource(resourceSkillIcon);
  UIManager.initStartScene();
  UIManager.initHUD();
  UIManager.initPopUpSkillChanger();
  UIManager.setSkillChangeBtn();
};
function loadResources(){
  resourceObject.src = gameConfig.RESOURCE_SRC_OBJECT;
  resourceObject.onload = loadResourceHandler;
  resourceCharacter.src = gameConfig.RESOURCE_SRC_CHARACTER;
  resourceCharacter.onload = loadResourceHandler;
  resourceSkillEffect.src = gameConfig.RESOURCE_SRC_SKILL_EFFECT;
  resourceSkillEffect.onload = loadResourceHandler;
  resourceSkillIcon.src = gameConfig.RESOURCE_SRC_SKILL_ICON;
  resourceSkillIcon.onload = loadResourceHandler;
};
function loadResourceHandler(){
  loadedResourcesCount++;
  if(loadedResourcesCount >= gameConfig.RESOURCES_COUNT){
    changeState(gameConfig.GAME_STATE_START_SCENE);
  }
};
function onSkillFireHandler(rawSkillData, syncFireTime){
  var skillData = Manager.processSkillData(rawSkillData);
  skillData.syncFireTime = syncFireTime;
  socket.emit('skillFired', skillData);
};
function onProjectileSkillFireHandler(rawProjectileDatas, syncFireTime){
  var projectileDatas = Manager.processProjectileData(rawProjectileDatas);
  console.log(rawProjectileDatas);
  socket.emit('projectilesFired', projectileDatas, syncFireTime);
};
function onCancelCastingHandler(){
  var userData = Manager.processUserData();
  socket.emit('castCanceled', userData);
};
function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  setCanvasScale(gameConfig);
};

function drawStartScene(){
  UIManager.drawStartScene();
};

function drawGame(){
  UIManager.drawGameScene();

  var startTime = Date.now();

  gameConfig.userOffset = calcOffset();

  drawScreen();
  drawBackground();
  drawGrid();
  drawObjs();
  drawUserEffect();
  drawUsers();
  drawObstacles();
  drawChests();
  drawEffect();
  drawProjectile();
  drawRiseText();
  if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawSkillRange();
  }
  // console.log(Date.now() - startTime);
};

function drawRestartScene(){
  UIManager.drawRestartScene();
};

// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('connect', function(){
    console.log('connection to the server');
  });
  socket.on('disconnect', function(){
    console.log('disconnected');
    changeState(gameConfig.GAME_STATE_RESTART_SCENE);
  });
  socket.on('pong', function(lat){
    latency = lat;
  });

  socket.on('syncAndSetSkills', function(user){
    //synchronize user
    var startTime = Date.now();
    gameConfig.userID = user.objectID;
    // gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);

    baseSkill = user.baseSkill;
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', user.baseSkill));
    inherentPassiveSkill = user.inherentPassiveSkill;
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', user.inherentPassiveSkill));
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkills[i] = user.equipSkills[i];
      }else{
        equipSkills[i] = undefined;
      }
    }
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', user.equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };

    possessSkills = user.possessSkills;

    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setHUDSkills();
    UIManager.updateBuffIcon();
    UIManager.setHUDStats(user.statPower, user.statMagic, user.statSpeed);
    UIManager.setCooldownReduceRate(user.cooldownReduceRate);
    UIManager.setPopUpSkillChange();

    UIManager.setUserPosition(user.position);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, objDatas, chestDatas){
    Manager.start(userStatTable, resourceTable, obstacleTable);
    Manager.setUsers(userDatas);
    // Manager.setUsersSkills(skillDatas);
    // Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.onMainUserMove = function(user){
      UIManager.updateUserPosition(user.position);
    }
    var chestLocationDatas = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_CHEST_GROUND));

    UIManager.setBoard(userDatas, gameConfig.userID);
    UIManager.setMiniMapChests(chestDatas, chestLocationDatas);
    // console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });
  socket.on('resRestartGame', function(userData){
    Manager.iamRestart(userData);
    Manager.updateUserData(userData);
    Manager.changeUserStat(userData, true);
    UIManager.checkSkillsCounsumeMana(userData.MP);

    canvasAddEvent();
    documentAddEvent();

    baseSkill = userData.baseSkill;
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', userData.baseSkill));
    inherentPassiveSkill = userData.inherentPassiveSkill;
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', userData.inherentPassiveSkill));

    switch (characterType) {
      case gameConfig.CHAR_TYPE_FIRE:
        for(var i=0; i<4; i++){
          equipSkills[i] = firoEquipSkills[i];
        }
        break;
      case gameConfig.CHAR_TYPE_FROST:
        for(var i=0; i<4; i++){
          equipSkills[i] = freezerEquipSkills[i];
        }
        break;
      case gameConfig.CHAR_TYPE_ARCANE:
        for(var i=0; i<4; i++){
          equipSkills[i] = mysterEquipSkills[i];
        }
        break;
    }

    for(var i=0; i<4; i++){
      if(equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };

    possessSkills = userData.possessSkills;

    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setHUDSkills();
    // UIManager.updateBuffIcon();
    UIManager.setHUDStats(userData.statPower, userData.statMagic, userData.statSpeed);
    UIManager.setCooldownReduceRate(userData.cooldownReduceRate);
    UIManager.setPopUpSkillChange();
    UIManager.updateHP(userData);
    UIManager.updateMP(userData);

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });
  socket.on('userJoined', function(data, rankDatas){
    data.imgData = Manager.setImgData(data);
    Manager.setUser(data);
    UIManager.updateBoard(rankDatas, gameConfig.userID);
    console.log('user joined ' + data.objectID);
  });
  socket.on('userDataUpdate', function(userData){
    console.log(userData);
    Manager.updateUserData(userData);
  });
  socket.on('userMoveAndAttack', function(userData){
    var skillData = Object.assign({}, util.findData(skillTable, 'index', userData.skillIndex));
    skillData.targetPosition = userData.skillTargetPosition;
    Manager.moveAndAttackUser(userData.objectID, userData.targetPosition, skillData, userData.moveBackward);
  });
  socket.on('userDataUpdateAndUseSkill', function(userData){
    Manager.updateUserData(userData);

    var skillData = Object.assign({}, util.findData(skillTable, 'index', userData.skillIndex));

    Manager.applyCastSpeed(userData.objectID, skillData);
    skillData.targetPosition = userData.skillTargetPosition;
    skillData.direction = userData.skillDirection;
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
      skillData.projectileIDs = userData.skillProjectileIDs;
    }
    Manager.useSkill(userData.objectID, skillData);
  });
  socket.on('skillFired', function(data, userID){
    var timeoutTime = data.syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', data.skillIndex));
      skillData.targetPosition = data.skillTargetPosition;
      if(userID === gameConfig.userID){
        UIManager.applySkill(skillData.index);
      }
      Manager.applySkill(skillData);
    }, timeoutTime);
  });
  socket.on('projectilesFired', function(datas, syncFireTime, userID){
    var timeoutTime = syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      for(var i=0; i<datas.length; i++){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', datas[i].skillIndex));
        skillData.userID = userID;
        skillData.objectID = datas[i].objectID;
        skillData.position = datas[i].position;
        skillData.speed = datas[i].speed;
        skillData.startTime = Date.now();

        if(userID == gameConfig.userID){
          UIManager.applySkill(skillData.index);
        }
        Manager.applyProjectile(skillData);
      }
    }, timeoutTime);
  });
  socket.on('upgradeSkill', function(beforeSkillIndex, afterSkillIndex, resourceData){
    if(beforeSkillIndex === baseSkill){
      baseSkill = afterSkillIndex;
      baseSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeBaseSkill(baseSkill, baseSkillData);
    }else if(beforeSkillIndex === inherentPassiveSkill){
      inherentPassiveSkill = afterSkillIndex;
      inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeInherentSkill(inherentPassiveSkill, inherentPassiveSkillData);
    }else{
      for(var i=0; i<4; i++){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
        if(equipSkills[i] === beforeSkillIndex){
          equipSkills.splice(i, 1, afterSkillIndex);
          equipSkillDatas.splice(i, 1, skillData);
        }
        if(firoEquipSkills[i] === beforeSkillIndex){
          firoEquipSkills.splice(i, 1, afterSkillIndex);
        }
        if(freezerEquipSkills[i] === beforeSkillIndex){
          freezerEquipSkills.splice(i, 1, afterSkillIndex);
        }
        if(mysterEquipSkills[i] === beforeSkillIndex){
          mysterEquipSkills.splice(i, 1, afterSkillIndex);
        }
      }
      for(var i=0; i<possessSkills.length; i++){
        if(possessSkills[i] === beforeSkillIndex){
          possessSkills.splice(i, 1, afterSkillIndex);
          UIManager.upgradePossessionSkill(beforeSkillIndex, afterSkillIndex);
          break;
        }
      }
    }
    updateCharTypeSkill(characterType);
    UIManager.setResource(resourceData);
  });
  socket.on('updateUserPrivateStat', function(statData){
    UIManager.setHUDStats(statData.statPower, statData.statMagic, statData.statSpeed);
    UIManager.setCooldownReduceRate(statData.cooldownReduceRate);
  });
  socket.on('deleteProjectile', function(projectileID, userID){
    Manager.deleteProjectile(projectileID, userID);
  });
  socket.on('explodeProjectile', function(projectileID, userID, position){
    Manager.explodeProjectile(projectileID, userID, position);
  });
  socket.on('castCanceled', function(userID){
    Manager.cancelCasting(userID);
  });
  socket.on('createOBJs', function(objDatas){
    Manager.createOBJs(objDatas);
  });
  socket.on('deleteOBJ', function(objID){
    Manager.deleteOBJ(objID);
  });
  socket.on('createChest', function(chestData){
    console.log(chestData);
    Manager.createChest(chestData);
    UIManager.createChest(chestData.locationID);
  });
  socket.on('chestDamaged', function(locationID, HP){
    Manager.updateChest(locationID, HP);
  });
  socket.on('deleteChest', function(locationID){
    Manager.deleteChest(locationID);
    UIManager.deleteChest(locationID);
  });
  socket.on('getResource', function(resourceData){
    var beforeGold = UIManager.getUserGold();
    var beforeJewel = UIManager.getUserJewel();

    UIManager.setResource(resourceData);

    var afterGold = UIManager.getUserGold();
    var afterJewel = UIManager.getUserJewel();
    var center = Manager.getUserCenter(gameConfig.userID);
    if(afterGold > beforeGold){
      Manager.addRiseText('Gold ' + (afterGold - beforeGold), 'rgb(255, 255, 0)', center);
    }
    if(afterJewel > beforeJewel){
      Manager.addRiseText('Jewel ' + (afterJewel - beforeJewel), 'rgb(0, 255, 255)', center);
    }
  });
  socket.on('skillChangeToResource', function(skillIndex){
    var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
    UIManager.addResource(skillData.exchangeToGold, skillData.exchangeToJewel);
    UIManager.makeDivFlashMessage(skillData);
  });
  socket.on('changeUserStat', function(userData){
    if(userData.objectID === gameConfig.userID){
      UIManager.checkSkillsCounsumeMana(userData.MP);

      var beforeHP = Manager.getUserHP(userData.objectID);
      var beforeExp = Manager.getUserExp(userData.objectID);
    }
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
      UIManager.updateMP(userData);

      var needExp = Object.assign({}, util.findDataWithTwoColumns(userStatTable, 'type', characterType, 'level', userData.level)).needExp;
      UIManager.updateExp(userData, needExp);
    }
    if(userData.objectID === gameConfig.userID){
      var afterHP = Manager.getUserHP(userData.objectID);
      var afterExp = Manager.getUserExp(userData.objectID);
      var userCenter = Manager.getUserCenter(userData.objectID);
      if(userCenter){
        if(beforeHP !== afterHP){
          Manager.addRiseText('HP ' + (afterHP - beforeHP), 'rgb(0, 0, 255)', userCenter);
        }
        if(afterExp > beforeExp){
          Manager.addRiseText('EXP ' + (afterExp - beforeExp), 'rgb(255, 255, 0)', userCenter);
        }
      }
    }
  });
  socket.on('userDamaged', function(userData, skillIndex){
    if(skillIndex){
      var skillImgDataIndex = Object.assign({}, util.findData(skillTable, 'index', skillIndex)).hitEffectGroup;
      var skillImgData = Object.assign({}, util.findData(effectGroupTable, 'index', skillImgDataIndex));
      var hasResource = util.setResourceData(resourceTable, skillImgData);
      if(hasResource){
        Manager.updateSkillHitImgData(userData.objectID, skillImgData);
      }
    }
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
      UIManager.checkSkillsCounsumeMana(userData.MP);
    }
  });
  socket.on('updateBuff', function(buffData){
    if(buffData.objectID === gameConfig.userID){
      UIManager.updateBuffIcon(buffData.passiveList, buffData.buffList);
    }
    //set buffImg data
    var buffImgDataList = [];
    for(var i=0; i<buffData.buffList.length; i++){
      var buffImgDataIndex = Object.assign({}, util.findData(buffGroupTable, 'index', buffData.buffList[i].index)).buffEffectGroup;
      var buffImgData = Object.assign({}, util.findData(effectGroupTable, 'index', buffImgDataIndex));
      var hasResource = util.setResourceData(resourceTable, buffImgData);
      if(hasResource){
        buffImgDataList.push(buffImgData);
      }
    }
    Manager.updateUserBuffImgData(buffData.objectID, buffImgDataList);
  });
  socket.on('updateSkillPossessions', function(possessSkillIndexes){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkillIndexes);
    possessSkills = possessSkillIndexes;
    UIManager.updatePossessionSkills(possessSkills);
    UIManager.setPopUpSkillChange();
  });
  socket.on('userDead', function(attackUserID, deadUserID, userDatas){
    if(deadUserID === gameConfig.userID){
      Manager.iamDead();
      changeState(gameConfig.GAME_STATE_END);
    }
    killUser = attackUserID;
    Manager.kickUser(deadUserID);
    UIManager.updateBoard(userDatas, gameConfig.userID);
  });
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "rgb(69, 46, 4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  // ctx.beginPath();
  // ctx.save();
  // var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
  // ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
  // ctx.rotate(radian);
  // ctx.drawImage(resourceCharacter, Manager.users[index].imgData.srcPosX, Manager.users[index].imgData.srcPosY, Manager.users[index].imgData.srcWidth, Manager.users[index].imgData.srcHeight,
  //               -Manager.users[index].imgData.width/2, -Manager.users[index].imgData.height/2, Manager.users[index].imgData.width, Manager.users[index].imgData.height);
  // ctx.closePath();

  for(var i=0; i<Manager.obstacles.length; i++){
    ctx.beginPath();
    // if(Manager.obstacles[i].staticEle.isCollide){
    //   ctx.fillStyle ="#ff0000";
    // }else{
    //   ctx.fillStyle ="#000000";
    // }
    var center = util.worldToLocalPosition(Manager.obstacles[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceObject, Manager.obstacles[i].imgData.srcPosX, Manager.obstacles[i].imgData.srcPosY, Manager.obstacles[i].imgData.srcWidth, Manager.obstacles[i].imgData.srcHeight,
                  (center.x - Manager.obstacles[i].imgData.width/2) * gameConfig.scaleFactor, (center.y - Manager.obstacles[i].imgData.height/2) * gameConfig.scaleFactor, Manager.obstacles[i].imgData.width * gameConfig.scaleFactor, Manager.obstacles[i].imgData.height * gameConfig.scaleFactor);
    // ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor,
    //         resources.OBJ_TREE_SIZE/2 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.lineWidth = 5;
    // ctx.strokeStyle = '#003300';
    // ctx.stroke();
    ctx.closePath();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
};
function drawChests(){
  // ctx.fillStyle = "#00ff00";
  for(var i=0; i<Manager.chests.length; i++){
    ctx.beginPath();
    var center = util.worldToLocalPosition(Manager.chests[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceObject, Manager.chests[i].imgData.srcPosX, Manager.chests[i].imgData.srcPosY, Manager.chests[i].imgData.srcWidth, Manager.chests[i].imgData.srcHeight,
                  (center.x - Manager.chests[i].imgData.width/2) * gameConfig.scaleFactor, (center.y - Manager.chests[i].imgData.height/2) * gameConfig.scaleFactor, Manager.chests[i].imgData.width * gameConfig.scaleFactor, Manager.chests[i].imgData.height * gameConfig.scaleFactor);
    // var pos = util.worldToLocalPosition(Manager.chests[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor,
    //               Manager.chests[i].size.width * gameConfig.scaleFactor, Manager.chests[i].size.height * gameConfig.scaleFactor);

    ctx.fillStyle = "00ff00";
    var width = Manager.chests[i].HP / Manager.chests[i].maxHP * 85 * gameConfig.scaleFactor;
    var height = 10 * gameConfig.scaleFactor;
    ctx.fillRect((center.x - 42.5) * gameConfig.scaleFactor, (center.y + 60) * gameConfig.scaleFactor, width, height);

    ctx.strokeStyle = "#000000";
    width = 85 * gameConfig.scaleFactor;
    ctx.strokeRect((center.x - 42.5) * gameConfig.scaleFactor, (center.y + 60) * gameConfig.scaleFactor, width, height);
    ctx.closePath();
  }
};
function drawObjs(){
  // var objGoldImgData, objJewelImgData, objSkillFireImgData, objSkillFrostImgData, objSkillArcaneImgData;

  for(var i=0; i<Manager.objGolds.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objGolds[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objGolds[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceObject, objGoldImgData.srcPosX, objGoldImgData.srcPosY, objGoldImgData.srcWidth, objGoldImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objGolds[i].radius * 2 * gameConfig.scaleFactor, Manager.objGolds[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objGolds[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  for(var i=0; i<Manager.objJewels.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objJewels[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objJewels[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceObject, objJewelImgData.srcPosX, objJewelImgData.srcPosY, objJewelImgData.srcWidth, objJewelImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objJewels[i].radius * 2 * gameConfig.scaleFactor, Manager.objJewels[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objJewels[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  // for(var i=0; i<Manager.objExps.length; i++){
  //   ctx.beginPath();
  //   var centerX = util.worldXCoordToLocalX(Manager.objExps[i].position.x + Manager.objExps[i].radius, gameConfig.userOffset.x);
  //   var centerY = util.worldYCoordToLocalY(Manager.objExps[i].position.y + Manager.objExps[i].radius, gameConfig.userOffset.y);
  //   ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objExps[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
  //   ctx.fill();
  //   // var pos = util.worldToLocalPosition(Manager.objExps[i].position, gameConfig.userOffset);
  //   // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
  //   ctx.closePath();
  // };
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objSkills[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objSkills[i].position.y, gameConfig.userOffset.y);
    switch (Manager.objSkills[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var skillImgData = objSkillFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        skillImgData = objSkillFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        skillImgData = objSkillArcaneImgData;
        break;
      default:
    }
    ctx.drawImage(resourceObject, skillImgData.srcPosX, skillImgData.srcPosY, skillImgData.srcWidth, skillImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objSkills[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawUserEffect(){
  for(var i=0; i<Manager.userEffects.length; i++){
    var imgData = Manager.userEffects[i]['resourceIndex' + (Manager.userEffects[i].effectIndex + 1)];
    var center = util.worldToLocalPosition(Manager.userEffects[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  (center.x - imgData.width/2) * gameConfig.scaleFactor, (center.y -imgData.height/2) * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
  }
};
function drawUsers(){
  for(var index in Manager.users){
    if(Manager.users[index].conditions[gameConfig.USER_CONDITION_BLUR]){
      if(index === gameConfig.userID){
        ctx.globalAlpha = 0.6;
      }else{
        ctx.globalAlpha = 0.3;
      }
    }else{
      ctx.globalAlpha = 1;
    }
    var radian = Manager.users[index].direction * radianFactor;
    ctx.save();
    // ctx.setTransform(1,0,0,1,0,0);
    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
    ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
    ctx.rotate(radian);
    // var posX = util.worldXCoordToLocalX(Manager.users[index].position.x, gameConfig.userOffset.x);
    // var posY = util.worldYCoordToLocalY(Manager.users[index].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceCharacter, Manager.users[index].imgData.srcPosX, Manager.users[index].imgData.srcPosY, Manager.users[index].imgData.srcWidth, Manager.users[index].imgData.srcHeight,
                  -Manager.users[index].imgData.width/2 * gameConfig.scaleFactor, -Manager.users[index].imgData.height/2 * gameConfig.scaleFactor, Manager.users[index].imgData.width *gameConfig.scaleFactor, Manager.users[index].imgData.height * gameConfig.scaleFactor);
    //draw Hand
    var imgData = userHandImgData[Manager.users[index].imgHandIndex];
    ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);

    // draw cast effect
    if(Manager.users[index].skillCastEffectPlay){
      // ctx.fillStyle ="#00ff00";
      if(Manager.users[index].currentSkill){
        switch (Manager.users[index].currentSkill.property) {
          case gameConfig.SKILL_PROPERTY_FIRE:
          var imgData = castFireImgData;
          break;
          case gameConfig.SKILL_PROPERTY_FROST:
          imgData = castFrostImgData;
          break;
          case gameConfig.SKILL_PROPERTY_ARCANE:
          imgData = castArcaneImgData;
          break;
          default:
        }
        var scaleFactor = Manager.users[index].castEffectFactor;
        ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
          -imgData.width/2 * gameConfig.scaleFactor * scaleFactor, -imgData.height/2 * gameConfig.scaleFactor * scaleFactor, imgData.width * gameConfig.scaleFactor * scaleFactor, imgData.height * gameConfig.scaleFactor * scaleFactor);
      }
    }
    for(var i=0; i<Manager.users[index].hitImgDataList.length; i++){
      var imgIndex = Manager.users[index].effectIndex % Manager.users[index].hitImgDataList[i].resourceLength + 1;
      var imgData = Manager.users[index].hitImgDataList[i]['resourceIndex' + imgIndex];
      if(Manager.users[index].hitImgDataList[i].isAttach){
        if(Manager.users[index].hitImgDataList[i].isRotate){
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          var effectRadian = (Manager.users[index].hitImgDataList[i].rotateStartDegree + Manager.users[index].effectRotateDegree) * radianFactor;
          ctx.rotate(effectRadian);
          ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          ctx.rotate(radian);
        }else{
          ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
        }
      }
    }
    for(var i=0; i<Manager.users[index].buffImgDataList.length; i++){
      var imgIndex = Manager.users[index].effectIndex % Manager.users[index].buffImgDataList[i].resourceLength + 1;
      var imgData = Manager.users[index].buffImgDataList[i]['resourceIndex' + imgIndex];
      if(Manager.users[index].buffImgDataList[i].isAttach){
        if(Manager.users[index].buffImgDataList[i].isRotate){
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          var effectRadian = (Manager.users[index].buffImgDataList[i].rotateStartDegree + Manager.users[index].effectRotateDegree) * radianFactor;
          ctx.rotate(effectRadian);
          ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          ctx.rotate(radian);
        }else{
          ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
        }
      }
    }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_FREEZE]){
    //   ctx.drawImage(resourceCharacter, conditionFreezeImgData.srcPosX, conditionFreezeImgData.srcPosY, conditionFreezeImgData.srcWidth, conditionFreezeImgData.srcHeight,
    //                 -conditionFreezeImgData.width/2 * gameConfig.scaleFactor, -conditionFreezeImgData.height/2 * gameConfig.scaleFactor, conditionFreezeImgData.width * gameConfig.scaleFactor, conditionFreezeImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_CHILL]){
    //   ctx.drawImage(resourceCharacter, conditionChillImgData.srcPosX, conditionChillImgData.srcPosY, conditionChillImgData.srcWidth, conditionChillImgData.srcHeight,
    //                 -conditionChillImgData.width/2 * gameConfig.scaleFactor, -conditionChillImgData.height/2 * gameConfig.scaleFactor, conditionChillImgData.width * gameConfig.scaleFactor, conditionChillImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_SILENCE]){
    //   ctx.drawImage(resourceCharacter, conditionSilenceImgData.srcPosX, conditionSilenceImgData.srcPosY, conditionSilenceImgData.srcWidth, conditionSilenceImgData.srcHeight,
    //                 -conditionSilenceImgData.width/2 * gameConfig.scaleFactor, -conditionSilenceImgData.height/2 * gameConfig.scaleFactor, conditionSilenceImgData.width * gameConfig.scaleFactor, conditionSilenceImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_IMMORTAL]){
    //   radian = Manager.users[index].effectRotateDegree * radianFactor;
    //   ctx.rotate(radian);
    //   ctx.drawImage(resourceCharacter, conditionImmortalImgData.srcPosX, conditionImmortalImgData.srcPosY, conditionImmortalImgData.srcWidth, conditionImmortalImgData.srcHeight,
    //                 -conditionImmortalImgData.width/2 * gameConfig.scaleFactor, -conditionImmortalImgData.height/2 * gameConfig.scaleFactor, conditionImmortalImgData.width * gameConfig.scaleFactor, conditionImmortalImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_IGNITE]){
    //   switch (Manager.users[index].effectIndex) {
    //     case 0:
    //       imgData = conditionIgnite1ImgData;
    //       break;
    //     case 1:
    //       imgData = conditionIgnite2ImgData;
    //       break;
    //     case 2:
    //       imgData = conditionIgnite3ImgData;
    //       break;
    //     case 3:
    //       imgData = conditionIgnite4ImgData;
    //       break;
    //     case 4:
    //       imgData = conditionIgnite5ImgData;
    //       break;
    //     default:
    //   }
    //   ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
    //               -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
    // }

    ctx.restore();

    //draw HP gauge
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.users[index].position, gameConfig.userOffset);

    ctx.fillStyle = "#00ff00";
    var width = Manager.users[index].HP / Manager.users[index].maxHP * 85 * gameConfig.scaleFactor;
    var height = 10 * gameConfig.scaleFactor;
    ctx.fillRect((pos.x - 10) * gameConfig.scaleFactor, (pos.y + 80) * gameConfig.scaleFactor, width, height);

    ctx.strokeStyle = "#000000";
    width = 85 * gameConfig.scaleFactor;
    ctx.strokeRect((pos.x - 10) * gameConfig.scaleFactor, (pos.y + 80) * gameConfig.scaleFactor, width, height);
    ctx.closePath();
  }
  ctx.globalAlpha = 1;
};
function drawEffect(){
  for(var i=0; i<Manager.effects.length; i++){
    ctx.beginPath();
    ctx.fillStyle ="#ff0000";
    switch (Manager.effects[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var imgData = skillFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        imgData = skillFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        imgData = skillArcaneImgData;
        break;
      default:
    }
    var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    // var radius = Manager.effects[i].radius;
    var radius = Manager.effects[i].radius * Manager.effects[i].scaleFactor;
    // var posX = util.worldXCoordToLocalX(Manager.effects[i].position.x, gameConfig.userOffset.x);
    // var posY = util.worldYCoordToLocalY(Manager.effects[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  (centerX - radius) * gameConfig.scaleFactor, (centerY - radius) * gameConfig.scaleFactor, radius * 2 * gameConfig.scaleFactor, radius * 2 * gameConfig.scaleFactor);
    // var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    // var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.effects[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    // ctx.fill();

    ctx.closePath();
  }
};
function drawProjectile(){
  for(var i=0; i<Manager.projectiles.length; i++){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.projectiles[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.projectiles[i].position.y, gameConfig.userOffset.y);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.projectiles[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    switch (Manager.projectiles[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var imgData = projectileFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        imgData = projectileFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        imgData = projectileArcaneImgData;
        break;
      default:
    }
    ctx.drawImage(resourceSkillEffect, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawRiseText(){
  for(var i=0; i<Manager.riseText.length; i++){
    ctx.font = "30px Arial";
    ctx.fillStyle = Manager.riseText[i].color;
    // console.log(Manager.riseText[i].position);
    var pos = util.worldToLocalPosition(Manager.riseText[i].position, gameConfig.userOffset);
    ctx.fillText(Manager.riseText[i].text, pos.x, pos.y);
  }
};
function drawSkillRange(){
  if(currentSkillData.type === gameConfig.SKILL_TYPE_PROJECTILE || currentSkillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
     currentSkillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION || currentSkillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION){
       ctx.beginPath();
       ctx.save();
       var center = util.worldToLocalPosition(Manager.users[gameConfig.userID].center, gameConfig.userOffset);
       var distX = mousePoint.x - center.x;
       var distY = mousePoint.y - center.y;

       var radian = Math.atan(distY / distX);
       if(isNaN(radian)){
        radian = 0;
       }else{
         if(distX < 0 && distY >= 0){
           radian += Math.PI;
         }else if(distX < 0 && distY < 0){
           radian -= Math.PI;
         }
       }

       ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
       ctx.rotate(radian);
       ctx.drawImage(resourceCharacter, projectileSkillArrowImgData.srcPosX, projectileSkillArrowImgData.srcPosY, projectileSkillArrowImgData.srcWidth, projectileSkillArrowImgData.srcHeight,
                     -projectileSkillArrowImgData.width/2 * gameConfig.scaleFactor, -projectileSkillArrowImgData.height/2 * gameConfig.scaleFactor, projectileSkillArrowImgData.width *gameConfig.scaleFactor, projectileSkillArrowImgData.height * gameConfig.scaleFactor);
       ctx.closePath();
       ctx.restore();
     }else if(currentSkillData.index === baseSkill){
       ctx.beginPath();
       ctx.fillStyle = "#ffffff";
       ctx.globalAlpha = 0.8;
       ctx.arc(mousePoint.x * gameConfig.scaleFactor, mousePoint.y * gameConfig.scaleFactor, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
       ctx.fill();
       ctx.closePath();
     }else{
       ctx.beginPath();
       ctx.fillStyle = "#ffffff";
       ctx.globalAlpha = 0.8;
       var center = util.worldToLocalPosition(Manager.users[gameConfig.userID].center, gameConfig.userOffset);
       ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor, currentSkillData.range * gameConfig.scaleFactor, 0, 2 * Math.PI);
       ctx.fill();
       ctx.closePath();
       //draw explosionRadius
       ctx.beginPath();
       ctx.globalAlpha = 0.9;

       var distSquare = util.distanceSquare(center, mousePoint);
       if(Math.pow(currentSkillData.range,2) > distSquare){
         console.log(1);
         ctx.arc(mousePoint.x * gameConfig.scaleFactor, mousePoint.y * gameConfig.scaleFactor, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
       }else{
         console.log(2);
         var distX = mousePoint.x - center.x;
         var distY = mousePoint.y - center.y;

         var radian = Math.atan(distY / distX);
         if(isNaN(radian)){
          radian = 0;
         }else{
           if(distX < 0 && distY >= 0){
             radian += Math.PI;
           }else if(distX < 0 && distY < 0){
             radian -= Math.PI;
           }
         }

         var addPosX = currentSkillData.range * Math.cos(radian);
         var addPosY = currentSkillData.range * Math.sin(radian);

         var drawCenter = {x : center.x + addPosX, y : center.y + addPosY};
         ctx.arc(drawCenter.x * gameConfig.scaleFactor, drawCenter.y * gameConfig.scaleFactor, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
       }
       ctx.fill();
       ctx.globalAlpha = 1
     }
};
function drawBackground(){
  ctx.fillStyle = "rgb(105, 147, 50)";
  var posX = -gameConfig.userOffset.x * gameConfig.scaleFactor;
  var posY = -gameConfig.userOffset.y * gameConfig.scaleFactor;
  var sizeW = gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor;
  var sizeH = gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor;
  ctx.fillRect(posX, posY, sizeW, sizeH);
};
function drawGrid(){
  // for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resources.GRID_SIZE){
  //   var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
  //   if(x * gameConfig.scaleFactor >= -resources.GRID_SIZE && x * gameConfig.scaleFactor <= gameConfig.canvasSize.width){
  //     for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resources.GRID_SIZE){
  //        var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
  //        if(y * gameConfig.scaleFactor >= -resources.GRID_SIZE && y * gameConfig.scaleFactor <= gameConfig.canvasSize.height){
  //          ctx.drawImage(grid, 0, 0, 48, 48, x * gameConfig.scaleFactor, y * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor);
  //        }
  //     }
  //   }
  // }
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgb(103, 124, 81)';
  // ctx.globalAlpha = 0.15;
  ctx.beginPath();
 // - (gameConfig.CANVAS_MAX_LOCAL_SIZE.width * gameConfig.scaleFactor)/2
 //  - (gameConfig.CANVAS_MAX_LOCAL_SIZE.height * gameConfig.scaleFactor)/2
  for(var x = - gameConfig.userOffset.x - 800; x<gameConfig.canvasSize.width; x += gameConfig.CANVAS_MAX_LOCAL_SIZE.width/32){
    if(util.isXInCanvas(x, gameConfig)){
      ctx.moveTo(x * gameConfig.scaleFactor, 0);
      ctx.lineTo(x * gameConfig.scaleFactor, gameConfig.canvasSize.height);
    }
  };
  for(var y = - gameConfig.userOffset.y - 500; y<gameConfig.canvasSize.height; y += gameConfig.CANVAS_MAX_LOCAL_SIZE.height/20){
    if(util.isYInCanvas(y, gameConfig)){
      ctx.moveTo(0, y * gameConfig.scaleFactor);
      ctx.lineTo(gameConfig.canvasSize.width, y * gameConfig.scaleFactor);
    }
  };
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.closePath();
};
function updateUserDataHandler(){
  var userData = Manager.processUserData();
  // userData.latency = latency;
  socket.emit('userDataUpdate', userData);
};
function canvasAddEvent(){
  canvas.addEventListener('click', canvasEventHandler, false);
};
function documentAddEvent(){
  document.addEventListener('keydown', documentKeyDownEventHandler, false);
};
update();

var canvasEventHandler = function(e){
  var clickPosition ={
    x : e.clientX/gameConfig.scaleFactor,
    y : e.clientY/gameConfig.scaleFactor
  }
  var worldClickPosition = util.localToWorldPosition(clickPosition, gameConfig.userOffset);

  if(drawMode === gameConfig.DRAW_MODE_NORMAL){
    var targetPosition = util.setTargetPosition(worldClickPosition, Manager.users[gameConfig.userID]);
    Manager.moveUser(targetPosition);

    var userData = Manager.processUserData();
    userData.targetPosition = targetPosition;
    userData.latency = latency;
    socket.emit('userMoveStart', userData);
  }else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    if(currentSkillData.index === baseSkill){
      //case A
      var targetPosition = util.setMoveAttackUserTargetPosition(worldClickPosition, currentSkillData, Manager.users[gameConfig.userID]);
      var userTargetPosition = {x : targetPosition.x, y : targetPosition.y}
      var skillData = Object.assign({}, currentSkillData);
      skillData.targetPosition = worldClickPosition;

      Manager.moveAndAttackUser(gameConfig.userID, userTargetPosition, skillData, targetPosition.moveBackward);

      var userData = Manager.processUserData();

      userData.targetPosition = userTargetPosition;
      userData.moveBackward = targetPosition.moveBackward;
      userData.latency = latency;

      userData.skillIndex = currentSkillData.index;
      userData.skillTargetPosition = worldClickPosition;

      changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
      socket.emit('userMoveAndAttack', userData);
    }else{
      useSkill(currentSkillData, worldClickPosition, Manager.users[gameConfig.userID]);
      changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
    }
  }
};
var documentKeyDownEventHandler = function(e){
  var keyCode = e.keyCode;
  if(drawMode === gameConfig.DRAW_MODE_NORMAL){
    if(keyCode === 69 || keyCode === 32){
      // if(UIManager.checkCooltime(gameConfig.SKILL_BASIC_INDEX)){
      if(Manager.user.currentState !== gameConfig.OBJECT_STATE_ATTACK){
        var skillData = Object.assign({}, baseSkillData);
      }
      // }
    }else if(keyCode === 49){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP1_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[0]);
      // }
    }else if(keyCode === 50){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP2_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[1]);
      // }
    }else if(keyCode === 51){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP3_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[2]);
      // }
    }else if(keyCode === 52){
      // if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP4_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[3]);
      // }
    }
    checkSkillConditionAndUse(skillData);

    if(keyCode === 65){
      //case A
      skillData = Object.assign({}, baseSkillData);
      checkBaseSkillCondition(skillData);
    }
  }
  if(keyCode === 27){
    if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
      changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
    }
  }
};
function checkBaseSkillCondition(skillData){
  if(skillData.index === baseSkill){
    if(!Manager.user.conditions[gameConfig.USER_CONDITION_FREEZE] && !Manager.user.conditions[gameConfig.USER_CONDITION_SILENCE]){
      Manager.applyCastSpeed(gameConfig.userID, skillData);
      currentSkillData = skillData;
      changeDrawMode(gameConfig.DRAW_MODE_SKILL_RANGE);
    }
  }
}
function checkSkillConditionAndUse(skillData){
  if(skillData){
    if(UIManager.checkCooltime(skillData.index)){
      if(Manager.user.MP > skillData.consumeMP && !Manager.user.conditions[gameConfig.USER_CONDITION_FREEZE] &&
        !Manager.user.conditions[gameConfig.USER_CONDITION_SILENCE]){
          Manager.applyCastSpeed(gameConfig.userID, skillData);
          if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION
            || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
            || skillData.type === gameConfig.SKILL_TYPE_RANGE){
              if(drawMode === gameConfig.DRAW_MODE_NORMAL){
                currentSkillData = skillData;
                changeDrawMode(gameConfig.DRAW_MODE_SKILL_RANGE);
              }
            }else{
              useSkill(skillData, Manager.users[gameConfig.userID].center, Manager.users[gameConfig.userID]);
            }
          }else{
            if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
              changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
            }
          }
    }
  }
  // else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
  //   changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  // }
};
function changeDrawMode(mode){
  if(mode === gameConfig.DRAW_MODE_NORMAL){
    drawMode = gameConfig.DRAW_MODE_NORMAL;
    currentSkillData = null;
    UIManager.disableSelectSkillInfo();
    canvas.removeEventListener('mousemove', mouseMoveHandler);
  }else if(mode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawMode = gameConfig.DRAW_MODE_SKILL_RANGE;
    UIManager.enableSelectSkillInfo(currentSkillData);
    canvas.addEventListener('mousemove', mouseMoveHandler, false);
  }
};
function mouseMoveHandler(e){
  mousePoint.x = e.clientX/gameConfig.scaleFactor;
  mousePoint.y = e.clientY/gameConfig.scaleFactor;
};
function useSkill(skillData, clickPosition, user){
  if(UIManager.checkCooltime(skillData.index)){
    if(!user.conditions[gameConfig.USER_CONDITION_FREEZE] && !user.conditions[gameConfig.USER_CONDITION_SILENCE]){
      skillData.targetPosition = util.calcSkillTargetPosition(skillData, clickPosition, user);
      skillData.direction = util.calcSkillTargetDirection(skillData.type, skillData.targetPosition, user);
      if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
        skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
        || skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
          skillData.projectileIDs = util.generateRandomUniqueID(Manager.projectiles, gameConfig.PREFIX_SKILL_PROJECTILE, skillData.projectileCount);
        }
        Manager.useSkill(gameConfig.userID, skillData);

        var userData = Manager.processUserData();
        userData.skillIndex = skillData.index;
        userData.skillDirection = skillData.direction;
        userData.skillTargetPosition = skillData.targetPosition;
        if(skillData.projectileIDs){
          userData.projectileIDs = skillData.projectileIDs;
        }
        if(user.conditions[gameConfig.USER_CONDITION_BLUR]){
          userData.cancelBlur = true;
        }
        console.log(userData);
        socket.emit('userUseSkill', userData);
      }
  }
};
function updateCharTypeSkill(charType){
  switch (charType) {
    case gameConfig.CHAR_TYPE_FIRE:
      firoBaseSkill = baseSkill;
      firoInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        firoEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_FROST:
      freezerBaseSkill = baseSkill;
      freezerInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        freezerEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_ARCANE:
      mysterBaseSkill = baseSkill;
      mysterInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        mysterEquipSkills[i] = equipSkills[i];
      }
      break;
  }
};
function canvasDisableEvent(){
  canvas.removeEventListener('click', canvasEventHandler);
};
function documentDisableEvent(){
  document.removeEventListener('keydown', documentKeyDownEventHandler);
};
function setCanvasScale(gameConfig){
  gameConfig.scaleX = 1;
  gameConfig.scaleY = 1;
  if(gameConfig.canvasSize.width >= gameConfig.CANVAS_MAX_LOCAL_SIZE.width){
    gameConfig.scaleX =  (gameConfig.canvasSize.width / gameConfig.CANVAS_MAX_LOCAL_SIZE.width);
  }
  if(gameConfig.canvasSize.height >= gameConfig.CANVAS_MAX_LOCAL_SIZE.height){
    gameConfig.scaleY = (gameConfig.canvasSize.height / gameConfig.CANVAS_MAX_LOCAL_SIZE.height);
  }
  if(gameConfig.scaleX > gameConfig.scaleY){
    gameConfig.scaleFactor = gameConfig.scaleX;
  }else{
    gameConfig.scaleFactor = gameConfig.scaleY;
  }
};
function calcOffset(){
  return {
    x : Manager.user.center.x - gameConfig.canvasSize.width/(2 * gameConfig.scaleFactor),
    y : Manager.user.center.y - gameConfig.canvasSize.height/(2 * gameConfig.scaleFactor)
  };
};
