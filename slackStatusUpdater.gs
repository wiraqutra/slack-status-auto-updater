// Constants
const CONSTANTS = {
  VACATION_PERIODS: {
    NEW_YEARS: { start: '01-01', end: '01-01', name: "New Year's Day", emoji: '🎉' },
    MARTIN_LUTHER_KING: { start: '01-17', end: '01-17', name: "Martin Luther King Jr. Day", emoji: '✊🏾' },
    PRESIDENTS_DAY: { start: '02-21', end: '02-21', name: "Presidents' Day", emoji: '🇺🇸' },
    MEMORIAL_DAY: { start: '05-30', end: '05-30', name: "Memorial Day", emoji: '🎖️' },
    INDEPENDENCE_DAY: { start: '07-04', end: '07-04', name: 'Independence Day', emoji: '🇺🇸' },
    LABOR_DAY: { start: '09-05', end: '09-05', name: "Labor Day", emoji: '👷' },
    INDIGENOUS_PEOPLES_DAY: { start: '10-10', end: '10-10', name: "Indigenous Peoples' Day", emoji: '🦅' },
    VETERANS_DAY: { start: '11-11', end: '11-11', name: "Veterans Day", emoji: '🎖️' },
    THANKSGIVING: { start: '11-24', end: '11-25', name: 'Thanksgiving', emoji: '🦃' },
    CHRISTMAS: { start: '12-24', end: '12-26', name: 'Christmas', emoji: '🎄' },
  },
  WORK_HOURS: {
    START: 9,
    END: 18,
    LUNCH_START: 12,
    LUNCH_END: 13,
    BREAK_START: 15,
    BREAK_END: 15.25,  // 15 minutes break
  },
  STATUSES: {
    DEFAULT: { presence: 'auto', text: '', emoji: '' },
    OUTSIDE_WORK: { presence: 'away', text: '', emoji: '' },
    HOLIDAY: { presence: 'away', text: 'Out of Office', emojiType: 'HOLIDAY' },
    LUNCH: { presence: 'away', text: 'Lunch Break', emojiType: 'LUNCH' },
    BREAK: { presence: 'auto', text: 'Short Break', emojiType: 'BREAK' },
  },
  CALENDAR_ID: 'en.usa#holiday@group.v.calendar.google.com',
  EMOJIS: {
    HOLIDAY: ['🌴', '🏔️', '🏖️', '📖', '🎮'],
    LUNCH: ['🍱', '🍛', '🍜', '🍝', '🍣', '🍙', '🍔', '🥪', '🥗', '🍕'],
    BREAK: ['☕', '🍵', '🥤', '🍡', '🍩'],
  },
};

function getRandomEmoji(type) {
  const emojis = CONSTANTS.EMOJIS[type];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function getTodayEmoji(type) {
  const today = new Date().toDateString();
  const storedEmoji = PropertiesService.getScriptProperties().getProperty(`TODAY_${type}_EMOJI`);
  const storedDate = PropertiesService.getScriptProperties().getProperty(`${type}_EMOJI_DATE`);

  if (storedEmoji && storedDate === today) {
    return storedEmoji;
  } else {
    const newEmoji = getRandomEmoji(type);
    PropertiesService.getScriptProperties().setProperty(`TODAY_${type}_EMOJI`, newEmoji);
    PropertiesService.getScriptProperties().setProperty(`${type}_EMOJI_DATE`, today);
    return newEmoji;
  }
}

function updateUserStatus() {
  const userToken = PropertiesService.getScriptProperties().getProperty('USER_TOKEN');
  const now = new Date();
  const currentStatus = determineStatus(now);
  const previousStatus = getPreviousStatus();

  if (isStatusDifferent(currentStatus, previousStatus)) {
    updateSlackStatus(userToken, currentStatus);
    savePreviousStatus(currentStatus);
    Logger.log(`Status updated successfully to: ${currentStatus.text} ${currentStatus.emoji}`);
  } else {
    Logger.log('No need to update: Same as last time');
  }
}

function determineStatus(date) {
  const vacationPeriod = checkVacationPeriod(date);
  if (vacationPeriod) {
    return { presence: 'away', text: vacationPeriod.name, emoji: vacationPeriod.emoji };
  }

  if (isHoliday(date) || isWeekend(date)) {
    const { presence, text, emojiType } = CONSTANTS.STATUSES.HOLIDAY;
    return { presence, text, emoji: getTodayEmoji(emojiType) };
  }

  return getWorkdayStatus(date);
}

function isHoliday(date) {
  const calendar = CalendarApp.getCalendarById(CONSTANTS.CALENDAR_ID);
  return calendar.getEventsForDay(date).length > 0;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getWorkdayStatus(date) {
  const hours = date.getHours() + date.getMinutes() / 60;
  const { WORK_HOURS, STATUSES } = CONSTANTS;

  if (hours < WORK_HOURS.START || hours >= WORK_HOURS.END) {
    return STATUSES.OUTSIDE_WORK;
  }

  if (hours >= WORK_HOURS.LUNCH_START && hours < WORK_HOURS.LUNCH_END) {
    const { presence, text, emojiType } = STATUSES.LUNCH;
    return { presence, text, emoji: getTodayEmoji(emojiType) };
  }

  if (hours >= WORK_HOURS.BREAK_START && hours < WORK_HOURS.BREAK_END) {
    const { presence, text, emojiType } = STATUSES.BREAK;
    return { presence, text, emoji: getTodayEmoji(emojiType) };
  }

  return STATUSES.DEFAULT;
}

function checkVacationPeriod(date) {
  const formattedDate = Utilities.formatDate(date, 'America/San_Francisco', 'MM-dd');
  return Object.values(CONSTANTS.VACATION_PERIODS).find(period => 
    isDateInRange(formattedDate, period.start, period.end)
  );
}

function isDateInRange(date, start, end) {
  if (start <= end) {
    return date >= start && date <= end;
  } else {
    // Handle periods that span across years (e.g., New Year's)
    return date >= start || date <= end;
  }
}

function updateSlackStatus(token, status) {
  const { presence, text, emoji } = status;
  const presenceUrl = 'https://slack.com/api/users.setPresence';
  const statusUrl = 'https://slack.com/api/users.profile.set';
  const options = {
    'method': 'post',
    'headers': { 
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json; charset=UTF-8'
    }
  };

  try {
    updatePresence(presenceUrl, options, presence);
    updateStatus(statusUrl, options, text, emoji);
    Logger.log(`Status updated successfully to: ${text} ${emoji}`);
  } catch (error) {
    Logger.log('Error occurred: ' + error.message);
  }
}

function updatePresence(url, options, presence) {
  options.payload = JSON.stringify({ 'presence': presence });
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  if (!result.ok) {
    throw new Error('Slack Presence API error: ' + JSON.stringify(result));
  }
}

function updateStatus(url, options, status_text, status_emoji) {
  options.payload = JSON.stringify({
    'profile': { status_text, status_emoji }
  });
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  if (!result.ok) {
    throw new Error('Slack Status API error: ' + JSON.stringify(result));
  }
}

function getPreviousStatus() {
  const storedStatus = PropertiesService.getScriptProperties().getProperty('PREVIOUS_STATUS');
  return storedStatus ? JSON.parse(storedStatus) : null;
}

function savePreviousStatus(status) {
  PropertiesService.getScriptProperties().setProperty('PREVIOUS_STATUS', JSON.stringify(status));
}

function isStatusDifferent(status1, status2) {
  if (!status2) return true;  // Always updated on the first run
  return status1.presence !== status2.presence ||
         status1.text !== status2.text ||
         status1.emoji !== status2.emoji;
}
