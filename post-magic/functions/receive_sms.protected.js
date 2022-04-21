exports.handler = function (context, event, callback) {
  const regExMagic = /Magic/i;
  const regExMagicName = /Magic,? (\S*)/i;
  const twiml = new Twilio.twiml.MessagingResponse();

  if (regExMagic.test(event.Body)) {
    const nameRes = regExMagicName.exec(event.Body);
    const name = (nameRes && nameRes[1]) || "Anonymous 🕵️";
    twiml.message(
      { to: event.From },
      `Nice! Thanks ${name} for sending us some Twilio Magic.`
    );

    const twilioClient = context.getTwilioClient();

    let request = twilioClient.sync
      .services(context.SYNC_SERVICE_SID)
      .syncLists("MagicTexters")
      .syncListItems.create({ data: { name } });

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
