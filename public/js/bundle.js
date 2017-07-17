(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function CEffect(totalTime, fireTime, userData, targetPosition, radius, direction){
  this.totalTime = totalTime;
  this.fireTime = fireTime;

  this.startTime = Date.now();
  this.timeSpan = 0;

  this.userData = userData;
  this.targetPosition = targetPosition;
  this.direction = direction;
  this.radius = radius;
};

CEffect.prototype = {
};

module.exports = CEffect;

},{}],2:[function(require,module,exports){
var User = require('./CUser.js');

var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var QuadTree = require('../public/quadtree.min.js');

var Obstacle = require('./CObstacle.js');
var Effect = require('./CEffect.js');

var staticTree;
var staticEles = [];
var affectedEles = [];

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

	//user correspond client
	this.user = null;
	//all users
	this.users = [];
	this.obstacles = [];
	this.effects = [];

	this.staticInterval = null;
	this.affectInterval = null;
};

CManager.prototype = {
	start : function(){
		staticTree = new QuadTree({
		  width : this.gameConfig.CANVAS_MAX_SIZE.width,
		  height : this.gameConfig.CANVAS_MAX_SIZE.height,
		  maxElements : 5
		});

		this.mapSetting();
		this.updateGame();
	},
	mapSetting : function(){
		this.createObstacles();
		this.setObstaclesLocalPos();
	},
	updateGame : function(){
		var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;

		if(this.staticInterval === null){
	    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
	  }
	  if(this.affectInterval === null){
	    this.affectInterval = setInterval(affectIntervalHandler.bind(this), INTERVAL_TIMER);
	  }
	},
	createObstacles : function(){
		for(var index in map.Trees){
			var tempObstacle = new Obstacle(map.Trees[index].posX, map.Trees[index].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id, resources.OBJ_TREE_SRC);
			this.obstacles.push(tempObstacle);
		}
	},
	updateObstacleEles : function(){
		staticEles = [];

		for(var index in this.obstacles){
			var localPos = util.worldToLocalPosition(this.obstacles[index].position, this.gameConfig.userOffset);
			this.obstacles[index].staticEle.x = localPos.x
			this.obstacles[index].staticEle.y = localPos.y

			//will add filtering method

			staticEles.push(this.obstacles[index].staticEle);
		}

	  staticTree.pushAll(staticEles);
	},
	setObstaclesLocalPos : function(){
		for(var index in this.obstacles){
			var localPos = util.worldToLocalPosition(this.obstacles[index].position, this.gameConfig.userOffset);
			this.obstacles[index].localPosition.x = localPos.x
			this.obstacles[index].localPosition.y = localPos.y
		}
	},
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData, this.gameConfig);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index], this.gameConfig);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	kickUser : function(objID){
		if(!(objID in this.users)){
			console.log("user already out");
		}else{
			delete this.users[objID];
		}
	},
	createSkillEffect : function(targetPos, radius, direction, lifeTime){

	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	//will be merge to updateUser function
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			if(this.user.objectID == userData.objectID){
				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
	attackUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].changeState(this.gameConfig.currentState);
		}
	},
	updateUserData : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			// this.users[userData.objectID].speed.x = userData.speed.x;
			// this.users[userData.objectID].speed.y = userData.speed.y;

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			// this.users[userData.objectID].targetDirection = userData.targetDirection;

			this.users[userData.objectID].setCenter();
			this.users[userData.objectID].setTargetDirection();
			this.users[userData.objectID].setSpeed();
		}else{
  		console.log('can`t find user data');
		}
	},
	//execute every frame this client user move
	moveUsersOffset : function(addPos){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(-this.user.speed.x, -this.user.speed.y);
					if(addPos){
						this.users[index].addPosAndTargetPos(-addPos.x, -addPos.y);
					}
				}
			}else{
				console.log('can`t find user data');
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x -= this.user.speed.x;
			this.obstacles[index].localPosition.y -= this.user.speed.y;
		}
		if(addPos !== undefined){
			for(var index in this.obstacles){
				this.obstacles[index].localPosition.x -= addPos.x;
				this.obstacles[index].localPosition.y -= addPos.y;
				// this.obstacles[index].staticEle.x -= addPos.x;
				// this.obstacles[index].staticEle.y -= addPos.y;
			}
		}
	},
	compelUsersOffset : function(compelToX, compelToY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(-compelToX, -compelToY);
				}
			}
		}
	},
	revisionUserPos : function(revisionX, revisionY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(revisionX, revisionY);
				}
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x += revisionX;
			this.obstacles[index].localPosition.y += revisionY;

			// this.obstacles[index].staticEle.x += revisionX;
			// this.obstacles[index].staticEle.y += revisionY;
		}
	},
	revisionAllObj : function(revisionX, revisionY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				this.users[index].addPosAndTargetPos(revisionX, revisionY);
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x += revisionX;
			this.obstacles[index].localPosition.y += revisionY;

			// this.obstacles[index].staticEle.x += revisionX;
			// this.obstacles[index].staticEle.y += revisionY;
		}
	},
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
				this.user.onMoveOffset = this.moveUsersOffset.bind(this);
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	},
	findUserAsWorldPosition : function(userID, offset){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				var returnVal = {
					position : util.localToWorldPosition(this.users[index].position, offset),
					size : this.users[index].size
				};
				return returnVal;
			}
		}
	},
	//if canvas size changed re calculate all object local position
	reCalcLocalPosition : function(beforeOffset, afterOffset){
		for(var index in this.users){
			// before local position transform world position[position, targetPosition, center]
			var worldPosition = util.localToWorldPosition(this.users[index].position, beforeOffset);
			var worldTargetPosition = util.localToWorldPosition(this.users[index].targetPosition, beforeOffset);

			this.users[index].position = util.worldToLocalPosition(worldPosition, afterOffset);
			this.users[index].targetPosition = util.worldToLocalPosition(worldTargetPosition, afterOffset);
			this.users[index].setCenter();
		}
	}
};

