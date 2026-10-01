/* Run: osascript -l JavaScript tests/recorded-audio.test.js */
ObjC.import('Foundation');
function read(p) { return $.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null).js; }
function assert(v,m) { if(!v) throw new Error(m); }
const source=read('app.js');
const functions=source.slice(source.indexOf('  function getRecordedJapaneseFile('),source.indexOf('  function restoreSavedData('));
const players=[];
function Audio(src) { this.src=src; this.paused=true; this.currentTime=0; this.events={}; players.push(this); }
Audio.prototype.addEventListener=function(name,fn){this.events[name]=fn;};
Audio.prototype.pause=function(){this.paused=true;};
Audio.prototype.play=function(){this.paused=false; const self=this; return {catch(fn){self.reject=fn;}};};
function button(){return {classList:{toggle(){}},setAttribute(){}};}
const host={tasteAudioFiles:{'こしひかり':'rice.mp3','あまい':'sweet.mp3'},gameAudioFiles:{'ゲーム':'game.mp3'}};
const api=new Function('window','Audio','document',`
let activeJapaneseAudio=null,activeJapaneseUtterance=null,activeSpeechButton=null;
const state={selectedLesson:{id:'taste-words'}};
const elements={speakQuestion:arguments[3],speakAnswers:arguments[3],speakExplanation:arguments[3]};
const getJapaneseSpeechText=t=>t;
${functions}
return {speak:speakJapaneseText,cancel:cancelJapaneseSpeech,select:id=>state.selectedLesson={id}};
`)(host,Audio,{getElementById(){return null;},querySelectorAll(){return [];}},button());
const a=button(),b=button();
assert(players.length===0,'No audio loaded before click');
api.speak('こしひかり',a,'name');
assert(players.length===1 && !players[0].paused && players[0].src==='rice.mp3','MP3 works without Web Speech');
players[0].currentTime=0.5;
api.speak('こしひかり',a,'name');
assert(players[0].paused && players[0].currentTime===0.5,'Pause keeps position');
api.speak('こしひかり',a,'name');
assert(!players[0].paused && players.length===1,'Resume reuses player');
api.speak('あまい',b,'description');
assert(players[0].paused && players[0].currentTime===0 && !players[1].paused,'Switch stops and resets previous clip');
players[0].events.ended();
assert(!players[1].paused,'Stale event does not stop new clip');
api.cancel();
assert(players[1].paused && players[1].currentTime===0,'Navigation cancels audio');
api.speak('こしひかり',a,'name');
players[2].reject();
assert(players[2].paused && a.title.includes('retry'),'Play rejection resets controls');
api.speak('こしひかり',a,'name');
players[3].events.error();
assert(players[3].paused && a.title.includes('retry'),'Load error permits retry');
api.speak('こしひかり',a,'name');
players[4].events.ended();
assert(players[4].paused,'End resets playback state');
console.log('PASS: on-demand MP3 playback, pause/resume, switching, cancellation, stale events and errors.');

['word-explosion','word-explosion-2','game-prototype','three-second-replies'].forEach(id=>{
  api.select(id);
  api.speak('ゲーム',a,'game');
  assert(players[players.length-1].src==='game.mp3','Nova playback for '+id);
  api.cancel();
});
api.select('page01');
const count=players.length;
api.speak('ゲーム',a,'game');
assert(players.length===count,'Game recordings limited to selected game decks');
console.log('PASS: all four game decks use Nova; unrelated lessons keep their existing speech.');
