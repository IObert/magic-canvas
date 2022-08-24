exports.handler = function (context, _, callback) {
  const TWILIO_ACCOUNT_SID = context.TWILIO_ACCOUNT_SID;
  const SERVICE_SID = context.SYNC_SERVICE_SID;
  const API_KEY = context.TWILIO_API_KEY;
  const API_SECRET = context.TWILIO_API_SECRET;

  const response = new Twilio.Response();

  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");
  response.appendHeader("Content-Type", "application/json");

  const IDENTITY = "magic_user";

  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const syncGrant = new SyncGrant({
    serviceSid: SERVICE_SID,
  });

  const accessToken = new AccessToken(TWILIO_ACCOUNT_SID, API_KEY, API_SECRET);

  accessToken.addGrant(syncGrant);
  accessToken.identity = IDENTITY;

  response.setBody({
    token: accessToken.toJwt(),
    number: context.TWILIO_PHONE_NUMBER,
    email: context.SENDGRID_EMAIL_ADDRESS,
    useSendGrid: context.USE_SENDGRID,
    useWhatsApp: context.USE_WHATSAPP,
    useVerify: context.USE_VERIFY,
    autoMagic: context.AUTO_MAGIC,
    autoMagicSender: context.AUTO_MAGIC_SENDER,
  });

  callback(null, response);
};
