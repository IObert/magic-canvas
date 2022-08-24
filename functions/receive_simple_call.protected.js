const GREETINGS = {
  _default: {
    text: "Hi there! Thanks for sending us magic. We won't use your number for ANY proactive communication and redact all log data.",
    language: "en-US",
    voice: "Polly.Joey",
  },
  DE: {
    text: "Hallo! Vielen Dank, dass Sie uns etwas Magie senden. Datenschutz ist uns wichtig, wir werden diese Nummer für keine von uns initiiert Kommunikation verwenden und die Logs regelmäßig löschen.",
    language: "de-DE",
    voice: "Polly.Hans",
  },
};

exports.handler = function (context, event, callback) {
  const translatedGreeting = GREETINGS[event.FromCountry] || GREETINGS._default;

  const twiml = new Twilio.twiml.VoiceResponse();

  twiml.say(
    {
      language: translatedGreeting.language,
      voice: translatedGreeting.voice,
    },
    translatedGreeting.text
  );

  const twilioClient = context.getTwilioClient();

  let request = twilioClient.sync
    .services(context.SYNC_SERVICE_SID)
    .syncLists("magic_demo_texters")
    .syncListItems.create({
      data: { name: "Unknow caller", channel: "voice" },
    });

  request.then(function () {
    callback(null, twiml);
  });
  return;
};