function staticIntervalHandler(){
	//user elements update for collision check
	for(var index in this.users){
		this.users[index].setUserEle();
	}
	//obstacle elements remove at tree and update position
	for(var index in staticEles){
		staticTree.remove(staticEles[index]);
	}
	this.updateObstacleEles();

  // for(var index in this.users){
  //   var tempUserEle = this.users[index].entityTreeEle;
  //   var collisionObjs = util.checkCircleCollision(staticTree, tempUserEle.x, tempUserEle.y, tempUserEle.width, tempUserEle.id);
  //   if(collisionObjs.length > 0 ){
  //     var addPos = util.calcCompelPos(tempUserEle, collisionObjs);
  //     // affectedEles.push({func : 'moveCompel', id : tempUserEle.id, arg1 : addPos.x, arg2 : addPos.y});
  //   }
  // }
};
function affectIntervalHandler(){
  // var i = affectedEles.length;
  // while(i--){
  //   if(affectedEles[i].func === 'moveCompel'){
  //     if(affectedEles[i].id in this.users){
	// 			if(affectedEles[i].id === this.user.objectID){
	// 				this.users[affectedEles[i].id].targetPosition.x -= affectedEles[i].arg1;
	//         this.users[affectedEles[i].id].targetPosition.y -= affectedEles[i].arg2;
	//
	// 				this.gameConfig.userOffset.x += affectedEles[i].arg1;
	// 				this.gameConfig.userOffset.y += affectedEles[i].arg2;
	//
	//         this.users[affectedEles[i].id].setTargetDirection();
	//         this.users[affectedEles[i].id].setSpeed();
	//
	// 				this.compelUsersOffset(affectedEles[i].arg1 , affectedEles[i].arg2);
	// 			}else{
	//         this.users[affectedEles[i].id].position.x += affectedEles[i].arg1;
	//         this.users[affectedEles[i].id].position.y += affectedEles[i].arg2;
	//         this.users[affectedEles[i].id].setCenter();
	//
	//         this.users[affectedEles[i].id].setTargetDirection();
	//         this.users[affectedEles[i].id].setSpeed();
	// 			}
  //     }
  //   }
  //   affectedEles.splice(i, 1);
  // }
};
var onMoveCalcCompelPos = function(user){
	var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};
