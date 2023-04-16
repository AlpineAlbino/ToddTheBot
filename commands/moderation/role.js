const { prefix, emotes } = require('../../config.json');
const discUtils = require('../../utils/disc.js');

module.exports = {
	name: 'role',
  alias: ['roles'],
  description: 'Give or remove roles from users.',
  userPerms: ['MANAGE_ROLES'],
  botPerms: ['MANAGE_ROLES'],
  guildOnly: true,
  usage: {
    args: [{
      display: 'type',
      description: `\`all/rall\` to add/remove all, \`in\\rin\` to add/remove all users to a role.`,
      type: 'text',
      optional: false
    },
    {
      display: 'users',
      description: `users affected by this command`,
      type: 'guildUser',
      dependable: true
    },
    {
      display: 'roles',
      description: `roles affected by this command`,
      type: 'guildRole',
      dependable: true
    }]
  },
  
	async execute(message, args) {
		if (!args[0]) return message.reply(`${emotes.todd} You'll need more arguments on this one. Check \`${prefix}help role\` for more info.`);

    async function editGuildRoles (type, affectedMembers, affectedRoles) {
      if (affectedMembers.size < 1) return message.reply(`${emotes.todd} You forgot to add some members..`);
      if (type !== "strip") {
        if (affectedRoles.size < 1) return message.reply(`${emotes.todd} You forgot to add some roles..`);
      }

      // check if bot can access roles
      let roleError = false;
      affectedRoles.forEach(async (role, id) => {
        if (!roleError) {
          if (role.managed) {
            roleError = true;
            return message.reply(`${emotes.toddSad} Role ${role} is managed by an external service: I can't touch the role!`);
          }
        }

        if (!roleError) {
          const comparePos = role.comparePositionTo(message.guild.me.roles.highest);
          if (comparePos >= 0) {
            roleError = true;
            return message.reply(`${emotes.toddSad} Role ${role} is placed equal or higher than my highest role - ${message.guild.me.roles.highest}: I can't touch the role!`);
          }
        }
      })

      if (roleError) return;
      
      let usersEdited = 0;
      let workingMessage = await message.reply(`${emotes.todd} Going through those Nessverin folders right now.. This might take a while. (ETA: ${affectedMembers.size} second(s))`);
      
      affectedMembers.forEach(async (member, id) => {
        if (type === "add") {
          await member.roles.add(affectedRoles)
            .then(() => {
              usersEdited++;
              if (usersEdited % 5 === 0) workingMessage.edit(`${emotes.todd} Going through those Nessverin folders right now.. This might take a while. (ETA: ${affectedMembers.size - usersEdited} seconds)`)
  
              if (usersEdited >= affectedMembers.size) return workingMessage.edit(`${emotes.toddHappy} Added ${affectedRoles.size} roles to ${affectedMembers.size} users!`);
            })
            .catch(error => {
              return message.reply(`${emotes.toddYell} Hunker down! We've got rogue bullets here!\`\`\`${error}\`\`\``);
            })
        }

        if (type === "remove") {
          await member.roles.remove(affectedRoles)
            .then(() => {
              usersEdited++;
              if (usersEdited % 5 === 0) workingMessage.edit(`${emotes.todd} Going through those Nessverin folders right now.. This might take a while. (ETA: ${affectedMembers.size - usersEdited} seconds)`)
  
              if (usersEdited >= affectedMembers.size) return workingMessage.edit(`${emotes.toddHappy} Removed ${affectedRoles.size} roles from ${affectedMembers.size} users!`);
            })
            .catch(error => {
              return message.reply(`${emotes.toddYell} Hunker down! We've got rogue bullets here!\`\`\`${error}\`\`\``);
            })
        }

        if (type === "set") {
          await member.roles.set(affectedRoles)
            .then(() => {
              usersEdited++;
              if (usersEdited % 5 === 0) workingMessage.edit(`${emotes.todd} Going through those Nessverin folders right now.. This might take a while. (ETA: ${affectedMembers.size - usersEdited} seconds)`)
  
              if (usersEdited >= affectedMembers.size) return workingMessage.edit(`${emotes.toddHappy} Set ${affectedRoles.size} roles for ${affectedMembers.size} users!`);
            })
            .catch(error => {
              return message.reply(`${emotes.toddYell} Hunker down! We've got rogue bullets here!\`\`\`${error}\`\`\``);
            })
        }

        if (type === "strip") {
          await member.roles.set([])
            .then(() => {
              usersEdited++;
              if (usersEdited % 5 === 0) workingMessage.edit(`${emotes.todd} Going through those Nessverin folders right now.. This might take a while. (ETA: ${affectedMembers.size - usersEdited} seconds)`)
  
              if (usersEdited >= affectedMembers.size) return workingMessage.edit(`${emotes.toddHappy} Stripped all roles from ${affectedMembers.size} users!`);
            })
            .catch(error => {
              return message.reply(`${emotes.toddYell} Hunker down! We've got rogue bullets here!\`\`\`${error}\`\`\``);
            })
        }

      })
    };

    if (args[0] === "add") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.mentions.members;

      editGuildRoles("add", affectedMembers, rolesMentioned);
    }

    if (args[0] === "remove") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.mentions.members;

      editGuildRoles("remove", affectedMembers, rolesMentioned);
    }
    
    if (args[0] === "all") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache;

      editGuildRoles("add", affectedMembers, rolesMentioned);
    }

    if (args[0] === "rall") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache;
      
      editGuildRoles("remove", affectedMembers, rolesMentioned);
    }

    if (args[0] === "set") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.mentions.members;
      
      editGuildRoles("set", affectedMembers, rolesMentioned);
    }

    if (args[0] === "strip") {
      let affectedMembers = message.mentions.members;
      let affectedRoles = new Map();

      affectedMembers.forEach(async (member, id) => {
        affectedRoles = new Map([...affectedRoles, ...member.roles.cache]);
      })
      
      editGuildRoles("strip", affectedMembers, affectedRoles);
    }

    if (args[0] === "human") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache.filter(m => !m.user.bot);
      
      editGuildRoles("add", affectedMembers, rolesMentioned);
    }

    if (args[0] === "bot") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache.filter(m => m.user.bot);
      
      editGuildRoles("add", affectedMembers, rolesMentioned);
    }

    if (args[0] === "rhuman") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache.filter(m => !m.user.bot);
      
      editGuildRoles("remove", affectedMembers, rolesMentioned);
    }

    if (args[0] === "rbot") {
      let rolesMentioned = message.mentions.roles;
      let affectedMembers = message.guild.members.cache.filter(m => m.user.bot);
      
      editGuildRoles("remove", affectedMembers, rolesMentioned);
    }

    if (args[0] === "in") {
      let anchorRole = discUtils.getRole(message.client, message, args[1]);
      if (!anchorRole) return message.reply(`${emotes.todd} The anchored role must be the first argument.`);
        
      let rolesMentioned = message.mentions.roles.filter(role => role.id !== anchorRole.id);
      let affectedMembers = message.guild.members.cache.filter(mem => mem.roles.cache.has(anchorRole.id));

      if (affectedMembers.size < 1) return message.reply(`${emotes.toddSad} There ain't anyone with the anchored role ${anchorRole}!`);
      
      editGuildRoles("add", affectedMembers, rolesMentioned);
    }

    if (args[0] === "rin") {
      let anchorRole = discUtils.getRole(message.client, message, args[1]);
      if (!anchorRole) return message.reply(`${emotes.todd} The anchored role must be the first argument.`);
        
      let rolesMentioned = message.mentions.roles.filter(role => role.id !== anchorRole.id);
      let affectedMembers = message.guild.members.cache.filter(mem => mem.roles.cache.has(anchorRole.id));

      if (affectedMembers.size < 1) return message.reply(`${emotes.toddSad} There ain't anyone with the anchored role ${anchorRole}!`);
      
      editGuildRoles("remove", affectedMembers, rolesMentioned);
    }
	},
};