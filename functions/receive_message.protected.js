exports.handler = function (context, event, callback) {
  const twiml = new Twilio.twiml.MessagingResponse();
  const regExMagic = /Magic/i;
  const regExMagicName = /Magic,? (\S*)/i;

  if (regExMagic.test(event.Body)) {
    const nameRes = regExMagicName.exec(event.Body);
    const name = (nameRes && nameRes[1]) || "Anonymous 🕵️";

    const isWhatsapp = event.To.includes("whatsapp:");
    const channel = isWhatsapp ? "whatsapp" : "sms";
    twiml.message(
      { to: event.From },
      `Nice! Thanks, ${name}, for sending us some Twilio Magic.\n\nWe won't use this number for ANY proactive communication and redact all log data.\n\nFor more details, please visit www.twilio.com/legal/privacy`
    );

    const twilioClient = context.getTwilioClient();

    let request = twilioClient.sync
      .services(context.SYNC_SERVICE_SID)
      .syncLists("magic_demo_texters")
      .syncListItems.create({ data: { name, channel } });

    request.then(function () {
      callback(null, twiml);
    });
    return;
  }

  twiml.message(
    { to: event.From },
    `Sorry, we couldn't parse your message. Please send "Magic" or "Magic, <your name>".`
  );

  return callback(null, twiml);
};