module.exports = CManager;

},{"../public/map.json":6,"../public/quadtree.min.js":7,"../public/resource.json":8,"../public/util.js":9,"./CEffect.js":1,"./CObstacle.js":3,"./CUser.js":4}],3:[function(require,module,exports){
function CObstacle(posX, posY, sizeW, sizeH, id, src){
  this.objectID = id;
  this.src = src;
  this.position = {
    x : posX, y : posY
  };
  // user when draw obstacle
  this.localPosition = {
    x : posX, y : posY
  };
  this.size = {
    width : sizeW, height : sizeH
  };
  this.center = {
    x : this.position.x + this.size.width/2,
    y : this.position.y + this.size.height/2
  }

  this.setSize(sizeW, sizeH);
  this.setPosition(posX, posY);

  this.staticEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};

CObstacle.prototype = {
  setPosition : function(x, y){
    this.position.x = x;
    this.position.y = y;
    this.setCenter();
  },
  setSize : function(w, h){
    this.size.width = w;
    this.size.height = h;
  },
  setCenter : function(){
    if(this.size.width == 0 || this.size.height == 0){
      console.log('setSize before setCenter');
    }
    this.center.x = this.position.x + this.size.width/2;
    this.center.y = this.position.y + this.size.height/2;
  },
};
module.exports = CObstacle;

},{}],4:[function(require,module,exports){
var util = require('../public/util.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;

  this.currentState = null;
  this.size = userData.size;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

  this.onMoveOffset = new Function();

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
};

User.prototype = {
  changeState : function(newState){

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case this.gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this);
  },
  moveOffset : function(){
    util.moveOffset.call(this);
  },
  addPosAndTargetPos : function(addPosX , addPosY){
    this.position.x += addPosX;
    this.position.y += addPosY;

    this.targetPosition.x += addPosX;
    this.targetPosition.y += addPosY;

    this.setCenter();
  },
  stop : function(){
    console.log('stop');
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
  },
  setUserEle : function(){
    this.entityTreeEle = {
      x : this.position.x,
      y : this.position.y,
      width : this.size.width,
      height : this.size.height,
      id : this.objectID
    };
  }
};

module.exports = User;

},{"../public/util.js":9}],5:[function(require,module,exports){
module.exports={
  "INTERVAL" : 30,

  "CANVAS_MAX_SIZE" : {"width" : 11200 , "height" : 11200},
  "CANVAS_MAX_LOCAL_SIZE" : {"width" : 1600, "height" : 1600},

  "OBJECT_STATE_IDLE" : 0,
  "OBJECT_STATE_MOVE" : 1,
  "OBJECT_STATE_ATTACK" : 2,
  "OBJECT_STATE_CAST" : 3,

  "FPS" : 60,
  "PLUS_SIZE_WIDTH" : 500,
  "PLUS_SIZE_HEIGHT" : 500,

  "OBJECT_STATE_MOVE_OFFSET" : 99,

  "GAME_STATE_LOAD" : 0,
  "GAME_STATE_START_SCENE" : 1,
  "GAME_STATE_GAME_START" : 2,
  "GAME_STATE_GAME_ON" : 3,
  "GAME_STATE_GAME_END" : 4,

  "SKILL_TYPE_BASIC" : 0,
  "SKILL_TYPE_INSTANT" : 1,
  "SKILL_TYPE_PROJECTILE" : 2,
  "SKILL_TYPE_SELF" : 3
}

},{}],6:[function(require,module,exports){
module.exports={
  "Trees" : [
    {"id" : "OT1", "posX" : 200, "posY" : 200},
    {"id" : "OT2", "posX" : 500, "posY" : 500}
  ]
}

},{}],7:[function(require,module,exports){
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&module.exports?module.exports=t():e.Quadtree=t()}(this,function(){return function(){function e(t){var n,i;if(this.x=t.x,this.y=t.y,this.width=t.width,this.height=t.height,this.maxElements=t.maxElements,null==this.width||null==this.height)throw new Error("Missing quadtree dimensions.");if(null==this.x&&(this.x=0),null==this.y&&(this.y=0),null==this.maxElements&&(this.maxElements=1),this.contents=[],this.oversized=[],this.size=0,this.width<1||this.height<1)throw new Error("Dimensions must be positive integers.");if(!Number.isInteger(this.x)||!Number.isInteger(this.y))throw new Error("Coordinates must be integers");if(this.maxElements<1)throw new Error("The maximum number of elements before a split must be a positive integer.");i=this,this.children={NW:{create:function(){return new e({x:i.x,y:i.y,width:Math.max(Math.floor(i.width/2),1),height:Math.max(Math.floor(i.height/2),1),maxElements:i.maxElements})},tree:null},NE:{create:function(){return new e({x:i.x+Math.max(Math.floor(i.width/2),1),y:i.y,width:Math.ceil(i.width/2),height:Math.max(Math.floor(i.height/2),1),maxElements:i.maxElements})},tree:null},SW:{create:function(){return new e({x:i.x,y:i.y+Math.max(Math.floor(i.height/2),1),width:Math.max(Math.floor(i.width/2),1),height:Math.ceil(i.height/2),maxElements:i.maxElements})},tree:null},SE:{create:function(){return new e({x:i.x+Math.max(Math.floor(i.width/2),1),y:i.y+Math.max(Math.floor(i.height/2),1),width:Math.ceil(i.width/2),height:Math.ceil(i.height/2),maxElements:i.maxElements})},tree:null}};for(n in this.children)this.children[n].get=function(){return null!=this.tree?this.tree:(this.tree=this.create(),this.tree)}}var t,n,i,r,h,l,o,s;return r=function(e){var t,n;return{x:Math.floor((null!=(t=e.width)?t:1)/2)+e.x,y:Math.floor((null!=(n=e.height)?n:1)/2)+e.y}},t=function(e,t){var n,i,r,h;return!(e.x>=t.x+(null!=(n=t.width)?n:1)||e.x+(null!=(i=e.width)?i:1)<=t.x||e.y>=t.y+(null!=(r=t.height)?r:1)||e.y+(null!=(h=e.height)?h:1)<=t.y)},n=function(e,t){var n;return n=r(t),e.x<n.x?e.y<n.y?"NW":"SW":e.y<n.y?"NE":"SE"},s=function(e){if("object"!=typeof e)throw new Error("Element must be an Object.");if(null==e.x||null==e.y)throw new Error("Coordinates properties are missing.");if((null!=e?e.width:void 0)<0||(null!=e?e.height:void 0)<0)throw new Error("Width and height must be positive integers.")},l=function(e){var t,n,i,r;return n=Math.max(Math.floor(e.width/2),1),i=Math.ceil(e.width/2),r=Math.max(Math.floor(e.height/2),1),t=Math.ceil(e.height/2),{NW:{x:e.x,y:e.y,width:n,height:r},NE:{x:e.x+n,y:e.y,width:i,height:r},SW:{x:e.x,y:e.y+r,width:n,height:t},SE:{x:e.x+n,y:e.y+r,width:i,height:t}}},i=function(e,n){var i,r,h,o;o=[],h=l(n);for(r in h)i=h[r],t(e,i)&&o.push(r);return o},h=function(e,t){var n;return n=function(n){return e["_"+n]=e[n],Object.defineProperty(e,n,{set:function(e){return t.remove(this,!0),this["_"+n]=e,t.push(this)},get:function(){return this["_"+n]},configurable:!0})},n("x"),n("y"),n("width"),n("height")},o=function(e){var t;return t=function(t){if(null!=e["_"+t])return delete e[t],e[t]=e["_"+t],delete e["_"+t]},t("x"),t("y"),t("width"),t("height")},e.prototype.push=function(e,t){return this.pushAll([e],t)},e.prototype.pushAll=function(e,t){var n,r,l,o,u,f,c,d,a,g,p,m,x,y,v,w,E,M,z,b;for(p=0,y=e.length;p<y;p++)g=e[p],s(g),t&&h(g,this);for(c=[{tree:this,elements:e}];c.length>0;){for(E=c.shift(),b=E.tree,f=E.elements,d={NW:null,NE:null,SW:null,SE:null},m=0,v=f.length;m<v;m++)if(u=f[m],b.size++,a=i(u,b),1!==a.length||1===b.width||1===b.height)b.oversized.push(u);else if(b.size-b.oversized.length<=b.maxElements)b.contents.push(u);else{for(o=a[0],z=b.children[o],null==d[o]&&(d[o]={tree:z.get(),elements:[]}),d[o].elements.push(u),M=b.contents,x=0,w=M.length;x<w;x++)r=M[x],l=i(r,b)[0],null==d[l]&&(d[l]={tree:b.children[l].get(),elements:[]}),d[l].elements.push(r);b.contents=[]}for(o in d)null!=(n=d[o])&&c.push(n)}return this},e.prototype.remove=function(e,t){var i,r;return s(e),(i=this.oversized.indexOf(e))>-1?(this.oversized.splice(i,1),this.size--,t||o(e),!0):(i=this.contents.indexOf(e))>-1?(this.contents.splice(i,1),this.size--,t||o(e),!0):(r=this.children[n(e,this)],!(null==r.tree||!r.tree.remove(e,t))&&(this.size--,0===r.tree.size&&(r.tree=null),!0))},e.prototype.colliding=function(e,n){var r,h,l,o,u,f,c,d,a,g,p,m,x,y;for(null==n&&(n=t),s(e),u=[],l=[this];l.length>0;){for(y=l.shift(),m=y.oversized,f=0,a=m.length;f<a;f++)(h=m[f])!==e&&n(e,h)&&u.push(h);for(x=y.contents,c=0,g=x.length;c<g;c++)(h=x[c])!==e&&n(e,h)&&u.push(h);for(o=i(e,y),0===o.length&&(o=[],e.x>=y.x+y.width&&o.push("NE"),e.y>=y.y+y.height&&o.push("SW"),o.length>0&&(1===o.length?o.push("SE"):o=["SE"])),d=0,p=o.length;d<p;d++)r=o[d],null!=y.children[r].tree&&l.push(y.children[r].tree)}return u},e.prototype.onCollision=function(e,n,r){var h,l,o,u,f,c,d,a,g,p,m,x,y;for(null==r&&(r=t),s(e),o=[this];o.length>0;){for(y=o.shift(),m=y.oversized,f=0,a=m.length;f<a;f++)(l=m[f])!==e&&r(e,l)&&n(l);for(x=y.contents,c=0,g=x.length;c<g;c++)(l=x[c])!==e&&r(e,l)&&n(l);for(u=i(e,y),0===u.length&&(u=[],e.x>=y.x+y.width&&u.push("NE"),e.y>=y.y+y.height&&u.push("SW"),u.length>0&&(1===u.length?u.push("SE"):u=["SE"])),d=0,p=u.length;d<p;d++)h=u[d],null!=y.children[h].tree&&o.push(y.children[h].tree)}return null},e.prototype.get=function(e){return this.where(e)},e.prototype.where=function(e){var t,i,r,h,l,o,u,f,c,d,a,g,p;if("object"==typeof e&&(null==e.x||null==e.y))return this.find(function(t){var n,i;n=!0;for(i in e)e[i]!==t[i]&&(n=!1);return n});for(s(e),h=[],r=[this];r.length>0;){for(p=r.shift(),d=p.oversized,l=0,f=d.length;l<f;l++){i=d[l],t=!0;for(u in e)e[u]!==i[u]&&(t=!1);t&&h.push(i)}for(a=p.contents,o=0,c=a.length;o<c;o++){i=a[o],t=!0;for(u in e)e[u]!==i[u]&&(t=!1);t&&h.push(i)}g=p.children[n(e,p)],null!=g.tree&&r.push(g.tree)}return h},e.prototype.each=function(e){var t,n,i,r,h,l,o,s,u,f;for(n=[this];n.length>0;){for(f=n.shift(),s=f.oversized,r=0,l=s.length;r<l;r++)i=s[r],"function"==typeof e&&e(i);for(u=f.contents,h=0,o=u.length;h<o;h++)i=u[h],"function"==typeof e&&e(i);for(t in f.children)null!=f.children[t].tree&&n.push(f.children[t].tree)}return this},e.prototype.find=function(e){var t,n,i,r,h,l,o,s,u,f,c;for(n=[this],r=[];n.length>0;){for(c=n.shift(),u=c.oversized,h=0,o=u.length;h<o;h++)i=u[h],("function"==typeof e?e(i):void 0)&&r.push(i);for(f=c.contents,l=0,s=f.length;l<s;l++)i=f[l],("function"==typeof e?e(i):void 0)&&r.push(i);for(t in c.children)null!=c.children[t].tree&&n.push(c.children[t].tree)}return r},e.prototype.filter=function(t){var n;return(n=function(i){var r,h,l,o,s,u,f,c,d,a,g;h=new e({x:i.x,y:i.y,width:i.width,height:i.height,maxElements:i.maxElements}),h.size=0;for(r in i.children)null!=i.children[r].tree&&(h.children[r].tree=n(i.children[r].tree),h.size+=null!=(c=null!=(d=h.children[r].tree)?d.size:void 0)?c:0);for(a=i.oversized,o=0,u=a.length;o<u;o++)l=a[o],(null==t||("function"==typeof t?t(l):void 0))&&h.oversized.push(l);for(g=i.contents,s=0,f=g.length;s<f;s++)l=g[s],(null==t||("function"==typeof t?t(l):void 0))&&h.contents.push(l);return h.size+=h.oversized.length+h.contents.length,0===h.size?null:h})(this)},e.prototype.reject=function(e){return this.filter(function(t){return!("function"==typeof e?e(t):void 0)})},e.prototype.visit=function(e){var t,n,i;for(n=[this];n.length>0;){i=n.shift(),e.bind(i)();for(t in i.children)null!=i.children[t].tree&&n.push(i.children[t].tree)}return this},e.prototype.pretty=function(){var e,t,n,i,r,h,l;for(h="",n=function(e){var t,n,i;for(i="",t=n=e;n<=0?t<0:t>0;n<=0?++t:--t)i+="   ";return i},t=[{label:"ROOT",tree:this,level:0}];t.length>0;){l=t.shift(),i=n(l.level),h+=i+"| "+l.label+"\n"+i+"| ------------\n",l.tree.oversized.length>0&&(h+=i+"| * Oversized elements *\n"+i+"|   "+l.tree.oversized+"\n"),l.tree.contents.length>0&&(h+=i+"| * Leaf content *\n"+i+"|   "+l.tree.contents+"\n"),r=!1;for(e in l.tree.children)null!=l.tree.children[e].tree&&(r=!0,t.unshift({label:e,tree:l.tree.children[e].tree,level:l.level+1}));r&&(h+=i+"└──┐\n")}return h},e}()});


},{}],8:[function(require,module,exports){
module.exports={
  "USER_BODY_SRC" : "../images/CharBase.svg",
  "USER_BODY_SIZE" : 64,
  "USER_HAND_SRC" : "../images/CharHand.svg",
  "USER_HAND_SIZE" : 64,
  "GRID_SRC" : "../images/map-grass.png",
  "GRID_SIZE" : 60,

  "OBJ_TREE_SRC" : "",
  "OBJ_TREE_SIZE" : 100
}

},{}],9:[function(require,module,exports){
var gameConfig = require('./gameConfig.json');

//must use with bind or call method
exports.rotate = function(){
  if(this.targetDirection === this.direction){
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move();
    }else if(this.currentState === gameConfig.OBJECT_STATE_MOVE_OFFSET){
        //only use at client
        this.moveOffset();
    }else if(this.currentState === gameConfig.OBJECT_STATE_CAST){

    }
  }
  //check rotate direction
  else if(this.direction > 0 && this.targetDirection < 0){
    if((180 - this.direction + 180 + this.targetDirection) < (this.direction - this.targetDirection)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }else if(this.targetDirection < this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }
  }else if(this.direction < 0 && this.targetDirection >0 ){
    if((180 + this.direction + 180 - this.targetDirection) < (this.targetDirection - this.direction)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }else if(this.targetDirection > this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }
  }else if(this.targetDirection > this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction += Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction += this.rotateSpeed;
    }
  }else if(this.targetDirection < this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction -= Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction -= this.rotateSpeed;
    }
  }

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(){
  //calculate dist with target
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }

  // check collision with obstacle
  // calculate compel add pos
  // add compel pos to postion
  var addPos = this.onMove(this);
  if(addPos !== undefined){
    this.position.x += addPos.x;
    this.position.y += addPos.y;
  }
  this.position.x += this.speed.x;
  this.position.y += this.speed.y;

  this.setCenter();
};
exports.moveOffset = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }
  var addPos = this.onMove(this);
  if(addPos !== undefined){
    this.targetPosition.x -= addPos.x;
    this.targetPosition.y -= addPos.y;

    this.gameConfig.userOffset.x += addPos.x;
    this.gameConfig.userOffset.y += addPos.y;
  }
  this.targetPosition.x -= this.speed.x;
  this.targetPosition.y -= this.speed.y;

  this.gameConfig.userOffset.x += this.speed.x;
  this.gameConfig.userOffset.y += this.speed.y;

  this.onMoveOffset(addPos);
}

