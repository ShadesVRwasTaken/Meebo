// meebo.js - Matrix Browser Native Edition

// 1. Bot Configuration
const HOMESERVER_URL = "https://matrix.org";
const BOT_USERNAME = "@meebo:matrix.org";
const BOT_PASSWORD = "ColdLeg6932";
const OWNER_USERNAME = "@ilikegrapes:matrix.org";

// 2. Meebo's Brain & Storage
let brain = {};
const STORAGE_KEY = `meebo_brain_${BOT_USERNAME}`;

function loadBrain() {
try {
const savedBrain = localStorage.getItem(STORAGE_KEY);
if (savedBrain) {
brain = JSON.parse(savedBrain);
window.logToScreen(`Loaded ${Object.keys(brain).length} word-associations from memory.`);
} else {
window.logToScreen("Brain is currently empty. Ready to learn!");
}
} catch (e) {
window.logToScreen("Failed to load brain from storage.", true);
}
}

function saveBrain() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(brain));
} catch (e) {
window.logToScreen("Failed to save brain.", true);
}
}

function eraseBrain() {
brain = {};
localStorage.removeItem(STORAGE_KEY);
window.logToScreen("EMERGENCY WIPE: Memory erased!");
}

function learnFromSentence(text) {
if (text.toLowerCase().includes("wipe memory")) return;
const words = text.toLowerCase().trim().split(/\s+/);
if (words.length < 2) return;

for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!brain[currentWord]) brain[currentWord] = [];
if (!brain[currentWord].includes(nextWord)) {
brain[currentWord].push(nextWord);
}
}
saveBrain();
}

function generateReply(starterText) {
const words = starterText.toLowerCase().trim().split(/\s+/);
let currentWord = words[Math.floor(Math.random() * words.length)];

if (!brain[currentWord]) {
const keys = Object.keys(brain);
if (keys.length === 0) return "I am still learning...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}

let sentence = [currentWord];
for (let i = 0; i < 10; i++) {
const possibilities = brain[currentWord];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
currentWord = nextWord;
}
return sentence.join(" ");
}

// 3. Start the Global Matrix Client
const client = globalThis.matrixcs.createClient({
baseUrl: HOMESERVER_URL,
userId: BOT_USERNAME
});

async function startMeebo() {
loadBrain();
window.logToScreen("Attempting login to Matrix...");

// Authenticate with server
await client.login("m.login.password", { user: BOT_USERNAME, password: BOT_PASSWORD });
window.logToScreen("Login successful! Starting sync...");

await client.startClient({ initialSyncLimit: 5 });
window.logToScreen("Meebo is fully active and listening for room invites/messages!");

client.on("Room.timeline", function(event, room, toStartOfTimeline) {
if (toStartOfTimeline) return;
if (event.getType() !== "m.room.message") return;
if (event.getSender() === BOT_USERNAME) return;

const messageText = event.getContent().body;
if (!messageText) return;
const sender = event.getSender();

window.logToScreen(`Heard in room: "${messageText}"`);

// Emergency Wipe Check
if (messageText.toLowerCase() === "meebo wipe memory") {
if (sender === OWNER_USERNAME) {
eraseBrain();
client.sendTextMessage(room.roomId, "🚨 Memory entirely wiped. I am a blank slate again!");
} else {
client.sendTextMessage(room.roomId, "❌ Access Denied: You are not my creator.");
}
return;
}

// Training
learnFromSentence(messageText);

// Reply Trigger
if (messageText.toLowerCase().includes("meebo")) {
const reply = generateReply(messageText);
client.sendTextMessage(room.roomId, reply);
window.logToScreen(`Replied with: "${reply}"`);
}
});
}

startMeebo().catch(err => {
window.logToScreen(err.message || err, true);
});

