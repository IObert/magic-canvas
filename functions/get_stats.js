exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();

  const filterDate = new Date(event.after);

  try {
    const syncList = client.sync.v1
      .services(context.SYNC_SERVICE_SID)
      .syncLists("magic_demo_texters");
    const items = await syncList.syncListItems.list();

    const stats = items.reduce(function (counter, item) {
      if(event.after && item.dateCreated < filterDate){
        return counter;
      }
      if (!counter[item.data.channel]) {
        counter[item.data.channel] = 0;
      }
      counter[item.data.channel]++;

      return counter;
    }, {});
    callback(null, stats);
  } catch (error) {
    callback(error);
  }
};
