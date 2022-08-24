# Live Magic Showcase

An interactive chart visualizes magical events that are triggered by numerous Twilio services. Each incoming event triggers the sparkles on the dashboard, showing the channel that triggered it and the sender's name.

![Magic Canvas](./docs/MagicCanvas.gif)

# Supported Channels

Depending on the channel that delivers the sparkling event, a different product logo pops up between "Software Applications" and "Communication Systems".

## Voice

The voice channel is triggered with a call to the number in the -right corner. By default, a simple call is enough to trigger the sparkles with an "Unknown User".
During setup, there is an option (`ADVANCED_VOICE`) to invoke a Studio flow IVR that first asks the caller for the passcode ("Magic") and then optionally for their name. If the caller provides a name, this name is displayed on the Magic Canvas.

`#Voice`, `#IVR`, `#Studio`

## Messaging

Incoming text messages that contain the word "magic" trigger this animation. If the user wants to print a name on the canvas, they need to add their name right after the keyword. I.e., the message should be something like "Magic IObert".

`#MessagingService`, `#SMS`, `#Function`

## WhatsApp

This channel works the same way as the [messaging channel](#messaging), except that the message needs to be a WhatsApp message instead of an SMS.

`#MessagingService`, `#WhatsApp`, `#Function`

## Email

The sparkles will ignite when the user sends an email to the displayed address. The function that handles the logic of the inbound parse first checks if the subject line contains the keyword "magic" and possibly the sender's name. If not, it applies the same check to the payload of the email and triggers the animation accordingly.

`#SendGrid`, `#InboundParse`, `#Function`

## Verify

The users can initiate a verification flow with the form accessible under `https://magic-demo-<id>-dev.twil.io/verify.html`. This form lets them request a One-Time-Password (OTP) via any of the above channels and optionally enter their alias. A dialog will pop up, and they can enter the OTP they received. Each successful verification will trigger the sparkles, and the Verify logo will pop up.

`#Verify`, `#SendGrid`, `#Function`

# Prerequisites

- Node v14+
- [Twilio Account](https://www.twilio.com/try-twilio)
- [Buy a phone number](https://support.twilio.com/hc/en-us/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console) (voice and text enabled)
- Optional: [WhatsApp enabled the number](https://www.twilio.com/whatsapp/request-access)
- Optional: A [SendGrid account](https://signup.sendgrid.com/) with an [authenticated domain](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- Optional: Prepare the SendGrid account [for Verify](https://www.twilio.com/docs/verify/email#set-up-your-sendgrid-account)

# Installation Guide

## Setup

1. To install this demo to your account, you need to clone the repo

   ```Bash
   git clone git@github.com:IObert/magic-canvas.git
   cd magic-canvas
   npm install
   ```

2. Make a copy of the `.env.sample` file and name it `.env`. Make sure that you define the variables `ACCOUNT_SID`, `AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`. Optionally, you can also set `ADVANCED_VOICE=true` to use an IVR that requests a password from the caller.

3. Now it's time to deploy the project

   ```Bash
   npm run deploy
   ```

4. This project leverages [Twilio Functions](https://www.twilio.com/docs/runtime/functions) to relieve you from manually creating the messaging service and Studio flow. Once the project is deployed, access the "setup page" to run the setup script that creates the artifacts and ties them together. The URL of this page follows this pattern: `https://magic-demo-<ID HERE>-dev.twil.io/setup`.

5. Access the dashboard to see the instructions and magic animations.

   `https://magic-demo-<ID HERE>-dev.twil.io/index.html`.

By default, the following channels are enabled on the Magic Canvas:

- Voice
- Messaging

If you want to enable more channels, follow the instructions in the next section.

## Additional Channels

### Auto-Magic

You can activate "Auto-Magic" to avoid void on the dashboard. Set the environment variable `AUTO_MAGIC=true` to add some random sparkles every few minutes. With `AUTO_MAGIC_SENDER=Marius` you can add a sender/message of these animations.

### WhatsApp

Unfortunately, the setup script cannot add WhatsApp senders to a messaging service. This means it's up to you to (a) [request to enable your Twilio numbers for WhatsApp](https://www.twilio.com/whatsapp/request-access) and (b) [add WhatsApp senders to your messaging service](https://support.twilio.com/hc/en-us/articles/223181308-Getting-started-with-Messaging-Services#h_01F906R1JEWZA226ZR3CKR0Y4F).

Once completed, set the environment variable `USE_WHATSAPP=true` to display the WhatsApp instructions on the dashboard.

![WhatsApp Instructions](./docs/WhatsAppInstructions.png)

### SendGrid

Use [Inbound Parse](https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook) from Twilio SendGrid to listen to trigger events in a Function on incoming emails.

> Unfortunately, Inbound Parse uses `content-type: multipart/form-data` and functions [can only handle](https://stackoverflow.com/questions/73304225/email-to-sms-using-sendgrid-inboundparse-and-twilio/73307939?noredirect=1#comment129504368_73307939) `content-type: application/json`. Therefore, you need to use a middleware to convert the content type, as [this project / Docker image](https://github.com/IObert/content-type-converter) does.

Once you connect the Inbound Parse and the function, set the environment variable `USE_SENDGRID=true` and `SENDGRID_EMAIL_ADDRESS=magic@sample.com`
to display the Email instructions on the dashboard.

![Email Instructions](./docs/EmailInstructions.png)
The user will also receive an email recipe once the email has been received. To successfully send this recipe, create a restricted [SendGrid API Key](https://docs.sendgrid.com/ui/account-and-settings/api-keys#creating-an-api-key) with the permission "Mail Send". This key should be the value of the `SENDGRID_API_KEY` environment variable.

### Verify

Set the environment variable `USE_VERIFY=true` and run the setup script (again) to create the required Verify service. Then you can open the "Verify" demo page to use the form to receive your One-Time-Password (OTP). The URL of the page follows this pattern:

`https://magic-demo-<ID HERE>-dev.twil.io/verify.html`.

Every success verification will then trigger the magic animation on the dashboard.

> There is one additional step needed to use [Email Verifications](https://www.twilio.com/docs/verify/email#set-up-your-sendgrid-account) with Twilio SendGrid.
