exports.handler = function (context, event, callback) {
  console.log(`Incoming magic from ${event.name} on channel ${event.channel}.`);

  const client = context.getTwilioClient();
  let request = client.sync
    .services(context.SYNC_SERVICE_SID)
    .syncLists("MagicTexters")
    .syncListItems.create({
      data: { name: event.name, channel: event.channel },
    });

  request.then(function (result) {
    callback(null, "Posted");
  });
};
