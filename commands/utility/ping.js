module.exports = {
	name: 'ping',
  alias: ['pong', 'heartbeat'],
	description: `Check my heartbeat! Don't worry, it usually works fine.`,
  
	async execute(message, args) {
		const websocketHb = message.client.ws.ping;
		const replyMsg = await message.reply(`<:todd:985806494094196746> Heartbeat: **${websocketHb}**ms...`);
    
    replyMsg.edit(`<:toddHappy:985806499093807165> Heartbeat: **${websocketHb}**ms  //  Roundtrip: **${replyMsg.createdTimestamp - message.createdTimestamp}**ms!`);
	},
};