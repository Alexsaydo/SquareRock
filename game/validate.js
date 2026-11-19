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
const engine = require("fs").readFileSync(__dirname + "/index.html", "utf8");
const requiredGateClues = [
  "original_ledger","three_person_scheme","bank_transfer_chain","zorin_document_access",
  "bronze_repair_order","expert_weapon_match","figure_scratch_match","figure_can_be_weapon",
  "zorin_route_window","timeline_rebuilt","last_fifty_minutes","zorin_alibi_gap",
  "home_line_call","station_audio_not_location","sound_timeline_understood","radio_original_confirmed",
  "garage_visit_after_murder","zorin_returned_after_one","zorin_private_warehouse","packing_fabric"
];
for (const clue of requiredGateClues) {
  if (!Object.values(s.scenes).some(scene => (scene.clues || []).includes(clue))) errors.push("Final gate clue is not supplied by any scene: " + clue);
}
if (!engine.includes("function investigationGaps()") || !engine.includes("state.visited.length<24")) errors.push("Final investigation gate or 24-scene minimum is missing");
console.log("Scenes:", ids.length, "Reachable:", seen.size, "Text words:", wordCount, "Endings:", endings);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
