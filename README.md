# Slack Status Updater

[日本語版の説明はこちら - Japanese version here (Qiita)](https://qiita.com/seigo/items/7e1e3fb34409fc5b1726)

Automatically update your Slack status based on your work schedule, breaks, and holidays using Google Apps Script and Slack API.

## Features

- Automatically sets your Slack status to "Active" during work hours and "Away" outside work hours
- Updates status for lunch breaks and short breaks with random emojis that change daily
- Sets status to "Away" on weekends and holidays
- Recognizes holidays and special vacation periods (e.g., Independence Day, Thanksgiving, Christmas)
- Easily customizable for different work schedules and company-specific holidays

## Prerequisites

- A Google account
- A Slack workspace with the necessary permissions to create and use API tokens
- Basic knowledge of Google Apps Script

## Setup

1. Create a new Google Apps Script project
2. Copy and paste the provided code into the script editor
3. Set up a Slack API token:
   - Go to [Slack API](https://api.slack.com/)
   - Create a new app or use an existing one
   - Add the following OAuth scopes: `users.profile:write`, `users:write`
   - Install the app to your workspace and copy the Bot User OAuth Token
4. In the Google Apps Script project, go to Project Settings > Script Properties
5. Add a new property named `USER_TOKEN` and paste your Slack API token as the value

## Customizing Holidays and Time Zones

This script can be easily customized to fit your specific location, work schedule, and holidays. Here's how you can modify these settings:

### Customizing Holidays

1. Open the `slackStatusUpdater.gs` file.
2. Locate the `VACATION_PERIODS` object in the `CONSTANTS`.
3. Modify, add, or remove holiday entries as needed. For example:

```javascript
VACATION_PERIODS: {
    NEW_YEARS: { start: '01-01', end: '01-01', name: "New Year's Day", emoji: '🎉' },
    MARTIN_LUTHER_KING: { start: '01-17', end: '01-17', name: "Martin Luther King Jr. Day", emoji: '✊🏾' },
    PRESIDENTS_DAY: { start: '02-21', end: '02-21', name: "Presidents' Day", emoji: '🇺🇸' },
    ...
},
```

### Changing the Time Zone

Find the `checkVacationPeriod` function in the script.
Locate the following line:

```javascript
const formattedDate = Utilities.formatDate(date, 'America/San_Francisco', 'MM-dd');
```

Replace 'America/San_Francisco' with your desired time zone. For example:

- For London: 'Europe/London'
- For Bangalore: 'Asia/Kolkata'
- For Nairobi: 'Africa/Nairobi'

You can find a full list of supported time zones in the IANA Time Zone Database.

### Customizing Work Hours

In the `CONSTANTS` object, find the `WORK_HOURS` section.
Modify the values to match your work schedule. For example:

```javascript
WORK_HOURS: {
  START: 9,     // Work starts at 9 AM
  END: 17,      // Work ends at 5 PM
  LUNCH_START: 12,
  LUNCH_END: 13,
  BREAK_START: 15,
  BREAK_END: 15.25,  // 15 minutes break
},
```

### Customizing Status Messages and Emojis

In the CONSTANTS object, locate the STATUSES and EMOJIS sections.
Modify the text and emojis to your preference:

```javascript
STATUSES: {
  DEFAULT: { presence: 'auto', text: '', emoji: '' },
  OUTSIDE_WORK: { presence: 'away', text: '', emoji: '' },
  HOLIDAY: { presence: 'away', text: 'Holiday', emojiType: 'HOLIDAY' },
  LUNCH: { presence: 'away', text: 'Lunch Break', emojiType: 'LUNCH' },
  BREAK: { presence: 'auto', text: 'Short Break', emojiType: 'BREAK' },
},
EMOJIS: {
  HOLIDAY: ['🌴', '🏔️', '🏖️', '📖', '🎮'],
  LUNCH: ['🍱', '🍛', '🍜', '🍝', '🍣', '🍙', '🍔', '🥪', '🥗', '🍕'],
  BREAK: ['☕', '🍵', '🥤', '🍡', '🍩'],
},
```

Remember to save your changes after customization. These modifications will allow you to tailor the script to your specific needs, location, and work culture.

## Usage

1. Run the `updateUserStatus` function manually to test the script
2. Set up a time-based trigger to run the script automatically:
   - In the Google Apps Script editor, go to Triggers
   - Click "Add Trigger"
   - Choose `updateUserStatus` as the function to run
   - Set the trigger type to "Time-driven" and choose your desired frequency (e.g., every 5 minutes)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This script interacts with the Slack API. Please be aware of Slack's API usage limits and terms of service when using this script.
