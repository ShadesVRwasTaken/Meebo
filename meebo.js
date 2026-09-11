// meebo.js - A Matrix Learning Bot with persistent memory and an emergency reset command
import { createMatrixClient } from 'https://jsdelivr.net';

// 1. Bot Configuration
const HOMESERVER_URL = "https://matrix.org";
const BOT_USERNAME = "@meebo:matrix.org";
const BOT_PASSWORD = "ColdLeg6932";

// 🔐 SECURITY: Replace this with your exact Matrix username so only YOU can reset Meebo
const OWNER_USERNAME = "@meebo:matrix.org";

// 2. Meebo's Brain
let brain = {};
const STORAGE_KEY = `meebo_brain_${BOT_USERNAME}`;

function loadBrain() {
try {
const savedBrain = localStorage.getItem(STORAGE_KEY);
if (savedBrain) {
brain = JSON.parse(savedBrain);
console.log(`🧠 Meebo loaded ${Object.keys(brain).length} word-associations.`);
} else {
console.log("🧠 Meebo's brain is empty.");
}
} catch (e) {
console.error("Failed to load brain:", e);
}
}

function saveBrain() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(brain));
} catch (e) {
console.error("Failed to save brain:", e);
}
}

// 🚨 THE EMERGENCY RESET FUNCTION
function eraseBrain() {
brain = {}; // Clear RAM
localStorage.removeItem(STORAGE_KEY); // Wipe browser hard drive storage
console.log("🚨 EMERGENCY WIPE EXECUTE: Meebo's brain has been entirely erased.");
}

function learnFromSentence(text) {
// If the message contains the secret wipe command, don't learn it
if (text.toLowerCase().includes("wipe memory")) return;

const words = text.toLowerCase().trim().split(/\s+/);
if (words.length < 2) return;

for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!brain[currentWord]) {
brain[currentWord] = [];
}
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

// 3. Initialize and Start Meebo
const client = createMatrixClient({
baseUrl: HOMESERVER_URL,
userId: BOT_USERNAME
});

async function startMeebo() {
loadBrain();

console.log("Meebo is logging in...");
await client.login("m.login.password", { user: BOT_USERNAME, password: BOT_PASSWORD });
await client.startClient({ initialSyncLimit: 5 });

console.log("🚀 Meebo is active and fully protected.");

client.on("Room.timeline", function(event, room, toStartOfTimeline) {
if (toStartOfTimeline) return;
if (event.getType() !== "m.room.message") return;
if (event.getSender() === BOT_USERNAME) return;

const messageText = event.getContent().body;
if (!messageText) return;
const sender = event.getSender();

// 🚨 CHECK FOR EMERGENCY WIPE COMMAND
if (messageText.toLowerCase() === "meebo wipe memory") {
if (sender === OWNER_USERNAME) {
eraseBrain();
client.sendTextMessage(room.roomId, "🚨 Memory entirely wiped. I am a blank slate again!");
} else {
client.sendTextMessage(room.roomId, "❌ Access Denied: You are not my creator.");
}
return; // Stop processing this message immediately
}

// Train Meebo if it's a normal message
learnFromSentence(messageText);

// If someone addresses Meebo
if (messageText.toLowerCase().includes("meebo")) {
const reply = generateReply(messageText);
client.sendTextMessage(room.roomId, reply);
}
});
}

startMeebo().catch(err => console.error("Meebo encountered an error:", err));

