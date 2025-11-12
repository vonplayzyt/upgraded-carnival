// commands/lava.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'lava',
  description: 'Deep clean: removes leftovers the reset missed.',
  async execute({ client, message, readData, writeData }) {
    const guild = message.guild;
    console.log('[Lava] Deep clean initiated for', guild.name);

    const data = readData();
    try {
      console.log('[Lava] Removing leftovers...');

      if (data[guild.id]) {
        const chIds = data[guild.id].channels || [];
        for (const id of chIds) {
          try {
            const ch = guild.channels.cache.get(id);
            if (ch && ch.id !== message.channel.id) {
              await ch.delete('Lava cleanup');
              console.log(`[Lava] Deleted leftover channel: ${ch.name}`);
            }
          } catch (err) {
            console.log(`[Lava] Failed to delete recorded channel ${id}:`, err?.message || err);
          }
        }

        const roleIds = data[guild.id].roles || [];
        for (const id of roleIds) {
          try {
            const role = guild.roles.cache.get(id);
            if (role && !role.managed) {
              await role.delete('Lava cleanup');
              console.log(`[Lava] Deleted leftover role: ${role.name}`);
            }
          } catch (err) {
            console.log(`[Lava] Failed to delete recorded role ${id}:`, err?.message || err);
          }
        }

        delete data[guild.id];
        writeData(data);
      }

      const separator = '︱';
      for (const ch of guild.channels.cache.values()) {
        try {
          if (ch.type === 0 && ch.name.includes(separator) && ch.id !== message.channel.id) {
            await ch.delete('Lava heuristic cleanup');
            console.log(`[Lava] Heuristic deleted channel: ${ch.name}`);
          }
          if (ch.type === 4 && ch.name && (ch.name.includes('Information') || ch.name.includes('IMPORTANT') || ch.name.includes('Radius') || ch.name.includes('support') || ch.name.includes('Community') || ch.name.includes('Admin'))) {
            await ch.delete('Lava heuristic cleanup - category');
            console.log(`[Lava] Heuristic deleted category: ${ch.name}`);
          }
        } catch (err) {}
      }

      const suspiciousRoleNames = ['👑 Owner','⚙️ Admin','🛡️ Moderator','💎 Booster','🤖 Bot','⭐ Member','🔒 Trusted-Script-Access','🧑‍💻 Developer'];
      for (const role of guild.roles.cache.values()) {
        try {
          if (role.managed) continue;
          if (suspiciousRoleNames.includes(role.name) || role.name.includes('Trusted') || role.name.includes('Radius') || role.name.includes('Booster') || role.name.includes('Ticket') || role.name.includes('Developer')) {
            await role.delete('Lava heuristic cleanup');
            console.log(`[Lava] Heuristic deleted role: ${role.name}`);
          }
        } catch (err) {}
      }

      console.log('[Lava] All cleanup complete!');
      await message.reply('Lava cleanup finished. See console for details.');
    } catch (err) {
      console.error('[Lava] Error during lava cleanup:', err);
      await message.reply('An error occurred during lava cleanup. Check console for details.');
    }
  }
};