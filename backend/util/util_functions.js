import { discord, supabase } from "./clients.js";
import axios from "axios";

/**
 * Retrieves the timestamp of the last visible client message in a specific channel associated with a campaign creator.
 *
 * @param {string} campaignId - The unique identifier of the campaign.
 * @param {Object} creator - An object representing the campaign creator.
 * @param {string} creator.discord_ign - The Discord username of the creator used to retrieve the associated channel.
 * @return {Promise<Date|null>} A promise that resolves to the timestamp of the last client message as a Date object, or null if no such message exists or an error occurs.
 */
async function getLastClientMessageTime(campaignId, creator = null) {
  try {
    if (creator) {
      // Check the specific creator's channel
      const channel = await discord.channels.fetch(creator.channel_id);
      if (!channel) return null;

      const messages = await channel.messages.fetch({ limit: 50 });

      // The only bot would be WARM, and we're not looking at messages not sent by the client through the bot
      const clientMessages = messages.filter(
        (msg) =>
          msg.author.bot &&
          !msg.content.toLowerCase().startsWith("[hidden from clients]"),
      );

      if (clientMessages.size > 0) {
        const latestTime = Math.max(
          ...clientMessages.map((msg) =>
            new Date(msg.createdTimestamp).getTime(),
          ),
        );
        return new Date(latestTime);
      }
      return null;
    }

    // If no specific creator, check all channels for this campaign
    const { data: campaignCreators } = await supabase
      .from("campaign_creators")
      .select("channel_id")
      .eq("campaign_id", campaignId);

    if (!campaignCreators?.length) return null;

    let latestMessageTime = null;

    // Check each creator's channel
    for (const creator of campaignCreators) {
      try {
        const channel = await discord.channels.fetch(creator.channel_id);
        if (!channel) continue;

        const messages = await channel.messages.fetch({ limit: 50 });
        const clientMessages = messages.filter(
          (msg) =>
            msg.author.bot &&
            !msg.content.toLowerCase().startsWith("[hidden from clients]"),
        );

        if (clientMessages.size > 0) {
          const channelLatestTime = Math.max(
            ...clientMessages.map((msg) =>
              new Date(msg.createdTimestamp).getTime(),
            ),
          );

          if (!latestMessageTime || channelLatestTime > latestMessageTime) {
            latestMessageTime = channelLatestTime;
          }
        }
      } catch (error) {
        console.error(`Error checking channel ${creator.channel_id}:`, error);
        continue;
      }
    }

    return latestMessageTime ? new Date(latestMessageTime) : null;
  } catch (error) {
    console.error("Error getting last client message time:", error);
    return null;
  }
}

/**
 * Gets a binary (yes/no) answer from ChatGPT based on the user input and prompt question
 * @param {string} userInput - The context or input to analyze
 * @param {string} promptQuestion - The specific yes/no question to ask about the userInput
 * @returns {Promise<boolean|null>} - Returns true for yes, false for no, null if unable to determine
 */
async function getBinaryGPTAnswer(userInput, promptQuestion) {
  try {
    const systemPrompt = `You are a binary decision maker. You must analyze the provided input and answer the question with ONLY "yes" or "no". Do not include any other words or explanation.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Based on this input: "${userInput}", ${promptQuestion}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const answer = response.data.choices[0]?.message?.content
      .toLowerCase()
      .trim();

    if (answer === "yes") return true;
    if (answer === "no") return false;

    return null;
  } catch (error) {
    console.error("Error getting GPT binary answer:", error);
    return null;
  }
}

/**
 * Analyzes a conversation to determine if it requires a response from the creator.
 * The function evaluates the last few messages of the conversation to decide if there are unfinished tasks,
 * unanswered questions, or any scenario that would require the creator's attention, while ignoring irrelevant content such as pleasantries.
 *
 * @param {Array<Object>} messages An array of message objects, where each message contains properties like 'timestamp', 'content',
 * and 'bot' (a flag indicating if the message was sent by the bot or client).
 * @return {Promise<Boolean>} A promise that resolves to a boolean value indicating whether the conversation needs a response from the creator (`true`) or not (`false`).
 */
async function analyzeConversationGhost(messages) {
  // Sort messages by timestamp
  const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

  // Get the last few messages for context (up to 5)
  const recentMessages = sortedMessages
    .slice(-5)
    .map((msg) => {
      const role = msg.bot ? "Client" : "Creator";
      return `${role}: ${msg.content}`;
    })
    .join("\n");

  const prompt = `Based on this conversation, does it require a response from the creator? Consider:
1. If the last message is from the client and needs a response
2. If there's an unanswered question
3. If there's a pending request or task
4. Ignore pleasantries like "thanks!" that don't need responses
5. The conversation should be considered "hanging" only if the creator needs to respond

Conversation:
${recentMessages}`;

  return await getBinaryGPTAnswer(recentMessages, prompt);
}

/**
 * Fetches messages from a Discord channel and filters them based on optional criteria.
 * Filters out messages that start with "[hidden from clients]" or fall outside the specified time frame.
 *
 * @param {string} channel_id - The unique identifier of the Discord channel to fetch messages from.
 * @param {number|null} [hoursAgo=null] - The number of hours back from the current time to filter messages. If null, all recent messages are included.
 * @return {Promise<Array<{content: string, bot: boolean, author: string, timestamp: number}>>|null}
 *         A promise that resolves to an array of message objects containing content, bot status, author, and timestamp properties.
 *         Returns `null` if the channel is not found or an error occurs during the fetch operation.
 */
async function getChannelMessages(channel_id, hoursAgo = null) {
  try {
    const channel = await discord.channels.fetch(channel_id);
    if (!channel) return null;

    const messages = await channel.messages.fetch({ limit: 50 });
    const now = new Date();

    let filteredMessages = messages
      .filter(
        (msg) => !msg.content.toLowerCase().startsWith("[hidden from clients]"),
      )
      .map((msg) => ({
        content: msg.content,
        bot: msg.author.bot,
        author: msg.author.username,
        timestamp: msg.createdTimestamp,
      }));

    // If hoursAgo is specified, filter messages within that time frame
    if (hoursAgo) {
      const cutoffTime = now.getTime() - hoursAgo * 60 * 60 * 1000;
      filteredMessages = filteredMessages.filter(
        (msg) => msg.timestamp >= cutoffTime,
      );
    }

    return filteredMessages;
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    return null;
  }
}

export {
  getLastClientMessageTime,
  getBinaryGPTAnswer,
  analyzeConversationGhost,
  getChannelMessages,
};
