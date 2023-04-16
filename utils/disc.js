const numUtils = require('./number.js');

// snowflake
const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);
const DISCORD_EPOCH = 1420070400000;

module.exports = {
	name: 'discordUtils',
  description: `Discord utilities`,

  // Validates a snowflake ID string and returns a JS Date object if valid
  getSnowflakeDate (snowflake, epoch=DISCORD_EPOCH) {
    function snowflakeConverter (snowflake, epoch=DISCORD_EPOCH) {
      // Convert snowflake to BigInt to extract timestamp bits
  	  // https://discord.com/developers/docs/reference#snowflakes
      const milliseconds = BigInt(snowflake) >> 22n;
  	  return new Date(Number(milliseconds) + epoch);
    }
    
    let checkSnowflake = numUtils.getInteger(snowflake);
    
  	if (checkSnowflake === false) throw new Error("Supplied snowflake is not an integer.");
  	if (checkSnowflake < 4194304) throw new Error("Valid snowflakes are larger.");
  
  	const timestamp = snowflakeConverter(snowflake, epoch);
  	if (Number.isNaN(timestamp.getTime())) throw new Error("Valid snowflakes have fewer digits.");
  
  	return timestamp;
  },

  displayCmdUsage (prefix, command, usage) {
    let displayArgs = [];
    let descArgs = [];
    let usageArray = usage.args;
    const separator = usage.separator || " ";
    
    for (let i = 0; i < usageArray.length; i++) {
      const spreadOpr = (usageArray[i].repeatable) ? "..." : "";
      displayArgs.push((usageArray[i].dependable) ? `<${usageArray[i].display}${spreadOpr}>` : ((usageArray[i].optional) ? `[${usageArray[i].display}${spreadOpr}]` : `{${usageArray[i].display}${spreadOpr}}`));

      // int has defaults
      const intDefText = (usageArray[i].type === "int" && !(!usageArray[i].default)) ? `=${usageArray[i].default}` : "";
      // int has limits
      const typeText = (usageArray[i].type === "int" && !(!usageArray[i].limit)) ? `${usageArray[i].limit[0]} ≤ int${intDefText} ≤ ${usageArray[i].limit[1]}` : `${usageArray[i].type}`;
      descArgs.push(`> \`${usageArray[i].display} (${typeText})\` : ${usageArray[i].description}`);
    }
    
    let display = `Usage: \`${prefix}${command} ${displayArgs.join(`${separator}`)}\`\n${descArgs.join("\n")}`;

    return display;
  },
  
  checkPerms (member, permissions) {
    let missingPerms = [];
    const memberPerms = member.permissions.toArray();
    if (memberPerms.includes('ADMINISTRATOR')) return "";
    
    for (let i = 0; i < permissions.length; i++) {
      if (!memberPerms.includes(permissions[i])) missingPerms.push(`\`${permissions[i]}\``);
    }

    return missingPerms;
  },

	getUser (client, message, mention) {
  	const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) {
      if (!client.users.cache.get(mention)) return;
      return client.users.cache.get(mention);
    };
  
  	const id = matches[1];
  	return client.users.cache.get(id);
  },

  getGuildUser (client, message, mention) {
  	const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) {
      if (!message.guild.members.cache.get(mention)) return;
      return message.guild.members.cache.get(mention);
    };
  
  	const id = matches[1];
  	return message.guild.members.cache.get(id);
  },

  getRole (client, message, mention) {
  	const matches = mention.match(/^<@&!?(\d+)>$/);
  	if (!matches) {
      if (!message.guild.roles.cache.get(mention)) return;
      return message.guild.roles.cache.get(mention);
    };
  
  	const id = matches[1];
  	return message.guild.roles.cache.get(id);
  },

  getChannel (client, message, mention) {
  	const matches = mention.match(/^<#!?(\d+)>$/);
  	if (!matches) {
      if (!client.channels.cache.get(mention)) return;
      return client.channels.cache.get(mention);
    };
  
  	const id = matches[1];
  	return client.channels.cache.get(id);
  },

  getGuildChannel (client, message, mention) {
  	const matches = mention.match(/^<#!?(\d+)>$/);
  	if (!matches) {
      if (!message.guild.channels.cache.get(mention)) return;
      return message.guild.channels.cache.get(mention);
    };
  
  	const id = matches[1];
  	return message.guild.channels.cache.get(id);
  }
}