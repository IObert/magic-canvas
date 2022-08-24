exports.handler = async function (context, event, callback) {
  // The Twilio node Client library
  const client = context.getTwilioClient();

  // With all of our resources created, we need to store some
  // of them inside our hosted ENV in order for use later
  const environment = await getCurrentEnvironment();
  const phoneNumberSid = await getPhoneNumberSid();

  // Check if we already ran and prevent duplicate setups.
  const minimalSetupPresent =
    context.SYNC_SERVICE_SID &&
    context.TWILIO_API_KEY &&
    context.TWILIO_API_SECRET;
  if (!minimalSetupPresent) {
    const key = await createApiKey();
    await createEnvironmentVariable(environment, "TWILIO_API_KEY", key.sid);
    await createEnvironmentVariable(
      environment,
      "TWILIO_API_SECRET",
      key.secret
    );
    console.log(`API Key ${key.sid} created and stored in environment.`);

    const syncService = await createSyncService();
    await createEnvironmentVariable(
      environment,
      "SYNC_SERVICE_SID",
      syncService.sid
    );
    console.log(
      `Sync Service created: ${syncService.sid} and stored in environment.`
    );

    const syncList = await createSyncList(syncService.sid);
    console.log("Sync List created: " + syncList.sid);

    await unbindPhoneFromMessagingServices(phoneNumberSid);
    const messagingService = await createMessagingService();
    await assignNumberToMessagingService(phoneNumberSid, messagingService.sid);
    console.log(
      `Messaging service ${messagingService.sid} assigned to ${phoneNumberSid}`
    );
  }

  if (!context.VERIFY_SERVICE_SID && context.USE_VERIFY) {
    const verifyService = await createVerifyService();
    await createEnvironmentVariable(
      environment,
      "VERIFY_SERVICE_SID",
      verifyService.sid
    );
    console.log(
      `Verify Service ${verifyService.sid} created and stored in environment`
    );
  }

  if (!context.ADVANCED_VOICE) {
    await updatePhoneNumberWebhook(
      phoneNumberSid,
      "voiceUrl",
      `https://${context.DOMAIN_NAME}/receive_simple_call`
    );
    console.log(
      `Phone number ${phoneNumberSid} updated with simple voice flow`
    );
  } else {
    const flow = await deployStudioFlow();
    await updatePhoneNumberWebhook(phoneNumberSid, "voiceUrl", flow.webhookUrl);
    console.log(
      `Phone number ${phoneNumberSid} updated with complex voice flow`
    );
  }

  // This will end the function!
  return callback(null, "Setup successfully ran!");

  /**
   *
   * HELPER FUNCTIONS
   *
   */

  // Creating API Key for use with Sync later
  function createApiKey() {
    return client.newKeys
      .create({ friendlyName: "magic_demo_keys" })
      .catch((err) => {
        throw new Error(err.details);
      });
  }

  // Sync Service will be the data-store and event broadcaster
  function createSyncService() {
    return client.sync.services
      .create({ friendlyName: "magic_demo_sync" })
      .catch((err) => {
        throw new Error(err.details);
      });
  }

  // Verify Service will be used to send OTPs
  function createVerifyService() {
    return client.verify.v2.services.create({
      friendlyName: "magic_demo_verify",
    });
  }

  // Sync Service will be the data-store and event broadcaster
  function createMessagingService() {
    return client.messaging.v1.services
      .create({
        friendlyName: "magic_demo_messaging",
        inboundRequestUrl:
          "https://" + context.DOMAIN_NAME + "/receive_message",
        inboundMethod: "POST",
      })
      .catch((err) => {
        throw new Error(err.details);
      });
  }

  // The Sync List will be where specifically our magic_demo_texters live
  function createSyncList(serviceSid) {
    return client.sync
      .services(serviceSid)
      .syncLists.create({
        uniqueName: "magic_demo_texters",
      })
      .catch((err) => {
        throw new Error(err.details);
      });
  }

  // Get the SID of the number previously specified in the ENV
  function getPhoneNumberSid() {
    return new Promise((resolve, reject) => {
      client.incomingPhoneNumbers
        .list({
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
          limit: 1,
        })
        .then((incomingPhoneNumbers) => {
          const n = incomingPhoneNumbers[0];
          resolve(n.sid);
        })
        .catch((err) => reject(err));
    });
  }

  // Deploy a new Studio flow
  function deployStudioFlow() {
    return new Promise((resolve, reject) => {
      const flowDefinitionAsset =
        Runtime.getAssets()["/flows/receive_call.json"];
      const definition = flowDefinitionAsset
        .open()
        .replace(/magic-demo-\d+-dev.twil.io/g, context.DOMAIN_NAME);
      client.studio.v2.flows
        .create({
          commitMessage: "Deployed via setup script",
          friendlyName: "Complex Magic handler",
          status: "published",
          definition,
        })
        .then((flow) => {
          console.log(`Flow ${flow.sid} deployed`);
          resolve(flow);
        })
        .catch((err) => reject(err));
    });
  }

  async function unbindPhoneFromMessagingServices(phoneNumberSid) {
    const allServices = await client.messaging.v1.services.list();
    await Promise.all(
      allServices.map(async (service) => {
        const mapping = client.messaging.v1
          .services(service.sid)
          .phoneNumbers(phoneNumberSid);
        try {
          await mapping.fetch();
        } catch (e) {
          const RESOURCE_NOT_FOUND = e.code === 20404;
          if (RESOURCE_NOT_FOUND) {
            return;
          }
          throw e;
        }
        await mapping.remove();
        console.log(
          `The phone number was decoupled from messaging service ${service.sid}.`
        );
      })
    );
  }

  // Assing the phone number to the newly created Messaging service
  function assignNumberToMessagingService(phoneNumberSid, serviceSid) {
    return new Promise((resolve, reject) => {
      client.messaging.v1
        .services(serviceSid)
        .phoneNumbers.create({
          phoneNumberSid,
        })
        .then(resolve)
        .catch((err) => reject(err));
    });
  }

  // Using the number's SID, update it's webhook to the Function
  function updatePhoneNumberWebhook(numberSid, prop, value) {
    return new Promise((resolve, reject) => {
      client
        .incomingPhoneNumbers(numberSid)
        .update({
          [prop]: value,
        })
        .then(() => {
          resolve("success");
        })
        .catch((err) => reject(err));
    });
  }

  // In the steps above we'll need to get the current environment
  // based on the domain name this function is running in
  async function getCurrentEnvironment() {
    if (context.DOMAIN_NAME && context.DOMAIN_NAME.startsWith("localhost")) {
      return;
    }
    const services = await client.serverless.services.list();
    for (let service of services) {
      console.log(
        "Searching for environment. Looping through service: " + service.sid
      );
      const environments = await client.serverless
        .services(service.sid)
        .environments.list();
      const environment = environments.find(
        (env) => env.domainName === context.DOMAIN_NAME
      );
      if (environment) {
        // Exit the function
        return environment;
      }
    }
  }

  // With the environment specified, we use the Twilio REST API
  // to set new envronment variables. Note, this will throw an
  // error if exists. Hence the duplicate check up top.
  async function createEnvironmentVariable(environment, key, value) {
    try {
      if (!environment) {
        throw new Error("No Env!");
      }
      console.log(`Creating variable ${key}`);
      await client.serverless
        .services(environment.serviceSid)
        .environments(environment.sid)
        .variables.create({
          key: key,
          value: value,
        });
    } catch (err) {
      console.error(`Error creating '${key}' with '${value}': ${err}`);
      return false;
    }
    return true;
  }
};
