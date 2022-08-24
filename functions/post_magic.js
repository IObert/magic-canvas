exports.handler = function (context, event, callback) {
  console.log(`Incoming magic from ${event.name} on channel ${event.channel}.`);

  const client = context.getTwilioClient();
  const name = event.name || "Anonymous 🕵️";
  let request = client.sync
    .services(context.SYNC_SERVICE_SID)
    .syncLists("magic_demo_texters")
    .syncListItems.create({
      data: { name, channel: event.channel },
    });

  request.then(function (result) {
    callback(null, "Posted");
  });
};
