// Constants
const CONSTANTS = {
  VACATION_PERIODS: {
    INDEPENDENCE_DAY: { start: '07-04', end: '07-04', name: 'Independence Day', emoji: '🇺🇸' },
    THANKSGIVING: { start: '11-24', end: '11-25', name: 'Thanksgiving', emoji: '🦃' },
    CHRISTMAS: { start: '12-24', end: '12-26', name: 'Christmas', emoji: '🎄' },
  },
  WORK_HOURS: {
    START: 9,
    END: 17,
    LUNCH_START: 12,
    LUNCH_END: 13,
    BREAK_START: 15,
    BREAK_END: 15.25,   // 15:15
  },
  STATUSES: {
    DEFAULT: { text: '', emoji: '' },
    HOLIDAY: { text: 'Out of Office', emoji: '🏖️' },
    LUNCH: { text: 'Lunch Break', emoji: '🍽️' },
    BREAK: { text: 'Short Break', emoji: '☕' },
  },
  CALENDAR_ID: 'en.usa#holiday@group.v.calendar.google.com',
};

function updateUserStatus() {
  const userToken = PropertiesService.getScriptProperties().getProperty('USER_TOKEN');
  const now = new Date();
  const status = determineStatus(now);

  updateSlackStatus(userToken, status.presence, status.text, status.emoji);
}

function determineStatus(date) {
  const vacationPeriod = checkVacationPeriod(date);
  if (vacationPeriod) {
    return { presence: 'away', text: vacationPeriod.name, emoji: vacationPeriod.emoji };
  }

  if (isHoliday(date) || isWeekend(date)) {
    return { presence: 'away', ...CONSTANTS.STATUSES.HOLIDAY };
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
    return { presence: 'away', ...STATUSES.DEFAULT };
  }

  if (hours >= WORK_HOURS.LUNCH_START && hours < WORK_HOURS.LUNCH_END) {
    return { presence: 'away', ...STATUSES.LUNCH };
  }

  if (hours >= WORK_HOURS.BREAK_START && hours < WORK_HOURS.BREAK_END) {
    return { presence: 'away', ...STATUSES.BREAK };
  }

  return { presence: 'auto', ...STATUSES.DEFAULT };
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

function updateSlackStatus(token, presence, status_text, status_emoji) {
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
    updateStatus(statusUrl, options, status_text, status_emoji);
    Logger.log('Status updated successfully to: ' + status_text + ' ' + status_emoji);
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
