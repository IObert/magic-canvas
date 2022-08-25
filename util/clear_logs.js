const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN
);

const number = process.env.TWILIO_PHONE_NUMBER.replaceAll(" ", "");

(async () => {
  let sentMessages = await client.messages.list({
    from: `whatsapp:${number}`,
  });
  let receivedMessages = await client.messages.list({
    to: `whatsapp:${number}`,
  });

  await Promise.all(
    [...sentMessages, ...receivedMessages].map(async (message) => {
      await client.messages(message.sid).remove();
      console.log(message.body);
    })
  );
  console.log(
    `Deleted ${
      sentMessages.length + receivedMessages.length
    } WhatsApp messages successfully.`
  );

  sentMessages = await client.messages.list({
    from: number,
  });
  receivedMessages = await client.messages.list({
    to: number,
  });

  await Promise.all(
    [...sentMessages, ...receivedMessages].map(async (message) => {
      await client.messages(message.sid).remove();
      console.log(message.body);
    })
  );
  console.log(
    `Deleted ${
      sentMessages.length + receivedMessages.length
    } messages successfully.`
  );

  const outgoingCalls = await client.calls.list({
    from: number,
  });
  const incomingCalls = await client.calls.list({
    to: number,
  });

  await Promise.all(
    [...outgoingCalls, ...incomingCalls].map(async (call) => {
      await client.calls(call.sid).remove();
    })
  );
  console.log(
    `Deleted ${outgoingCalls.length + incomingCalls.length} calls successfully.`
  );
})();