//must use with bind or call method
//setup when click canvas for move
exports.setSpeed = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0  && distY ==0){
    this.speed.x = 0;
    this.speed.y = 0;
  }else if(Math.pow(distX,2) + Math.pow(distY,2) < 100){
    this.speed.x = distX;
    this.speed.y = distY;
  }else{
    this.speed.x = (distX>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distX,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
    this.speed.y = (distY>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distY,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
  }
};

//must use with bind or call method
// setup when click canvas for move or fire skill
exports.setTargetDirection = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(distX < 0 && distY >= 0){
    this.targetDirection = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = tangentDegree - 180;
  }else{
    this.targetDirection = tangentDegree;
  }
};
//check obstacle collision
exports.checkCircleCollision = function(tree, posX, posY, radius, id){
  var returnVal = [];
  var obj = {x : posX, y: posY, width:radius, height: radius, id: id};
  tree.onCollision(obj, function(item){
    if(obj.id !== item.id){
      var objCenterX = obj.x + obj.width/2;
      var objCenterY = obj.y + obj.height/2;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      // check sum of radius with item`s distance
      var distSquareDiff = Math.pow(obj.width/2 + item.width/2,2) - Math.pow(itemCenterX - objCenterX,2) - Math.pow(itemCenterY - objCenterY,2);

      if(distSquareDiff > 0 ){
        //collision occured
        returnVal.push(item);
      }
    }
  });
  return returnVal;
};
exports.calcCompelPos = function(obj, collisionObjs){
  var addPos = { x : 0 , y : 0 };
  for(var i in collisionObjs){
    var objCenterX = obj.x + obj.width/2;
    var objCenterY = obj.y + obj.height/2;

    var itemCenterX = collisionObjs[i].x + collisionObjs[i].width/2;
    var itemCenterY = collisionObjs[i].y + collisionObjs[i].height/2;

    var vecX = objCenterX - itemCenterX;
    var vecY = objCenterY - itemCenterY;

    var dist = obj.width/2 + collisionObjs[i].width/2 - Math.sqrt(Math.pow(vecX,2) + Math.pow(vecY,2));
    var ratioXYSquare = Math.pow(vecY/vecX,2);

    var distFactorX = dist * Math.sqrt(1/(1+ratioXYSquare));
    var distFactorY = dist * Math.sqrt((ratioXYSquare) / (1 + ratioXYSquare));

    // 1.3 is make more gap between obj and collisionObjs
    addPos.x += (vecX > 0 ? 1 : -1) * distFactorX * 1;
    addPos.y += (vecY > 0 ? 1 : -1) * distFactorY * 1;
  }
  return addPos;
};

