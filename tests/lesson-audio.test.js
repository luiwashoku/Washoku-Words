/* Run: osascript -l JavaScript tests/lesson-audio.test.js */
ObjC.import('Foundation');
function read(p) { return $.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null).js; }
function assert(v,m) { if(!v) throw new Error(m); }
var window = {};
new Function('window',read('japanese-speech.js'))(window);
new Function('window',read('lesson-audio-manifest.js'))(window);
const source = read('app.js');
function permutations(values) {
 if(values.length<2)return [values];
 return values.flatMap((value,index)=>permutations(values.filter((_,i)=>i!==index)).map(rest=>[value].concat(rest)));
}
let checked=0;
const catalog = JSON.parse(read('data/catalog.json'));
Object.keys(window.lessonAudioFiles).forEach(lessonId=>{
const lookup = new Function('window','getJapaneseSpeechText','lessonId', `
 const state={selectedLesson:{id:lessonId}};
 ${source.slice(source.indexOf('  function getRecordedJapaneseFile('),source.indexOf('  function speakJapaneseText('))}
 return getRecordedJapaneseFile;
`)(window,window.getJapaneseSpeechText,lessonId);
const review = JSON.parse(read('scripts/lesson-audio-reviews/'+lessonId+'.json'));
review.entries.forEach(entry=>{
 assert(!/[\u3400-\u9fff々\u30a1-\u30faA-Za-z]/.test(entry.input),'Input must be reviewed hiragana');
 const path=lookup(entry.key);
 assert(path && $.NSFileManager.defaultManager.fileExistsAtPath(path),'Reviewed input has saved audio');
});
const lesson=catalog.find(item=>item.id===lessonId);
(lesson.files || [lesson.file]).forEach(file=>{
 const data = JSON.parse(read(file));
 if (lesson.gameMode === 'vocabulary-cards') {
  assert(data.entries.length === lesson.questionCount, 'Card count matches catalog');
  if (lessonId === 'knife-making-steps') assert(data.entries.every((entry, index) => index === 12 ? entry.step === null : entry.step === index + 1), 'Knife steps stay numbered in source order');
  data.entries.forEach(entry => {
   assert(lookup(entry.japanese), 'Vocabulary autoplay has recorded audio');
   if (entry.example) assert(lookup(entry.example.japanese), 'Example speaker has recorded audio');
  });
  if (lessonId === 'knife-making-steps') assert(catalog[catalog.indexOf(lesson) - 1].id === 'knife-forms-cards', 'Knife steps appear after the knife flashcards');
  return;
 }
 (Array.isArray(data) ? data : (data.questions || [])).forEach(card=>{
  // Non-Japanese choices have no Japanese sound; test every fully Japanese choice group.
  if(!card.answers || !card.answers.every(answer=>window.getJapaneseSpeechText(answer))) return;
  permutations(card.answers).forEach(answers=>{
   answers.join('。 \n').split(/\n/).forEach(part=>{
    assert(lookup(part) || lookup(part.replace(/。\s*$/,'')),'Shuffled answer must use saved Nova: '+card.id);
   });
   checked++;
  });
 });
});
});
console.log('PASS: reviewed audio coverage and '+checked+' answer permutations use saved Nova.');
