var Projectile = function(){
  this.objectID = ;
  this.userID = ;

  this.position = {};
  this.size = {};
  this.speed = {};
  this.damage = ;
  this.buffsToTarget = [];
  this.debuffsToTarget = [];

  this.timer = Date.now();

  this.startTime = ;
  this.lifeTime = ;

  this.colliderEle = {
    id : ,
    objectID : ,
    x : ,
    y : ,
    width : ,
    height : ,

  }
};
Projectile.prototype = {
  move : function(){

  },
  isExpired : function(){

  },
  explode : function(){

  }
}


module.exports.Projectile = Projectile

"PLUS_SIZE_WIDTH" : 500,
"PLUS_SIZE_HEIGHT" : 500,

스킬 관련 작업
충돌 시 affectedEles 처리
유저 takeDamage 함수 변경
chest takeDamage 함수 변경
유저 마나 부족 시 캐스팅 취소 추가.
유저 레벨 업그레이드 시 hp, mp 추가 회복
유저 상태에 따른 스킬 영향 추가
스킬 사용 시 힐 추가
버프 추가 확인
클라이언트에 알림(폭발, 삭제)
obj 충돌 시 처리 변경(getObj, deleteOBJ 함수 변경)
user stat 변경 시 알림 처리
스킬 이펙트 출력 위치 재조정
