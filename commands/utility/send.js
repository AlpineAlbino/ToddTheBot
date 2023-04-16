const fs = require('fs');
const { prefix, emotes } = require('../../config.json');
const discUtils = require('../../utils/disc.js');

const Discord = require('discord.js');

module.exports = {
	name: 'send',
  alias: [],
  description: `Sends a message to a given channel`,
  ownerOnly: true,
  visible: false,
  guildOnly: true,
  usage: {
    args: [
      {
        display: 'channel',
        description: 'the channel to be relayed to',
        type: 'guildChannel',
        optional: false
      },
        {
        display: 'message',
        description: 'the message to be relayed',
        type: 'text',
        optional: false
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[1]) return message.reply(`${emotes.todd} Supply a channel and message to be relayed.`);

    let mentionedChannel = discUtils.getChannel(message.client, message, args[0]);
    if (!mentionedChannel) return message.reply(`${emotes.todd} Invalid channel. Channel must be the first argument.`);

    // grab additional data
    let relayMsg = args.slice(1).join(" ");
    let attachments = message.attachments;
    let attachmentsArr = Array.from(attachments.values());

    await mentionedChannel.send({
      content: relayMsg,
      attachments: attachmentsArr
    })
      .then(msg => {
        message.reply(`${emotes.toddHappy} Sent to ${mentionedChannel}!`);
      })
      .catch(error => {
        message.reply(`${emotes.toddYell} Hunker down! Rogue bullet!\`\`\`${error}\`\`\``);
        console.log(error);
      })
	},
};