global.window = global;
require("./story.js");
const s = global.CASE_STORY;
const ids = Object.keys(s.scenes);
const errors = [];
if (!s || !s.start || !s.scenes[s.start]) errors.push("Missing start scene");
let endings = 0;
for (const [id, scene] of Object.entries(s.scenes)) {
  if (!scene.title || !Array.isArray(scene.text) || !scene.text.length) errors.push(id + ": missing title/text");
  if (scene.ending) endings++;
  for (const c of (scene.choices || [])) if (!s.scenes[c.to]) errors.push(id + ": missing choice target " + c.to);
  if (scene.puzzle) {
    if (!s.scenes[scene.next]) errors.push(id + ": missing puzzle next " + scene.next);
    if (scene.puzzle.type === "choice" && (!Array.isArray(scene.puzzle.options) || !Number.isInteger(scene.puzzle.correct) || !scene.puzzle.options[scene.puzzle.correct])) errors.push(id + ": invalid choice puzzle");
    if (scene.puzzle.type === "text" && (!Array.isArray(scene.puzzle.answers) || !scene.puzzle.answers.length)) errors.push(id + ": invalid text puzzle");
  }
}
if (endings !== 1) errors.push("Expected exactly one ending, got " + endings);
const seen = new Set([s.start]);
const queue = [s.start];
while (queue.length) {
  const id = queue.shift(), scene = s.scenes[id];
  const next = [...(scene.choices || []).map(c => c.to), ...(scene.next ? [scene.next] : [])];
  for (const n of next) if (s.scenes[n] && !seen.has(n)) { seen.add(n); queue.push(n); }
}
for (const id of ids) if (!seen.has(id)) errors.push("Unreachable scene: " + id);
const wordCount = Object.values(s.scenes).reduce((n,sc)=>n+sc.text.join(" ").split(/\s+/).filter(Boolean).length,0);
console.log("Scenes:", ids.length, "Reachable:", seen.size, "Text words:", wordCount, "Endings:", endings);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