exports.checkAndCalcCompelPos = function(tree, posX, posY, radius, id, obj){
  var collisionObjs = [];
  var obj = {x : posX, y: posY, width:radius, height: radius, id: id};
  tree.onCollision(obj, function(item){
    if(obj.id !== item.id){
      var objCenterX = obj.x + obj.width/2;
      var objCenterY = obj.y + obj.height/2;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      // check sum of radius with item`s distance
      var distSquareDiff = Math.pow(obj.width/2 + item.width/2,2) - Math.pow(itemCenterX - objCenterX,2) - Math.pow(itemCenterY - objCenterY,2);

      if(distSquareDiff > 0 ){
        //collision occured
        collisionObjs.push(item);
      }
    }
  });
  var addPos = { x : 0 , y : 0 };
  for(var i in collisionObjs){
    var objCenterX = obj.x + obj.width/2;
    var objCenterY = obj.y + obj.height/2;

    var itemCenterX = collisionObjs[i].x + collisionObjs[i].width/2;
    var itemCenterY = collisionObjs[i].y + collisionObjs[i].height/2;

    var vecX = objCenterX - itemCenterX;
    var vecY = objCenterY - itemCenterY;

    var dist = obj.width/2 + collisionObjs[i].width/2 - Math.sqrt(Math.pow(vecX,2) + Math.pow(vecY,2));
    var ratioXYSquare = Math.pow(vecY/vecX,2);

    var distFactorX = dist * Math.sqrt(1/(1+ratioXYSquare));
    var distFactorY = dist * Math.sqrt((ratioXYSquare) / (1 + ratioXYSquare));

    // 1.3 is make more gap between obj and collisionObjs
    addPos.x += (vecX > 0 ? 1 : -1) * distFactorX * 1;
    addPos.y += (vecY > 0 ? 1 : -1) * distFactorY * 1;
  }
  return addPos;
};

