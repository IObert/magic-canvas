exports.handler = function (context, event, callback) {
  const regExMagic = /Magic/i;
  const regExMagicName = /Magic,? (\S*)/i;

  function checkForMagic(string) {
    if (regExMagic.test(string)) {
      const nameRes = regExMagicName.exec(string);
      const name = (nameRes && nameRes[1]) || "Anonymous 🕵️";

      const twilioClient = context.getTwilioClient();
      return twilioClient.sync
        .services(context.SYNC_SERVICE_SID)
        .syncLists("MagicTexters")
        .syncListItems.create({ data: { name, channel: "email" } });
    }
  }

  const check1 = checkForMagic(event.subject);

  if (check1) {
    check1
      .then(function () {
        callback(null, "Posted");
      })
      .catch(callback);
    return;
  }

  const check2 = checkForMagic(event.text);

  if (check2) {
    check2
      .then(function () {
        callback(null, "Posted");
      })
      .catch(callback);
    return;
  }

  return callback(400);
};
