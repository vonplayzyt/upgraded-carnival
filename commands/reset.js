// commands/reset.js
module.exports = {
  name: 'reset',
  description: 'Deletes all channels and roles created by the bot (except current channel).',
  async execute({ client, message, readData, writeData }) {
    const guild = message.guild;
    const channelInvoked = message.channel;
    console.log('[Reset] Command invoked in', guild.name);

    const data = readData();
    if (!data[guild.id] || (!Array.isArray(data[guild.id].channels) && !Array.isArray(data[guild.id].roles))) {
      message.reply('No setup data found for this server. Nothing to reset (try !lava to deep-clean).');
      console.log('[Reset] No data for this guild.');
      return;
    }

    try {
      // Remove channels
      console.log('[Reset] Removing channels...');
      const chIds = data[guild.id].channels || [];
      for (const id of chIds) {
        try {
          const ch = guild.channels.cache.get(id);
          if (ch) {
            if (ch.id === channelInvoked.id) {
              console.log(`[Reset] Skipped deleting the invoking channel: ${ch.name}`);
              continue;
            }
            await ch.delete(`Reset by ${message.author.tag}`);
            console.log(`[Reset] Deleted channel: ${ch.name}`);
          } else {
            console.log(`[Reset] Channel not found (maybe already deleted): ${id}`);
          }
        } catch (err) {
          console.log(`[Reset] Failed to delete channel ${id}:`, err?.message || err);
        }
      }

      // Remove roles
      console.log('[Reset] Removing roles...');
      const roleIds = data[guild.id].roles || [];
      for (const id of roleIds) {
        try {
          const role = guild.roles.cache.get(id);
          if (role) {
            if (role.managed || role.name === '@everyone') {
              console.log(`[Reset] Skipped managed or @everyone role: ${role.name}`);
              continue;
            }
            await role.delete(`Reset by ${message.author.tag}`);
            console.log(`[Reset] Deleted role: ${role.name}`);
          } else {
            console.log(`[Reset] Role not found (maybe already deleted): ${id}`);
          }
        } catch (err) {
          console.log(`[Reset] Failed to delete role ${id}:`, err?.message || err);
        }
      }

      delete data[guild.id];
      writeData(data);
      console.log('[Reset] Done!');
      await message.reply('Reset complete. Created channels and roles removed (see console).');
    } catch (err) {
      console.error('[Reset] Error during reset:', err);
      await message.reply('An error occurred during reset. Check console for details.');
    }
  }
};