//coordinate transform
exports.localToWorldPosition = function(position, offset){
  var newPosition = {
    x : position.x + offset.x,
    y : position.y + offset.y
  };
  return newPosition;
};
exports.worldToLocalPosition = function(position, offset){
  var newPosition = {
    x : position.x - offset.x,
    y : position.y - offset.y
  };
  return newPosition;
};
exports.worldXCoordToLocalX = function(x, offsetX){
  return x - offsetX;
};
exports.worldYCoordToLocalY = function(y, offsetY){
  return y - offsetY;
};
exports.isDrawX = function(x, gameConfig){
  if(x <= gameConfig.userOffset.x - gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else if(x >= gameConfig.userOffset.x + gameConfig.canvasSize.width + gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else{
    return true;
  }
};
exports.isDrawY = function(y, gameConfig){
  if(y <= gameConfig.userOffset.y - gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else if(y >= gameConfig.userOffset.y + gameConfig.canvasSize.height + gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else{
    return true;
  }
};
exports.calculateOffset = function(obj, canvasSize){
  var newOffset = {
    x : obj.position.x + obj.size.width/2 - canvasSize.width/2,
    y : obj.position.y + obj.size.height/2 - canvasSize.height/2
  };
  return newOffset;
};

//calcurate distance
exports.distanceSquare = function(position1, position2){
  var distX = position1.x - position2.x;
  var distY = position2.y - position2.y;

  var distSquare = Math.pow(distX, 2) + Math.pow(distY, 2);
  return distSquare;
};
exports.distance = function(position1, position2){
  var distSqure = exports.distanceSpuare(position1, position2);
  return Math.sqrt(distSqure);
};
//calcurate targetDirection;
exports.calcTargetDirection = function(targetPosition, centerPosition){
  var distX = targetPosition.x - centerPosition.x;
  var distY = targetPosition.y - centerPosition.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  var returnVal = 0;
  if(distX < 0 && distY >= 0){
    returnVal = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    returnVal = tangentDegree - 180;
  }else{
    returnVal = tangentDegree;
  }
  return returnVal;
};
exports.calcTargetPosition = function(centerPosition, direction, range){
  var addPosX = range * Math.cos(direction * Math.PI/180);
  var addPosY = range * Math.sin(direction * Math.PI/180);

  return {x : addPosX, y : addposY};
};

},{"./gameConfig.json":5}],10:[function(require,module,exports){
// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');

var socket;

// document elements
var infoScene, gameScene, standingScene;
var startButton;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;

// game var
var Manager;

// resource var
var resources;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = load;
var gameUpdateFunc = null;

var drawInterval = null;

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  drawInterval = null;
  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = load;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = standby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = start;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = game;
      break;
    case gameConfig.GAME_STATE_END:
      gameSate = newState;
      gameSetupFunc = null;
      gameUpdateFunc = end;
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
}

//load resource, base setting
function load(){
  setBaseSetting();
  setCanvasSize();
  //event handle config
  startButton.onclick = function(){
    changeState(gameConfig.GAME_STATE_GAME_START);
  };
  window.onresize = function(){
    setCanvasSize();
  };
  changeState(gameConfig.GAME_STATE_START_SCENE);
};
//when all resource loaded. just draw start scene
function standby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function start(){
  setupSocket();
  socket.emit('reqStartGame');
};
//game play on
function game(){
  drawGame();
};
//show end message and restart button
function end(){

};

//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  infoScene = document.getElementById('infoScene');
  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');
  startButton = document.getElementById('startButton');

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);

  // resource 관련
  resources = require('../../modules/public/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};

function setCanvasSize(){

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if(gameConfig.userOffset){
    var oldOffsetX = gameConfig.userOffset.x;
    var oldOffsetY = gameConfig.userOffset.y;
  }

  gameConfig.scaleFactor = 1;
  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};

  if(gameConfig.userOffset){
    var worldPosUser = {
      position : util.localToWorldPosition(Manager.user.position,gameConfig.userOffset),
      size : Manager.user.size
    };
    gameConfig.userOffset = util.calculateOffset(worldPosUser, gameConfig.canvasSize);

    var revisionX = oldOffsetX - gameConfig.userOffset.x;
    var revisionY = oldOffsetY - gameConfig.userOffset.y;

    Manager.revisionAllObj(revisionX, revisionY);
  }
};

function drawStartScene(){
  infoScene.classList.add('enable');
  infoScene.classList.remove('disable');
  gameScene.classList.add('disable');
  gameScene.classList.remove('enable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');
};

function drawGame(){
  infoScene.classList.add('disable');
  infoScene.classList.remove('enable');
  gameScene.classList.add('enable');
  gameScene.classList.remove('disable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');

  drawScreen();
  drawGrid();
  drawObstacles();
  drawUsers();
  drawEffect();
};
// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  //change state game on
  socket.on('resStartGame', function(datas){
    Manager.setUsers(datas);
    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);
    console.log('user joined ' + data.objectID);
  });

  socket.on('resMove', function(userData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    console.log(userData.objectID);
    console.log('move start');
    Manager.updateUserData(userData);
    Manager.moveUser(userData);
  });
  socket.on('resSkill', function(userData, skillData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    Manager.updateUserData(userData);
    Manager.attackUser(userData);

    //create user castingEffect
    Manager.createSkillEffect(skillData.targetPosition, skillData.radius, userData.direction, skillData.fireTime);

    // var animator = animateCastingEffect(userData, skillData.totalTime, ctx);
    // setInterval(animator.startAnimation, fps * 2);
    // user state change
    // animation start
  });
  socket.on('updateUser', function(userData){
    console.log('in updateUser')
    console.log(userData);
  })
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

function revisionUserPos(userData){
  var oldOffsetX = gameConfig.userOffset.x;
  var oldOffsetY = gameConfig.userOffset.y;

  gameConfig.userOffset = util.calculateOffset(userData, gameConfig.canvasSize);
  var revisionX = oldOffsetX - gameConfig.userOffset.x;
  var revisionY = oldOffsetY - gameConfig.userOffset.y;
  // Manager.revisionAllObj(revisionX, revisionY);
  Manager.revisionUserPos(revisionX, revisionY);
}
//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  ctx.fillStyle ="#000000";

  for(var index in Manager.obstacles){
    ctx.beginPath();
    ctx.arc(Manager.obstacles[index].localPosition.x + resources.OBJ_TREE_SIZE/2, Manager.obstacles[index].localPosition.y + resources.OBJ_TREE_SIZE/2,
            resources.OBJ_TREE_SIZE/2, 0, 2*Math.PI);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
}
function drawUsers(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    ctx.rotate(radian);
    ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    ctx.restore();
  }
};
function drawEffect(){
  for(var index in Manager.effects){
    var radian = Manager.effects[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var centerX = util.worldXCoordToLocalX(Manager.effects[index].position.x + Manager.effects[index].radius/2, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.effects[index].position.y + Manager.effects[index].radius/2, gameConfig.userOffset.y);
    ctx.translate(centerX, centerY);
    // ctx.rotate(radian);
    ctx.fillRect(-Manager.effects[index].radius/2, -Manager.effects[index].radius/2, Manager.effects[index].radius, Manager.effects[index].radius);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.restore();
  }
}
function drawGrid(){
  //draw boundary

  //draw grid
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resources.GRID_SIZE){
    if(util.isDrawX(i, gameConfig)){
      var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resources.GRID_SIZE){
        if(util.isDrawY(j, gameConfig)){
          var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
          ctx.drawImage(grid, x, y);
        }
      }
    }
  }
};

