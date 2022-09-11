# Download Telegram Bot

> Downloads forwarded contents from Telegram to your local computer

To run this project locally, you need to:

1. Copy the `.env.example` file to `.env`
   1. Fill the `telegramToken` field (available via [@BotFather](https://t.me/BotFather)).
   1. Fill the `authorizedUsers` field with comma-separated ids of allowed users to talk with the bot (tip: use [@userinfobot](https://t.me/userinfobot))
   1. Optionally, fill `downloadsFolder` field with desired target folder for downloaded files, or delete this field to use the default value (`../telegramDownloads`).
      > ⚠️ Leave this field empty is not allowed, and will not work! If you desire the default path, delete this field!! ⚠️
1. Copy the `.docker.env.example` file to `.docker.env`
    1. Fill the `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` fields (instructions available via [Telegram docs](https://core.telegram.org/api/obtaining_api_id#obtaining-api-id)).
    1. ⚠️ Maintain the `TELEGRAM_LOCAL` field!
1. Install the project's dependencies (`npm install`)
1. ⚠️ Please!! Before starting the bot (`npm start`), call it within Telegram (e.g. `/start` command)
