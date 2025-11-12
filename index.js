// index.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const PREFIX = '!';
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error('[BOOT] Missing token. Create a .env file with TOKEN=your_token_here');
  process.exit(1);
}

/* ---------- Console banner ---------- */
console.log('\n--------------------------------------------------');
console.log('[BOT ONLINE] Radius Setup Bot Ready ✅');
console.log('Prefix:', PREFIX);
console.log('--------------------------------------------------\n');

/* ---------- Initialize client ---------- */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

/* ---------- Command handler ---------- */
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command && command.name) {
    client.commands.set(command.name, command);
  }
}

/* ---------- Ensure data store ---------- */
const DATA_PATH = path.join(__dirname, 'data.json');
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({}), 'utf8');
function readData() { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8') || '{}'); }
function writeData(obj) { fs.writeFileSync(DATA_PATH, JSON.stringify(obj, null, 2), 'utf8'); }

/* ---------- Message listener ---------- */
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const command = client.commands.get(cmd);
  if (!command) return;

  try {
    await command.execute({ client, message, args, readData, writeData, DATA_PATH });
  } catch (err) {
    console.error(`[CMD ERROR] ${cmd}`, err);
    message.reply('There was an error executing that command. Check console for details.');
  }
});

/* ---------- Login ---------- */
client.once('ready', () => {
  console.log(`[READY] Logged in as ${client.user.tag}`);
});
client.login(TOKEN);