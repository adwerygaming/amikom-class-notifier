import { Client, Events } from 'discord.js';
import tags from '../utils/Tags.js';
import client from './Client.js';

console.log(`[${tags.System}] Loaded Discord Index Script.`)

// import moment from 'moment-timezone';
import { Reminder } from '../amikom/Reminder.js';
import { CommandHandler } from './CommandHandler.js';
import { Listener } from './Listener.js';

const commandHandler = new CommandHandler();

const listener = new Listener()
const reminder = new Reminder()

client.on(Events.ClientReady, async (bot: Client) => {
  // loads commands
  await commandHandler.loadCommands();
  await commandHandler.loadDropdowns();
  await commandHandler.loadButtons();

  // register commands to discord
  await commandHandler.registerCommands();

  console.log('');
  console.log(`[${tags.Discord}] Connected to Discord API.`);
  console.log(`[${tags.Discord}] Bot Information:`);
  console.log(`[${tags.Discord}] ID           : ${bot?.user?.id ?? '-'}`);
  console.log(`[${tags.Discord}] Username     : ${bot?.user?.username ?? '-'}`);
  console.log(`[${tags.Discord}] Display Name : ${bot?.user?.displayName ?? '-'}`);
  console.log(`[${tags.Discord}] Tags         : ${bot?.user?.discriminator ?? '-'}`);
  console.log(`[${tags.Discord}] Servers      : ${bot?.guilds.cache.size ?? '-'} Server${bot?.guilds?.cache?.size !== 1 ? 's' : ''}`);
  console.log('');

  await reminder.start({
    intervalSeconds: 2,
    // debugTime: moment("10:40", "HH:mm").day(1).tz("Asia/Jakarta")
  })

  await listener.start()
});

client.on(Events.InteractionCreate, async interaction => {
  await commandHandler.handleInteraction(interaction);
});
