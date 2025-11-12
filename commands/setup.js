// commands/setup.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'setup',
  description: 'Create server layout with roles, permissions, and channels',
  async execute({ client, message, readData, writeData }) {
    const guild = message.guild;
    const author = message.member;
    console.log('[Setup] Command invoked by', author.user.tag, 'in', guild.name);

    const data = readData();
    if (!data[guild.id]) data[guild.id] = { roles: [], channels: [] };

    // Prevent duplicate setup
    const alreadySetup = (data[guild.id].setupComplete === true);
    if (alreadySetup) {
      message.reply('Setup appears to have already been run in this server. Use !reset to remove or !lava to deep-clean if needed.');
      console.log('[Setup] Aborted - setup already exists for this guild.');
      return;
    }

    try {
      console.log('[Setup] Creating roles...');
      // Roles list (advanced HEX colors)
      const rolesToCreate = [
        { name: '👑 Owner', color: '#FFD166', perms: [PermissionsBitField.Flags.Administrator] },
        { name: '⚙️ Admin', color: '#EF476F', perms: [PermissionsBitField.Flags.Administrator] },
        { name: '🧑‍💻 Developer', color: '#06D6A0', perms: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageChannels] },
        { name: '🛡️ Moderator', color: '#118AB2', perms: [PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ModerateMembers] },
        { name: '💎 Booster', color: '#8338EC' },
        { name: '🤖 Bot', color: '#4CC9F0', perms: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageMessages], hoist: true, mentionable: false },
        { name: '⭐ Member', color: '#F8F32B' },
        { name: '🎓 Verified', color: '#9B5DE5' },
        { name: '🎖️ Trusted', color: '#00B4D8' },
        { name: '🔧 Helper', color: '#FFB4A2', perms: [PermissionsBitField.Flags.ManageMessages] },
        { name: '🎫 Ticket Support', color: '#F77F00' },
        { name: '📣 Announcer', color: '#EF233C' },
        { name: '📷 Media', color: '#2E8B57' },
        { name: '🎮 Gamer', color: '#6A4C93' },
        { name: '🎵 Music', color: '#00A86B' },
        { name: '🔒 Trusted-Script-Access', color: '#3A0CA3' },
        { name: '🧪 Tester', color: '#B5179E' },
        { name: '👥 Guest', color: '#6C757D' }
      ];

      const createdRoles = {};
      for (const r of rolesToCreate) {
        let existing = guild.roles.cache.find(x => x.name === r.name);
        if (existing) {
          createdRoles[r.name] = existing.id;
          console.log(`[Setup] Role exists: ${r.name}`);
          continue;
        }
        const role = await guild.roles.create({
          name: r.name,
          color: r.color || 'Default',
          hoist: r.hoist || false,
          mentionable: r.mentionable || false,
          permissions: r.perms || []
        });
        createdRoles[r.name] = role.id;
        data[guild.id].roles.push(role.id);
        console.log(`[Setup] Created role: ${r.name}`);
      }

      console.log('[Setup] Creating channels...');
      async function createCategory(name, overwrites = []) {
        const existing = guild.channels.cache.find(c => c.name === name && c.type === 4);
        if (existing) {
          console.log(`[Setup] Category exists: ${name}`);
          return existing;
        }
        const cat = await guild.channels.create({
          name,
          type: 4,
          permissionOverwrites: overwrites
        });
        data[guild.id].channels.push(cat.id);
        console.log(`[Setup] Created category: ${name}`);
        return cat;
      }

      const getRole = (name) => guild.roles.cache.get(createdRoles[name]) || guild.roles.cache.find(r => r.name === name);
      const everyone = guild.roles.everyone;

      // Information
      const infoCat = await createCategory('.⁞ Information');
      const infoChannels = [
        '✅︱rules-tos',
        '📖︱rules-tos',
        '👋︱welcome',
        '🚀︱boots-logs',
        '📜︱about-us',
        '🔗︱invite-link'
      ];
      for (const chName of infoChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: infoCat.id,
          permissionOverwrites: [
            { id: everyone.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
            { id: getRole('⚙️ Admin')?.id, allow: ['ManageChannels', 'ManageMessages'] },
            { id: getRole('🛡️ Moderator')?.id, allow: ['ManageMessages'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      // IMPORTANT
      const importantCat = await createCategory('.⁞ IMPORTANT');
      const importantChannels = [
        '📢︱announcements',
        '📣︱sub-announcements',
        '👀︱sneak-peaks',
        '🎉︱giveaways',
        '📺︱showcases',
        '🧰︱utilities',
        '📘︱applications'
      ];
      for (const chName of importantChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: importantCat.id,
          permissionOverwrites: [
            { id: everyone.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
            { id: getRole('📣 Announcer')?.id, allow: ['SendMessages'] },
            { id: getRole('💎 Booster')?.id, allow: ['SendMessages'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      // Admin & Dev category
      const adminCat = await createCategory('🔧 Admin');
      const adminChannels = [
        '🔐︱admin-only',
        '🛠︱developer-logs',
        '🧾︱mod-logs'
      ];
      for (const chName of adminChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: adminCat.id,
          permissionOverwrites: [
            { id: everyone.id, deny: ['ViewChannel'] },
            { id: getRole('⚙️ Admin')?.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] },
            { id: getRole('🧑‍💻 Developer')?.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: getRole('🛡️ Moderator')?.id, allow: ['ViewChannel'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      // Radius Script
      const scriptCat = await createCategory('.⁞ Radius Script');
      const scriptChannels = [
        '📊︱script-status',
        '🔁︱update-logs',
        '📜︱get-script',
        '🔑︱get-key'
      ];
      for (const chName of scriptChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: scriptCat.id,
          permissionOverwrites: [
            { id: everyone.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
            { id: getRole('🔒 Trusted-Script-Access')?.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: getRole('🤖 Bot')?.id, allow: ['ManageMessages', 'SendMessages'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      // Support
      const supportCat = await createCategory('.⁞ support');
      const supportChannels = [
        '🧾︱ticket-panel',
        '🐞︱bug-reports'
      ];
      for (const chName of supportChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: supportCat.id,
          permissionOverwrites: [
            { id: everyone.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
            { id: getRole('🎫 Ticket Support')?.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: getRole('🛡️ Moderator')?.id, allow: ['ManageMessages', 'ManageChannels'] },
            { id: getRole('🤖 Bot')?.id, allow: ['ManageMessages', 'SendMessages'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      // Community
      const communityCat = await createCategory('.⁞ Community');
      const communityChannels = [
        '💬︱chat',
        '🎨︱media',
        '🎵︱music',
        '🕹︱games',
        '🐞︱bug-reports'
      ];
      for (const chName of communityChannels) {
        const ch = await guild.channels.create({
          name: chName,
          type: 0,
          parent: communityCat.id,
          permissionOverwrites: [
            { id: everyone.id, allow: ['ViewChannel', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'UseExternalEmojis', 'AddReactions'] },
            { id: getRole('🤖 Bot')?.id, allow: ['ManageMessages', 'SendMessages'] },
            { id: getRole('🛡️ Moderator')?.id, allow: ['ManageMessages'] }
          ]
        });
        data[guild.id].channels.push(ch.id);
        console.log(`[Setup] Created channel: ${ch.name}`);
      }

      data[guild.id].setupComplete = true;
      writeData(data);

      console.log('[Setup] Setup completed successfully!');
      await message.reply('Server setup completed successfully! Check console for detailed logs.');
    } catch (err) {
      console.error('[Setup] Error during setup:', err);
      await message.reply('An error occurred during setup. Check console for details.');
    }
  }
};