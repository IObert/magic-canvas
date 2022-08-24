const GREETINGS = {
  _default: {
    text: "Hi there! Thanks for sending us magic",
    language: "en-US",
    voice: "Polly.Joey",
  },
  DE: {
    text: "Hallo! Vielen Dank, dass Sie uns etwas Magie senden",
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