function canvasAddEvent(){
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    var worldTargetPosition = util.localToWorldPosition(targetPosition, gameConfig.userOffset);
    socket.emit('reqMove', worldTargetPosition);
  }, false);
}
function documentAddEvent(){
  document.addEventListener('keydown', function(e){
    var keyCode = e.keyCode;
    var tempPos = util.localToWorldPosition({x : 1000, y : 1000}, gameConfig.userOffset);
    if(keyCode === 69 || keyCode === 32){
      socket.emit('reqSkill', {'type' : gameConfig.SKILL_TYPE_BASIC});
    }else if(keyCode === 49){
      socket.emit('reqSkill', {'type' : gameConfig.SKILL_TYPE_INSTANT}, tempPos);
    }else if(keyCode === 50){
      socket.emit('reqSkill', {'type' : gameConfig.SKILL_TYPE_PROJECTILE}, tempPos);
    }else if(keyCode === 51){
      socket.emit('reqSkill', {'type' : gameConfig.SKILL_TYPE_SELF});
    }
  }, false);
}
update();
// local utils
// function setCanvasSize(scaleFactor){
//   // canvas.style.width = (canvas.width * scaleFactor) + 'px';
//   // canvas.style.height = (canvas.height * scaleFactor) + 'px';
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//
// };
// function getWindowSize(){
//   var returnVal = {
//     width : window.innerWidth,
//     height : window.innerHeight
//   }
//   return returnVal;
// };
// function setCanvasSizeAndScale(windowSize, canvasMaxSize){
//   if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
//     var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
//                   (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
//     // localConfig.canvasSize = {
//     //   width : config.canvasMaxLocalSize.width,
//     //   height : config.canvasMaxLocalSize.height
//     // };
//   }
//   gameConfig.scaleFactor = scaleFactor;
//   gameConfig.canvasSize = windowSize;
//   return 1;
// }

},{"../../modules/client/CManager.js":2,"../../modules/client/CUser.js":4,"../../modules/public/gameConfig.json":5,"../../modules/public/resource.json":8,"../../modules/public/util.js":9}]},{},[10]);
