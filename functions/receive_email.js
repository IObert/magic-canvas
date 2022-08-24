const sgMail = require("@sendgrid/mail");

exports.handler = async function (context, event, callback) {
  sgMail.setApiKey(context.SENDGRID_API_KEY);

  const twilioClient = context.getTwilioClient();

  const regExMagic = /Magic/i;
  const regExMagicName = /Magic,? (\S*)/i;

  function checkForMagic(string) {
    if (regExMagic.test(string)) {
      const nameRes = regExMagicName.exec(string);
      return (nameRes && nameRes[1]) || "Anonymous 🕵️";
    }
  }

  let name = checkForMagic(event.subject) || checkForMagic(event.text);
  const sender = JSON.parse(event.envelope).from;

  if (name) {
    try {
      await twilioClient.sync
        .services(context.SYNC_SERVICE_SID)
        .syncLists("magic_demo_texters")
        .syncListItems.create({
          data: {
            name,
            channel: "email",
          },
        });

      await sgMail.send({
        to: sender,
        from: context.SENDGRID_EMAIL_ADDRESS,
        subject: "Thanks for sending us some Twilio Magic!",
        text: `Nice! Thanks, ${name}, for sending us some Twilio Magic.\n\nWe won't use this email information for ANY proactive communication and redact all log data.\n\nFor more details, please visit www.twilio.com/legal/privacy`,
      });
      callback(null, "Magic received, thanks!");
    } catch (error) {
      callback(error);
    }
  }

  await sgMail.send({
    to: sender,
    from: context.SENDGRID_EMAIL_ADDRESS,
    subject: "Couldn't find magic in this payload",
    text: `Sorry, we couldn't parse your message. Please send "Magic" or "Magic, <your name>" in the subject line or email body.\n\nWe won't use this email information for ANY proactive communication and redact all log data.\n\nFor more details, please visit www.twilio.com/legal/privacy`,
  });
  return callback("Couldn't find magic in this payload");
};
