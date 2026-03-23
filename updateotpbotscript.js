/******************** IMPORTS ********************/
const { Telegraf, session, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");

/******************** CONFIG ********************/
const BOT_TOKEN = "8657128372:AAFArlAPVAaCEnriPz_3Wn3xc1EQUjldLH8";
const ADMIN_PASSWORD = "mamun1132";
const NUMBERS_PER_USER = 3;
const ADMIN_USERNAME = "@rana1132";

const MAIN_CHANNEL = "@updaterange";
const CHAT_GROUP = "@updaterange1";
const OTP_GROUP = "@otpreceived1";
const OTP_GROUP_ID = -1001153782407;

// 👇 CSV ব্যাকআপ যাবে এই গ্রুপে
const USER_CSV_CHAT_ID = -5168617650;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN not set correctly");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

/******************** FILES ********************/
const NUMBERS_FILE = path.join(__dirname, "numbers.txt");
const COUNTRIES_FILE = path.join(__dirname, "countries.json");
const USERS_FILE = path.join(__dirname, "users.json");
const SERVICES_FILE = path.join(__dirname, "services.json");
const ACTIVE_NUMBERS_FILE = path.join(__dirname, "active_numbers.json");
const OTP_LOG_FILE = path.join(__dirname, "otp_log.json");

/******************** DATA ********************/
let countries = {};
if (fs.existsSync(COUNTRIES_FILE)) {
  try {
    countries = JSON.parse(fs.readFileSync(COUNTRIES_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading countries:", e);
    countries = {};
  }
} else {
  countries = {
    "880": { name: "Bangladesh", flag: "🇧🇩" },
    "91": { name: "India", flag: "🇮🇳" },
    "92": { name: "Pakistan", flag: "🇵🇰" },
    "1": { name: "USA", flag: "🇺🇸" },
    "44": { name: "UK", flag: "🇬🇧" },
    "977": { name: "Nepal", flag: "🇳🇵" },
    "20": { name: "Egypt", flag: "🇪🇬" }
  };
  saveCountries();
}

let services = {};
if (fs.existsSync(SERVICES_FILE)) {
  try {
    services = JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading services:", e);
    services = {};
  }
} else {
  services = {
    "whatsapp": { name: "WhatsApp", icon: "📱" },
    "telegram": { name: "Telegram", icon: "✈️" },
    "facebook": { name: "Facebook", icon: "📘" },
    "instagram": { name: "Instagram", icon: "📸" },
    "google": { name: "Google", icon: "🔍" },
    "verification": { name: "Verification", icon: "✅" },
    "other": { name: "Other", icon: "🔧" }
  };
  saveServices();
}

let numbersByCountryService = {};
if (fs.existsSync(NUMBERS_FILE)) {
  try {
    const lines = fs.readFileSync(NUMBERS_FILE, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) continue;
      let number, countryCode, service;
      if (lineTrimmed.includes("|")) {
        const parts = lineTrimmed.split("|");
        if (parts.length >= 3) {
          number = parts[0].trim();
          countryCode = parts[1].trim();
          service = parts[2].trim();
        } else if (parts.length === 2) {
          number = parts[0].trim();
          countryCode = parts[1].trim();
          service = "other";
        } else continue;
      } else {
        number = lineTrimmed;
        countryCode = getCountryCodeFromNumber(number);
        service = "other";
      }
      if (!/^\d{10,15}$/.test(number)) continue;
      if (!countryCode) continue;
      numbersByCountryService[countryCode] = numbersByCountryService[countryCode] || {};
      numbersByCountryService[countryCode][service] = numbersByCountryService[countryCode][service] || [];
      if (!numbersByCountryService[countryCode][service].includes(number)) {
        numbersByCountryService[countryCode][service].push(number);
      }
    }
    console.log(`✅ Loaded ${Object.values(numbersByCountryService).flatMap(c => Object.values(c).flat()).length} numbers`);
  } catch (e) {
    console.error("❌ Error loading numbers:", e);
    numbersByCountryService = {};
  }
}

let users = {};
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading users:", e);
    users = {};
  }
}

let activeNumbers = {};
if (fs.existsSync(ACTIVE_NUMBERS_FILE)) {
  try {
    activeNumbers = JSON.parse(fs.readFileSync(ACTIVE_NUMBERS_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading active numbers:", e);
    activeNumbers = {};
  }
}

let otpLog = [];
if (fs.existsSync(OTP_LOG_FILE)) {
  try {
    otpLog = JSON.parse(fs.readFileSync(OTP_LOG_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading OTP log:", e);
    otpLog = [];
  }
}

/******************** HELPER FUNCTIONS ********************/
function saveNumbers() {
  try {
    const lines = [];
    for (const countryCode in numbersByCountryService) {
      for (const service in numbersByCountryService[countryCode]) {
        for (const number of numbersByCountryService[countryCode][service]) {
          lines.push(`${number}|${countryCode}|${service}`);
        }
      }
    }
    fs.writeFileSync(NUMBERS_FILE, lines.join("\n"));
  } catch (error) {
    console.error("❌ Error saving numbers:", error);
  }
}

function saveCountries() {
  try {
    fs.writeFileSync(COUNTRIES_FILE, JSON.stringify(countries, null, 2));
  } catch (error) {
    console.error("❌ Error saving countries:", error);
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("❌ Error saving users:", error);
  }
}

function saveServices() {
  try {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error("❌ Error saving services:", error);
  }
}

function saveActiveNumbers() {
  try {
    fs.writeFileSync(ACTIVE_NUMBERS_FILE, JSON.stringify(activeNumbers, null, 2));
  } catch (error) {
    console.error("❌ Error saving active numbers:", error);
  }
}

function saveOTPLog() {
  try {
    fs.writeFileSync(OTP_LOG_FILE, JSON.stringify(otpLog.slice(-1000), null, 2));
  } catch (error) {
    console.error("❌ Error saving OTP log:", error);
  }
}

function getCountryCodeFromNumber(n) {
  const numStr = n.toString();
  const code3 = numStr.slice(0, 3);
  if (countries[code3]) return code3;
  const code2 = numStr.slice(0, 2);
  if (countries[code2]) return code2;
  const code1 = numStr.slice(0, 1);
  if (countries[code1]) return code1;
  return null;
}

function getAvailableCountriesForService(service) {
  const availableCountries = [];
  for (const countryCode in numbersByCountryService) {
    if (numbersByCountryService[countryCode][service] && 
        numbersByCountryService[countryCode][service].length > 0 &&
        countries[countryCode]) {
      availableCountries.push(countryCode);
    }
  }
  return availableCountries;
}

function getNumbersByCountryAndService(count, countryCode, service, userId) {
  if (!numbersByCountryService[countryCode] || !numbersByCountryService[countryCode][service]) return null;
  const available = numbersByCountryService[countryCode][service];
  if (available.length < count) return null;
  const numbers = [];
  for (let i = 0; i < count; i++) {
    const number = available.shift();
    numbers.push(number);
    activeNumbers[number] = {
      userId: userId,
      countryCode: countryCode,
      service: service,
      assignedAt: new Date().toISOString(),
      lastOTP: null,
      otpCount: 0
    };
  }
  saveNumbers();
  saveActiveNumbers();
  return numbers;
}

function extractPhoneNumberFromMessage(text) {
  if (!text) return null;
  const patterns = [
    /Number[^\d]*»[^\d]*(\d{4}[\★\*]{3,}\d{4})/,
    /☎️[^\d]*»[^\d]*(\d{4}[\★\*]{3,}\d{4})/,
    /(\d{4}[\★\*]{3,}\d{4})/,
    /(\d{10,15})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let number = match[1] || match[0];
      number = number.replace(/[\★\*\s\-]/g, '');
      if (/^\d{10,15}$/.test(number)) return number;
    }
  }
  return null;
}

async function forwardOTPMessageToUser(phoneNumber, originalMessageId) {
  if (!activeNumbers[phoneNumber]) return false;
  const userId = activeNumbers[phoneNumber].userId;
  try {
    await bot.telegram.forwardMessage(userId, OTP_GROUP_ID, originalMessageId);
    console.log(`✅ OTP forwarded to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ OTP forward error:`, error.message);
    return false;
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " years ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " months ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " days ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hours ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

/******************** ESCAPE MARKDOWN (Fixes parsing error) ********************/
function escapeMarkdown(text) {
  if (!text) return '';
  const specialChars = /[_*[\]()~`>#+\-=|{}.!]/g;
  return text.replace(specialChars, '\\$&');
}

/******************** SAFE EDIT HELPER (Fixes Refresh button errors) ********************/
async function safeEditMessage(ctx, text, extra = {}) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (err) {
    if (err.description && err.description.includes('message is not modified')) {
      return;
    }
    throw err;
  }
}

/******************** CSV BACKUP FUNCTIONS ********************/
function generateUsersCSV() {
  const allUsers = Object.values(users);
  let csv = "ID,First Name,Last Name,Username,Joined Date,Last Active,Numbers Count\n";
  for (const user of allUsers) {
    const numbersCount = Object.values(activeNumbers).filter(a => a.userId === user.id).length;
    csv += `${user.id},"${user.first_name || ''}","${user.last_name || ''}",` +
           `"${user.username || ''}","${user.joined}","${user.last_active}",${numbersCount}\n`;
  }
  return Buffer.from(csv, 'utf8');
}

async function uploadUserCSV() {
  try {
    const csvBuffer = generateUsersCSV();
    const fileName = `users_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
    await bot.telegram.sendDocument(USER_CSV_CHAT_ID, {
      source: csvBuffer,
      filename: fileName
    }, {
      caption: `📊 *User List Update*\nTotal Users: ${Object.keys(users).length}\nTime: ${new Date().toLocaleString()}`,
      parse_mode: "Markdown"
    });
    console.log(`✅ CSV uploaded to ${USER_CSV_CHAT_ID}. Users: ${Object.keys(users).length}`);
  } catch (error) {
    console.error("CSV upload failed:", error.message);
  }
}

/******************** CSV RESTORE FUNCTION ********************/
async function restoreUsersFromCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("CSV is empty");
  const restoredUsers = {};
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 6) continue;
    const userId = parseInt(values[0]);
    if (isNaN(userId)) continue;
    restoredUsers[userId] = {
      id: userId,
      username: values[3],
      first_name: values[1],
      last_name: values[2],
      joined: values[4],
      last_active: values[5]
    };
  }
  if (Object.keys(restoredUsers).length === 0) throw new Error("No valid users found");
  return restoredUsers;
}

/******************** SESSION MIDDLEWARE ********************/
bot.use(session({
  defaultSession: () => ({
    verified: false,
    isAdmin: false,
    adminState: null,
    adminData: null,
    currentNumbers: [],
    currentService: null,
    currentCountry: null,
    lastNumberTime: 0
  })
}));

bot.use(async (ctx, next) => {
  if (ctx.from) {
    const userId = ctx.from.id;
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        username: ctx.from.username || 'no_username',
        first_name: ctx.from.first_name || 'User',
        last_name: ctx.from.last_name || '',
        joined: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      saveUsers();
      await uploadUserCSV();
    } else {
      users[userId].last_active = new Date().toISOString();
      saveUsers();
    }
  }
  ctx.session = ctx.session || {
    verified: false,
    isAdmin: false,
    adminState: null,
    adminData: null,
    currentNumbers: [],
    currentService: null,
    currentCountry: null,
    lastNumberTime: 0
  };
  return next();
});

/******************** START COMMAND ********************/
bot.start((ctx) => {
  try {
    ctx.session.verified = false;
    ctx.session.isAdmin = false;
    ctx.session.adminState = null;
    ctx.session.adminData = null;
    ctx.session.currentNumbers = [];
    ctx.session.currentService = null;
    ctx.session.currentCountry = null;
    ctx.session.lastNumberTime = 0;
    const totalUsers = Object.keys(users).length;
    ctx.reply(
      `🤖 *Welcome to AH Method Number Bot*\n\n` +
      `👥 *Total Users:* ${totalUsers}\n\n` +
      "🔐 *Verification Required*\n" +
      "Please join all required groups first:\n\n" +
      `📢 Main Channel: ${MAIN_CHANNEL}\n` +
      `💬 Chat Group: ${CHAT_GROUP}\n` +
      `📨 OTP Group: ${OTP_GROUP}\n\n` +
      "After joining, click the verify button below:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📢 Main Channel", url: `https://t.me/${MAIN_CHANNEL.replace('@', '')}` },
              { text: "💬 Chat Group", url: `https://t.me/${CHAT_GROUP.replace('@', '')}` }
            ],
            [
              { text: "📨 OTP Group", url: `https://t.me/${OTP_GROUP.replace('@', '')}` }
            ],
            [
              { text: "✅ I Have Joined - Verify Me", callback_data: "verify_user" }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error("Start command error:", error);
    ctx.reply("❌ Error starting bot. Please try again.");
  }
});

/******************** VERIFICATION WITH JOIN CHECK ********************/
bot.action("verify_user", async (ctx) => {
  try {
    await ctx.answerCbQuery("⏳ Verifying...");
    const userId = ctx.from.id;
    const chatsToCheck = [
      { name: "Main Channel", identifier: MAIN_CHANNEL },
      { name: "Chat Group", identifier: CHAT_GROUP },
      { name: "OTP Group", identifier: OTP_GROUP }
    ];
    let notJoined = [];
    for (const chat of chatsToCheck) {
      try {
        const member = await ctx.telegram.getChatMember(chat.identifier, userId);
        const status = member.status;
        if (!['member', 'administrator', 'creator'].includes(status)) {
          notJoined.push(chat.name);
        }
      } catch (err) {
        console.log(`Error checking ${chat.name}:`, err.message);
        notJoined.push(chat.name);
      }
    }
    if (notJoined.length > 0) {
      const failedList = notJoined.join(', ');
      await safeEditMessage(ctx,
        `❌ *Verification Failed*\n\nYou haven't joined the following:\n${failedList}\n\nPlease join all required groups and try again.`,
        { parse_mode: "Markdown" }
      );
      return;
    }
    ctx.session.verified = true;
    await safeEditMessage(ctx,
      "✅ *Verification Successful!*\n\nYou can now use all bot features.",
      { parse_mode: "Markdown" }
    );
    await ctx.reply(
      "Choose an option:",
      Markup.keyboard([
        ["📞 Get Number"],
        ["🔄 Change Number"],
        ["ℹ️ Help"]
      ]).resize()
    );
  } catch (error) {
    console.error("Verification error:", error);
    await ctx.answerCbQuery("❌ Verification failed", { show_alert: true });
  }
});

/******************** USER HELP COMMAND ********************/
bot.hears("ℹ️ Help", async (ctx) => {
  try {
    await ctx.reply(
      "📖 *AH Method Number Bot - Help*\n\n" +
      "🤖 *How to Use:*\n" +
      `1. Click '📞 Get Number' to get ${NUMBERS_PER_USER} new numbers\n` +
      "2. Select service and country\n" +
      `3. You will receive ${NUMBERS_PER_USER} unique numbers\n` +
      `4. Click '🔄 Change Number' to get ${NUMBERS_PER_USER} new numbers (5s cooldown)\n` +
      `5. OTPs will come automatically from ${OTP_GROUP}\n\n` +
      "⏰ *Important Notes:*\n" +
      "• 5-second cooldown between number changes\n" +
      `• OTPs auto-forward from ${OTP_GROUP} group\n` +
      "• Don't share OTPs with anyone\n\n" +
      `📞 *Need help? Contact admin:* ${ADMIN_USERNAME}`,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.keyboard([
          ["📞 Get Number"],
          ["🔄 Change Number"],
          ["ℹ️ Help"]
        ]).resize()
      }
    );
  } catch (error) {
    console.error("Help command error:", error);
  }
});

/******************** USER GET NUMBER COMMAND ********************/
bot.hears("📞 Get Number", async (ctx) => {
  try {
    if (!ctx.session.verified) return ctx.reply("❌ Please verify first. Use /start");
    if (ctx.session.currentNumbers.length > 0 && ctx.session.lastNumberTime) {
      const now = Date.now();
      const timeSinceLast = now - ctx.session.lastNumberTime;
      const cooldown = 5000;
      if (timeSinceLast < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
        return ctx.reply(`⏳ Please wait ${remaining} seconds before getting new numbers.`, Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
      }
    }
    const serviceButtons = [];
    for (const serviceId in services) {
      const service = services[serviceId];
      const availableCountries = getAvailableCountriesForService(serviceId);
      if (availableCountries.length > 0) {
        serviceButtons.push([{ text: `${service.icon} ${service.name}`, callback_data: `user_select_service:${serviceId}` }]);
      }
    }
    if (serviceButtons.length === 0) {
      return ctx.reply("📭 *No Numbers Available*\n\nSorry, all numbers are currently in use.\nPlease try again later or contact admin.", { parse_mode: "Markdown", reply_markup: Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize() });
    }
    await ctx.reply("🎯 *Select Service*\n\nChoose the service you need numbers for:", { parse_mode: "Markdown", reply_markup: { inline_keyboard: serviceButtons } });
  } catch (error) {
    console.error("Get number error:", error);
    ctx.reply("❌ Error getting number. Please try again.", Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
  }
});

/******************** USER SELECT SERVICE ********************/
bot.action(/^user_select_service:(.+)$/, async (ctx) => {
  try {
    const serviceId = ctx.match[1];
    const availableCountries = getAvailableCountriesForService(serviceId);
    if (availableCountries.length === 0) return ctx.answerCbQuery("❌ No numbers for this service", { show_alert: true });
    const countryButtons = availableCountries.map(countryCode => {
      const country = countries[countryCode];
      const count = numbersByCountryService[countryCode][serviceId].length;
      return [{ text: `${country.flag} ${country.name} (${count})`, callback_data: `user_select_country:${serviceId}:${countryCode}` }];
    });
    const service = services[serviceId];
    await safeEditMessage(ctx,
      `🌍 *Select Country for ${service.icon} ${service.name}*\n\nChoose a country to get numbers from:`,
      { parse_mode: "Markdown", reply_markup: { inline_keyboard: countryButtons } }
    );
  } catch (error) {
    console.error("Service selection error:", error);
    ctx.answerCbQuery("❌ Error selecting service", { show_alert: true });
  }
});

/******************** USER SELECT COUNTRY ********************/
bot.action(/^user_select_country:(.+):(.+)$/, async (ctx) => {
  try {
    const serviceId = ctx.match[1];
    const countryCode = ctx.match[2];
    const userId = ctx.from.id;
    const now = Date.now();
    const timeSinceLast = now - ctx.session.lastNumberTime;
    const cooldown = 5000;
    if (timeSinceLast < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
      return ctx.answerCbQuery(`⏳ Wait ${remaining}s`, { show_alert: true });
    }
    const numbers = getNumbersByCountryAndService(NUMBERS_PER_USER, countryCode, serviceId, userId);
    if (!numbers) return ctx.answerCbQuery(`❌ Need ${NUMBERS_PER_USER} numbers but not enough available`, { show_alert: true });
    if (ctx.session.currentNumbers.length > 0) {
      for (const oldNum of ctx.session.currentNumbers) delete activeNumbers[oldNum];
      saveActiveNumbers();
    }
    ctx.session.currentNumbers = numbers;
    ctx.session.currentService = serviceId;
    ctx.session.currentCountry = countryCode;
    ctx.session.lastNumberTime = now;
    const country = countries[countryCode];
    const service = services[serviceId];
    const numbersList = numbers.map((num, idx) => `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``).join('\n');
    await safeEditMessage(ctx,
      `✅ *Numbers Received!*\n\n📱 *Service:* ${service.name}\n${country.flag} *Country:* ${country.name}\n${numbersList}\n\n⏰ *You can change numbers after 5 seconds*\n📨 *OTP Group:* ${OTP_GROUP}`,
      { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔄 Change Numbers", callback_data: `user_change_number:${serviceId}:${countryCode}` }]] } }
    );
    await ctx.reply(`Use "🔄 Change Numbers" button or wait 5 seconds and click menu button.`, Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
  } catch (error) {
    console.error("Country selection error:", error);
    ctx.answerCbQuery("❌ Error getting numbers", { show_alert: true });
  }
});

/******************** USER CHANGE NUMBER (HEARS) ********************/
bot.hears("🔄 Change Number", async (ctx) => {
  try {
    if (!ctx.session.verified) return ctx.reply("❌ Please verify first. Use /start");
    if (ctx.session.currentNumbers.length === 0) return ctx.reply("❌ You don't have active numbers.\nClick '📞 Get Number' first.", Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
    const now = Date.now();
    const timeSinceLast = now - ctx.session.lastNumberTime;
    const cooldown = 5000;
    if (timeSinceLast < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
      return ctx.reply(`⏳ Please wait ${remaining} seconds before changing numbers.`, Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
    }
    const serviceId = ctx.session.currentService;
    const countryCode = ctx.session.currentCountry;
    if (!serviceId || !countryCode) return ctx.reply("❌ Cannot change numbers. Please get numbers first.", Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
    const userId = ctx.from.id;
    const numbers = getNumbersByCountryAndService(NUMBERS_PER_USER, countryCode, serviceId, userId);
    if (!numbers) return ctx.reply(`❌ Not enough numbers available for this service/country.\nPlease try a different service or country.`, Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
    for (const oldNum of ctx.session.currentNumbers) delete activeNumbers[oldNum];
    saveActiveNumbers();
    ctx.session.currentNumbers = numbers;
    ctx.session.lastNumberTime = now;
    const country = countries[countryCode];
    const service = services[serviceId];
    const numbersList = numbers.map((num, idx) => `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``).join('\n');
    await ctx.reply(`🔄 *Numbers Changed!*\n\n📱 *Service:* ${service.name}\n${country.flag} *Country:* ${country.name}\n${numbersList}\n\n⏰ *Next change in:* 5 seconds\n📨 *OTP Group:* ${OTP_GROUP}`, { parse_mode: "Markdown", reply_markup: Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize() });
  } catch (error) {
    console.error("Change number error:", error);
    ctx.reply("❌ Error changing numbers. Please try again.", Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize());
  }
});

/******************** USER CHANGE NUMBER (INLINE) ********************/
bot.action(/^user_change_number:(.+):(.+)$/, async (ctx) => {
  try {
    const serviceId = ctx.match[1];
    const countryCode = ctx.match[2];
    const userId = ctx.from.id;
    const now = Date.now();
    const timeSinceLast = now - ctx.session.lastNumberTime;
    const cooldown = 5000;
    if (timeSinceLast < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
      return ctx.answerCbQuery(`⏳ Wait ${remaining}s`, { show_alert: true });
    }
    const numbers = getNumbersByCountryAndService(NUMBERS_PER_USER, countryCode, serviceId, userId);
    if (!numbers) return ctx.answerCbQuery(`❌ Need ${NUMBERS_PER_USER} numbers but not enough`, { show_alert: true });
    if (ctx.session.currentNumbers.length > 0) {
      for (const oldNum of ctx.session.currentNumbers) delete activeNumbers[oldNum];
      saveActiveNumbers();
    }
    ctx.session.currentNumbers = numbers;
    ctx.session.currentService = serviceId;
    ctx.session.currentCountry = countryCode;
    ctx.session.lastNumberTime = now;
    const country = countries[countryCode];
    const service = services[serviceId];
    const numbersList = numbers.map((num, idx) => `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``).join('\n');
    await safeEditMessage(ctx,
      `🔄 *Numbers Changed!*\n\n📱 *Service:* ${service.name}\n${country.flag} *Country:* ${country.name}\n${numbersList}\n\n⏰ *Next change in:* 5 seconds\n📨 *OTP Group:* ${OTP_GROUP}`,
      { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔄 Change Again", callback_data: `user_change_number:${serviceId}:${countryCode}` }]] } }
    );
  } catch (error) {
    console.error("Change number error:", error);
    ctx.answerCbQuery("❌ Error changing numbers", { show_alert: true });
  }
});

/******************** ADMIN COMMANDS ********************/
bot.command("adminlogin", async (ctx) => {
  try {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) return ctx.reply("❌ Usage: /adminlogin [password]\nExample: /adminlogin mamun1132");
    const password = parts[1];
    if (password === ADMIN_PASSWORD) {
      ctx.session.isAdmin = true;
      ctx.session.verified = true;
      await ctx.reply("✅ *Admin Login Successful!*\n\nYou now have administrator privileges.\nUse /admin to access admin panel.", { parse_mode: "Markdown", reply_markup: Markup.keyboard([["📞 Get Number"],["🔄 Change Number"],["ℹ️ Help"]]).resize() });
    } else {
      await ctx.reply("❌ Wrong password. Access denied.");
    }
  } catch (error) {
    console.error("Admin login error:", error);
    await ctx.reply("❌ Error during admin login.");
  }
});

bot.command("admin", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.reply("❌ *Admin Access Required*\n\nUse /adminlogin " + ADMIN_PASSWORD + " to login as admin.", { parse_mode: "Markdown" });
  await ctx.reply("🛠 *Admin Dashboard*\n\nSelect an option:", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📤 Upload Numbers", callback_data: "admin_upload" }, { text: "📊 Stock Report", callback_data: "admin_stock" }],
        [{ text: "🌍 Add Country", callback_data: "admin_add_country" }, { text: "🔧 Add Service", callback_data: "admin_add_service" }],
        [{ text: "🗑️ Delete Service", callback_data: "admin_delete_service" }, { text: "👥 User Stats", callback_data: "admin_users" }],
        [{ text: "📢 Broadcast", callback_data: "admin_broadcast" }, { text: "➕ Add Numbers", callback_data: "admin_add_numbers" }],
        [{ text: "❌ Delete Numbers", callback_data: "admin_delete" }, { text: "📋 List Services", callback_data: "admin_list_services" }],
        [{ text: "🚪 Logout", callback_data: "admin_logout" }]
      ]
    }
  });
});

bot.command("updatecsv", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.reply("❌ Admin only");
  await uploadUserCSV();
  await ctx.reply("✅ CSV updated and sent to group.");
});

bot.command("restorecsv", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.reply("❌ Admin only");
  ctx.session.adminState = "waiting_restore_csv";
  await ctx.reply("📥 Send the CSV file (users_*.csv) to restore users.");
});

/******************** ADMIN ACTIONS ********************/
bot.action("admin_upload", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_upload";
  ctx.session.adminData = null;
  const serviceButtons = [];
  for (const serviceId in services) {
    const service = services[serviceId];
    serviceButtons.push([{ text: `${service.icon} ${service.name}`, callback_data: `admin_select_service:${serviceId}` }]);
  }
  serviceButtons.push([{ text: "❌ Cancel", callback_data: "admin_cancel" }]);
  await safeEditMessage(ctx,
    "📤 *Upload Numbers*\n\nSelect service for the numbers:",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: serviceButtons } }
  );
});

bot.action(/^admin_select_service:(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const serviceId = ctx.match[1];
  const service = services[serviceId];
  ctx.session.adminState = "waiting_upload_file";
  ctx.session.adminData = { serviceId: serviceId };
  await safeEditMessage(ctx,
    `📤 *Upload Numbers for ${service.name}*\n\nSend a .txt file with phone numbers.\n\n*Format (one per line):*\n1. Just number: \`8801712345678\`\n2. With country: \`8801712345678|880\`\n3. With country and service: \`8801712345678|880|${serviceId}\`\n\n*Note:* Country code will be auto-detected if not provided.\n*Supported:* .txt files only`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

// 🔧 FIXED: Stock Report with safeEditMessage
bot.action("admin_stock", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  
  let report = "📊 *Stock Report*\n\n";
  let totalNumbers = 0;
  
  if (Object.keys(numbersByCountryService).length === 0) {
    report += "📭 *No numbers available*\n";
  } else {
    for (const countryCode in numbersByCountryService) {
      const country = countries[countryCode];
      const countryName = country ? `${country.flag} ${country.name}` : `Country ${countryCode}`;
      report += `\n${countryName} (+${countryCode}):\n`;
      let countryTotal = 0;
      for (const serviceId in numbersByCountryService[countryCode]) {
        const service = services[serviceId];
        const serviceName = service ? `${service.icon} ${service.name}` : serviceId;
        const count = numbersByCountryService[countryCode][serviceId].length;
        if (count > 0) {
          report += `  ${serviceName}: *${count}*\n`;
          countryTotal += count;
        }
      }
      if (countryTotal > 0) {
        report += `  *Total:* ${countryTotal}\n`;
        totalNumbers += countryTotal;
      } else {
        report += `  📭 No numbers\n`;
      }
    }
  }
  
  report += `\n📈 *Grand Total:* ${totalNumbers} numbers\n`;
  report += `👥 *Active Numbers in Use:* ${Object.keys(activeNumbers).length}\n`;
  report += `📨 *OTPs Forwarded:* ${otpLog.filter(log => log.delivered).length}`;
  
  await safeEditMessage(ctx, report, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Refresh", callback_data: "admin_stock" }],
        [{ text: "🔙 Back", callback_data: "admin_back" }]
      ]
    }
  });
});

bot.action("admin_add_country", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_add_country";
  await safeEditMessage(ctx,
    "🌍 *Add New Country*\n\nSend in format:\n`[countryCode] [name] [flag]`\n\n*Examples:*\n`880 Bangladesh 🇧🇩`\n`91 India 🇮🇳`\n`1 USA 🇺🇸`\n\nNote: Country code is dialing code (without +).",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_add_service", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_add_service";
  await safeEditMessage(ctx,
    "🔧 *Add New Service*\n\nSend in format:\n`[service_id] [name] [icon]`\n\n*Examples:*\n`facebook Facebook 📘`\n`gmail Gmail 📧`\n`instagram Instagram 📸`\n\nService ID should be lowercase without spaces.",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_add_numbers", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_add_numbers";
  await safeEditMessage(ctx,
    "➕ *Add Numbers Manually*\n\nSend numbers in format:\n`[number]|[country code]|[service]`\n\n*Examples:*\n`8801712345678|880|whatsapp`\n`919876543210|91|telegram`\n`11234567890|1|facebook`\n\nYou can send multiple numbers in one message.",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_delete", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  let report = "❌ *Delete Numbers*\n\nSelect which numbers to delete:\n\n";
  const buttons = [];
  for (const countryCode in numbersByCountryService) {
    const country = countries[countryCode];
    const countryName = country ? `${country.flag} ${country.name}` : `Country ${countryCode}`;
    for (const serviceId in numbersByCountryService[countryCode]) {
      const service = services[serviceId];
      const count = numbersByCountryService[countryCode][serviceId].length;
      if (count > 0) {
        buttons.push([{ text: `🗑️ ${countryName}/${service?.icon || '📞'} ${service?.name || serviceId} (${count})`, callback_data: `admin_delete_confirm:${countryCode}:${serviceId}` }]);
      }
    }
  }
  if (buttons.length === 0) {
    return safeEditMessage(ctx, "📭 *No numbers available to delete.*", { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] } });
  }
  buttons.push([{ text: "❌ Cancel", callback_data: "admin_cancel" }]);
  await safeEditMessage(ctx, report, { parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } });
});

bot.action(/^admin_delete_confirm:(.+):(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const countryCode = ctx.match[1];
  const serviceId = ctx.match[2];
  const country = countries[countryCode];
  const service = services[serviceId];
  const count = numbersByCountryService[countryCode]?.[serviceId]?.length || 0;
  await safeEditMessage(ctx,
    `⚠️ *Confirm Deletion*\n\nAre you sure you want to delete ${count} numbers?\n${country?.flag || '🏳️'} Country: ${country?.name || countryCode}\nService: ${service?.icon || '📞'} ${service?.name || serviceId}\n\nThis action cannot be undone!`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Yes, Delete", callback_data: `admin_delete_execute:${countryCode}:${serviceId}` }, { text: "❌ Cancel", callback_data: "admin_delete" }]] } }
  );
});

bot.action(/^admin_delete_execute:(.+):(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const countryCode = ctx.match[1];
  const serviceId = ctx.match[2];
  const country = countries[countryCode];
  const service = services[serviceId];
  const count = numbersByCountryService[countryCode]?.[serviceId]?.length || 0;
  delete numbersByCountryService[countryCode][serviceId];
  if (Object.keys(numbersByCountryService[countryCode]).length === 0) delete numbersByCountryService[countryCode];
  saveNumbers();
  await safeEditMessage(ctx,
    `✅ *Deleted Successfully*\n\n🗑️ Deleted ${count} numbers\n${country?.flag || '🏳️'} Country: ${country?.name || countryCode}\n🔧 Service: ${service?.icon || '📞'} ${service?.name || serviceId}`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back to Admin", callback_data: "admin_back" }]] } }
  );
});

bot.action("admin_list_services", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  let report = "📋 *Services List*\n\n";
  for (const serviceId in services) {
    const service = services[serviceId];
    let totalCount = 0;
    for (const countryCode in numbersByCountryService) {
      if (numbersByCountryService[countryCode][serviceId]) totalCount += numbersByCountryService[countryCode][serviceId].length;
    }
    report += `• ${service.icon} *${service.name}* (ID: \`${serviceId}\`)\n  📊 Numbers: ${totalCount}\n\n`;
  }
  await safeEditMessage(ctx, report, { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] } });
});

// 🔧 User Stats also uses safeEditMessage (optional, but good)
bot.action("admin_users", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  try {
    await ctx.answerCbQuery("⏳ Loading...");
    let message = "👥 *User Statistics*\n\n";
    const totalUsers = Object.keys(users).length;
    const activeNumbersCount = Object.keys(activeNumbers).length;
    const uniqueActiveUsers = new Set(Object.values(activeNumbers).map(a => a.userId)).size;
    const totalOTPs = otpLog.filter(log => log.delivered).length;
    message += `📊 *Statistics:*\n• Total Registered Users: ${totalUsers}\n• Active Users (with numbers): ${uniqueActiveUsers}\n• Active Numbers in Use: ${activeNumbersCount}\n• Total OTPs Delivered: ${totalOTPs}\n\n`;
    if (totalUsers > 0) {
      message += `📋 *Recent Users (last 10):*\n`;
      const sortedUsers = Object.values(users).sort((a, b) => new Date(b.last_active) - new Date(a.last_active)).slice(0, 10);
      for (const user of sortedUsers) {
        const timeAgo = getTimeAgo(new Date(user.last_active));
        const userActiveNumbers = Object.values(activeNumbers).filter(a => a.userId === user.id).length;
        const firstName = escapeMarkdown(user.first_name);
        const lastName = escapeMarkdown(user.last_name || '');
        const username = escapeMarkdown(user.username || 'no_username');
        message += `\n👤 *${firstName}* ${lastName}\n🆔 ID: ${user.id}\n📱 @${username}\n📞 Numbers: ${userActiveNumbers}\n🕐 Active: ${timeAgo}\n`;
      }
    } else {
      message += `📭 No users yet`;
    }
    await safeEditMessage(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "admin_users" }], [{ text: "🔙 Back", callback_data: "admin_back" }]] }
    });
  } catch (error) {
    console.error("User stats error:", error);
    await ctx.answerCbQuery("❌ Error loading stats", { show_alert: true });
  }
});

bot.action("admin_delete_service", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const serviceList = Object.keys(services);
  if (serviceList.length === 0) return safeEditMessage(ctx, "📭 *No services available to delete.*", { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] } });
  const buttons = serviceList.map(serviceId => {
    const service = services[serviceId];
    return [{ text: `${service.icon} Delete ${service.name}`, callback_data: `admin_delete_service_confirm:${serviceId}` }];
  });
  buttons.push([{ text: "❌ Cancel", callback_data: "admin_back" }]);
  await safeEditMessage(ctx,
    "🗑️ *Delete Service*\n\nSelect a service to delete. This will also delete all numbers under this service!\n\n⚠️ *WARNING:* This action cannot be undone!",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } }
  );
});

bot.action(/^admin_delete_service_confirm:(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const serviceId = ctx.match[1];
  const service = services[serviceId];
  if (!service) return ctx.answerCbQuery("❌ Service not found", { show_alert: true });
  await safeEditMessage(ctx,
    `⚠️ *Confirm Service Deletion*\n\nAre you sure you want to delete *${service.icon} ${service.name}*?\n\nThis will also delete ALL numbers associated with this service!\n\nThis action cannot be undone!`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Yes, Delete Service", callback_data: `admin_delete_service_execute:${serviceId}` }, { text: "❌ Cancel", callback_data: "admin_delete_service" }]] } }
  );
});

bot.action(/^admin_delete_service_execute:(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  const serviceId = ctx.match[1];
  const service = services[serviceId];
  if (!service) return safeEditMessage(ctx, "❌ Service not found.", { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] } });
  let totalDeleted = 0;
  for (const countryCode in numbersByCountryService) {
    if (numbersByCountryService[countryCode][serviceId]) {
      totalDeleted += numbersByCountryService[countryCode][serviceId].length;
      delete numbersByCountryService[countryCode][serviceId];
    }
    if (Object.keys(numbersByCountryService[countryCode]).length === 0) delete numbersByCountryService[countryCode];
  }
  for (const number in activeNumbers) {
    if (activeNumbers[number].service === serviceId) delete activeNumbers[number];
  }
  delete services[serviceId];
  saveNumbers();
  saveServices();
  saveActiveNumbers();
  await safeEditMessage(ctx,
    `✅ *Service Deleted Successfully!*\n\n🗑️ Service: ${service.icon} ${service.name}\n📊 Deleted ${totalDeleted} numbers associated with this service.`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back to Admin", callback_data: "admin_back" }]] } }
  );
});

/******************** BROADCAST WITH TWO OPTIONS ********************/
bot.action("admin_broadcast", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  await safeEditMessage(ctx,
    "📢 *Broadcast Options*\n\nChoose how you want to broadcast:\n\n📝 *Text Broadcast* - Send text messages to all users\n🖼️ *Media Broadcast* - Send photos, videos, documents with caption\n\nSelect an option:",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "📝 Text Broadcast", callback_data: "admin_broadcast_text" }, { text: "🖼️ Media Broadcast", callback_data: "admin_broadcast_media" }], [{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_broadcast_text", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_broadcast_text";
  ctx.session.adminData = { type: "text" };
  await safeEditMessage(ctx,
    "📝 *Text Broadcast*\n\nSend the text message you want to broadcast to all users.\n\n*Format:* You can use Markdown formatting.\n*Examples:*\n• `Hello *users*!`\n• `Check [this link](https://example.com)`\n\n⚠️ *Note:* This will be sent to all registered users.\n\nSend your message now:",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_broadcast_media", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = "waiting_broadcast_media";
  ctx.session.adminData = { type: "media" };
  await safeEditMessage(ctx,
    "🖼️ *Media Broadcast*\n\nSend any media file with optional caption:\n\n*Supported Media:*\n• 📸 Photos (jpg, png)\n• 🎥 Videos (mp4)\n• 📄 Documents (pdf, txt)\n• 🎵 Audio (mp3)\n\n*How to send:*\n1. Send a photo/video/document\n2. Add caption if needed\n3. Will be broadcasted to all users\n\n⚠️ *Note:* This will be sent to all registered users.\n\nSend your media now:",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "admin_cancel" }]] } }
  );
});

bot.action("admin_logout", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.isAdmin = false;
  ctx.session.adminState = null;
  ctx.session.adminData = null;
  await safeEditMessage(ctx,
    "🚪 *Admin Logged Out*\n\nYou have been logged out from admin panel.",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔙 Back to Main Menu", callback_data: "user_back" }]] } }
  );
});

bot.action("admin_back", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = null;
  ctx.session.adminData = null;
  await safeEditMessage(ctx,
    "🛠 *Admin Dashboard*\n\nSelect an option:",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📤 Upload Numbers", callback_data: "admin_upload" }, { text: "📊 Stock Report", callback_data: "admin_stock" }],
          [{ text: "🌍 Add Country", callback_data: "admin_add_country" }, { text: "🔧 Add Service", callback_data: "admin_add_service" }],
          [{ text: "🗑️ Delete Service", callback_data: "admin_delete_service" }, { text: "👥 User Stats", callback_data: "admin_users" }],
          [{ text: "📢 Broadcast", callback_data: "admin_broadcast" }, { text: "➕ Add Numbers", callback_data: "admin_add_numbers" }],
          [{ text: "❌ Delete Numbers", callback_data: "admin_delete" }, { text: "📋 List Services", callback_data: "admin_list_services" }],
          [{ text: "🚪 Logout", callback_data: "admin_logout" }]
        ]
      }
    }
  );
});

bot.action("admin_cancel", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  ctx.session.adminState = null;
  ctx.session.adminData = null;
  await safeEditMessage(ctx,
    "❌ *Action Cancelled*\n\nReturning to admin panel...",
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🛠 Back to Admin", callback_data: "admin_back" }]] } }
  );
});

/******************** FILE UPLOAD HANDLER (Numbers & CSV Restore) ********************/
bot.on("document", async (ctx) => {
  try {
    const document = ctx.message.document;
    const fileName = document.file_name.toLowerCase();

    // CSV Restore
    if (ctx.session.isAdmin && ctx.session.adminState === "waiting_restore_csv") {
      if (!fileName.endsWith('.csv')) return ctx.reply("❌ Please send a .csv file.");
      await ctx.reply("📥 Processing CSV...");
      const fileLink = await ctx.telegram.getFileLink(document.file_id);
      const https = require('https');
      const csvContent = await new Promise((resolve, reject) => {
        https.get(fileLink.href, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => resolve(data));
        }).on('error', reject);
      });
      try {
        const restored = await restoreUsersFromCSV(csvContent);
        if (fs.existsSync(USERS_FILE)) {
          fs.copyFileSync(USERS_FILE, USERS_FILE + '.backup');
        }
        users = restored;
        saveUsers();
        await ctx.reply(`✅ Restored ${Object.keys(users).length} users from CSV.`);
        ctx.session.adminState = null;
      } catch (err) {
        await ctx.reply(`❌ Failed to restore: ${err.message}`);
      }
      return;
    }

    // Normal numbers upload (admin only)
    if (!ctx.session.isAdmin || ctx.session.adminState !== "waiting_upload_file") return;
    if (!fileName.endsWith('.txt')) {
      await ctx.reply("❌ Please send only .txt files.");
      return;
    }
    await ctx.reply("📥 Downloading and processing file...");
    const fileLink = await ctx.telegram.getFileLink(document.file_id);
    const https = require('https');
    const fileContent = await new Promise((resolve, reject) => {
      https.get(fileLink.href, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });
    const serviceId = ctx.session.adminData?.serviceId;
    if (!serviceId) {
      await ctx.reply("❌ Service not selected. Please try again.");
      return;
    }
    const service = services[serviceId];
    if (!service) {
      await ctx.reply("❌ Service not found.");
      return;
    }
    const lines = fileContent.split(/\r?\n/);
    let added = 0, skipped = 0, invalid = 0;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      let number, countryCode, serviceFromFile;
      if (trimmedLine.includes("|")) {
        const parts = trimmedLine.split("|");
        if (parts.length >= 3) {
          number = parts[0].trim();
          countryCode = parts[1].trim();
          serviceFromFile = parts[2].trim();
        } else if (parts.length === 2) {
          number = parts[0].trim();
          countryCode = parts[1].trim();
          serviceFromFile = serviceId;
        } else {
          invalid++; continue;
        }
      } else {
        number = trimmedLine;
        countryCode = getCountryCodeFromNumber(number);
        serviceFromFile = serviceId;
      }
      if (!/^\d{10,15}$/.test(number)) { invalid++; continue; }
      if (!countryCode) { invalid++; continue; }
      if (!countries[countryCode]) {
        countries[countryCode] = { name: `Country ${countryCode}`, flag: "🏳️" };
      }
      numbersByCountryService[countryCode] = numbersByCountryService[countryCode] || {};
      numbersByCountryService[countryCode][serviceFromFile] = numbersByCountryService[countryCode][serviceFromFile] || [];
      if (!numbersByCountryService[countryCode][serviceFromFile].includes(number)) {
        numbersByCountryService[countryCode][serviceFromFile].push(number);
        added++;
      } else {
        skipped++;
      }
    }
    saveCountries();
    saveNumbers();
    ctx.session.adminState = null;
    ctx.session.adminData = null;
    await ctx.reply(`✅ *File Upload Complete!*\n\n📁 File: ${document.file_name}\n🔧 Service: ${service.name}\n\n📊 Results:\n✅ Added: *${added}* numbers\n↪️ Skipped (duplicates): *${skipped}*\n❌ Invalid: *${invalid}*\n\n📈 Total numbers now: ${Object.values(numbersByCountryService).flatMap(c => Object.values(c).flat()).length}`, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("File handler error:", error);
    await ctx.reply("❌ Error processing file.");
  }
});

/******************** TEXT MESSAGE HANDLER FOR ADMIN ********************/
bot.on("text", async (ctx) => {
  try {
    if (!ctx.message || !ctx.message.text) return;
    if (ctx.session.isAdmin && ctx.session.adminState) {
      const adminState = ctx.session.adminState;
      const text = ctx.message.text;
      switch (adminState) {
        case "waiting_add_country": {
          const countryParts = text.trim().split(/\s+/);
          if (countryParts.length >= 3) {
            const countryCode = countryParts[0];
            const countryName = countryParts.slice(1, -1).join(" ");
            const flag = countryParts[countryParts.length - 1];
            countries[countryCode] = { name: countryName, flag: flag };
            saveCountries();
            await ctx.reply(`✅ *Country Added Successfully!*\n\n📌 *Code:* +${countryCode}\n🏳️ *Name:* ${countryName}\n${flag} *Flag:* ${flag}`, { parse_mode: "Markdown" });
            ctx.session.adminState = null;
            ctx.session.adminData = null;
          } else {
            await ctx.reply("❌ Invalid format. Use: `[code] [name] [flag]`", { parse_mode: "Markdown" });
          }
          break;
        }
        case "waiting_add_service": {
          const serviceParts = text.trim().split(/\s+/);
          if (serviceParts.length >= 3) {
            const serviceId = serviceParts[0].toLowerCase();
            const serviceName = serviceParts.slice(1, -1).join(" ");
            const icon = serviceParts[serviceParts.length - 1];
            services[serviceId] = { name: serviceName, icon: icon };
            saveServices();
            await ctx.reply(`✅ *Service Added Successfully!*\n\n📌 *ID:* \`${serviceId}\`\n🔧 *Name:* ${serviceName}\n${icon} *Icon:* ${icon}`, { parse_mode: "Markdown" });
            ctx.session.adminState = null;
            ctx.session.adminData = null;
          } else {
            await ctx.reply("❌ Invalid format. Use: `[id] [name] [icon]`", { parse_mode: "Markdown" });
          }
          break;
        }
        case "waiting_add_numbers": {
          const lines = text.split('\n');
          let added = 0, failed = 0;
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            let number, countryCode, service;
            if (trimmedLine.includes("|")) {
              const parts = trimmedLine.split("|");
              if (parts.length >= 3) {
                number = parts[0].trim();
                countryCode = parts[1].trim();
                service = parts[2].trim();
              } else if (parts.length === 2) {
                number = parts[0].trim();
                countryCode = parts[1].trim();
                service = "other";
              } else {
                failed++; continue;
              }
            } else {
              number = trimmedLine;
              countryCode = getCountryCodeFromNumber(number);
              service = "other";
            }
            if (!/^\d{10,15}$/.test(number)) { failed++; continue; }
            if (!countryCode) { failed++; continue; }
            numbersByCountryService[countryCode] = numbersByCountryService[countryCode] || {};
            numbersByCountryService[countryCode][service] = numbersByCountryService[countryCode][service] || [];
            if (!numbersByCountryService[countryCode][service].includes(number)) {
              numbersByCountryService[countryCode][service].push(number);
              added++;
            } else {
              failed++;
            }
          }
          saveNumbers();
          await ctx.reply(`✅ *Numbers Added!*\n\n✅ Added: *${added}*\n❌ Failed: *${failed}*\n\n📊 Total numbers now: ${Object.values(numbersByCountryService).flatMap(c => Object.values(c).flat()).length}`, { parse_mode: "Markdown" });
          ctx.session.adminState = null;
          ctx.session.adminData = null;
          break;
        }
        case "waiting_broadcast_text": {
          let sent = 0, failedBroadcast = 0;
          const totalUsers = Object.keys(users).length;
          await ctx.reply(`📢 *Starting Text Broadcast*\n\nSending to ${totalUsers} users...`, { parse_mode: "Markdown" });
          for (const userId in users) {
            try {
              await ctx.telegram.sendMessage(userId, text, { parse_mode: "Markdown", disable_web_page_preview: false });
              sent++;
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Broadcast failed for user ${userId}:`, error.message);
              failedBroadcast++;
            }
          }
          ctx.session.adminState = null;
          ctx.session.adminData = null;
          await ctx.reply(`📢 *Text Broadcast Complete!*\n\n✅ Sent: *${sent}* users\n❌ Failed: *${failedBroadcast}* users\n📝 Total users: ${totalUsers}\n\n📨 *Message sent:*\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`, { parse_mode: "Markdown" });
          break;
        }
      }
    }
  } catch (error) {
    console.error("Admin text handler error:", error);
  }
});

/******************** MEDIA BROADCAST & OTP HANDLER ********************/
bot.on(["photo", "video", "document", "audio"], async (ctx) => {
  try {
    if (ctx.session.isAdmin && ctx.session.adminState === "waiting_broadcast_media") {
      let mediaType = "", fileId = "";
      let caption = ctx.message.caption || "";
      if (ctx.message.photo) {
        mediaType = "photo";
        fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      } else if (ctx.message.video) {
        mediaType = "video";
        fileId = ctx.message.video.file_id;
      } else if (ctx.message.document) {
        mediaType = "document";
        fileId = ctx.message.document.file_id;
      } else if (ctx.message.audio) {
        mediaType = "audio";
        fileId = ctx.message.audio.file_id;
      }
      await ctx.reply(`📢 *Starting Media Broadcast*\n\nType: ${mediaType}\nCaption: ${caption || "No caption"}\n\nSending to all users...`, { parse_mode: "Markdown" });
      let sent = 0, failed = 0;
      const totalUsers = Object.keys(users).length;
      for (const userId in users) {
        try {
          switch (mediaType) {
            case "photo":
              await ctx.telegram.sendPhoto(userId, fileId, { caption: caption, parse_mode: "Markdown" });
              break;
            case "video":
              await ctx.telegram.sendVideo(userId, fileId, { caption: caption, parse_mode: "Markdown" });
              break;
            case "document":
              await ctx.telegram.sendDocument(userId, fileId, { caption: caption, parse_mode: "Markdown" });
              break;
            case "audio":
              await ctx.telegram.sendAudio(userId, fileId, { caption: caption, parse_mode: "Markdown" });
              break;
          }
          sent++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Media broadcast failed for user ${userId}:`, error.message);
          failed++;
        }
      }
      ctx.session.adminState = null;
      ctx.session.adminData = null;
      await ctx.reply(`🖼️ *Media Broadcast Complete!*\n\n📁 Type: ${mediaType}\n✅ Sent: *${sent}* users\n❌ Failed: *${failed}* users\n📝 Total users: ${totalUsers}\n\n📨 *Caption:* ${caption || "No caption"}`, { parse_mode: "Markdown" });
      return;
    }
    // OTP Forwarding
    if (ctx.chat.id === OTP_GROUP_ID) {
      const messageText = ctx.message.caption || '';
      const messageId = ctx.message.message_id;
      if (!messageText) return;
      console.log(`📨 OTP Group Message [${messageId}]: ${messageText.substring(0, 100)}...`);
      let extractedNumber = extractPhoneNumberFromMessage(messageText);
      if (!extractedNumber) {
        const allActiveNumbers = Object.keys(activeNumbers);
        for (const activeNumber of allActiveNumbers) {
          const last4 = activeNumber.slice(-4);
          if (messageText.includes(last4)) {
            extractedNumber = activeNumber;
            break;
          }
        }
      }
      if (!extractedNumber || !activeNumbers[extractedNumber]) return;
      await forwardOTPMessageToUser(extractedNumber, messageId);
    }
  } catch (error) {
    console.error("Media/OTP handler error:", error);
  }
});

/******************** START BOT ********************/
async function startBot() {
  try {
    console.log("=====================================");
    console.log("🚀 Starting AH Method Number Bot...");
    console.log(`🤖 Bot Token: ${BOT_TOKEN}`);
    console.log(`🔑 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`📨 OTP Group: ${OTP_GROUP}`);
    console.log(`🔢 Numbers per user: ${NUMBERS_PER_USER}`);
    console.log(`👤 Admin Contact: ${ADMIN_USERNAME}`);
    console.log(`📁 CSV Backup Chat ID: ${USER_CSV_CHAT_ID}`);
    console.log("=====================================");
    await bot.launch();
    console.log("✅ Bot started successfully!");
    console.log("📝 User Command: /start");
    console.log(`🛠 Admin Login: /adminlogin ${ADMIN_PASSWORD}`);
    console.log("=====================================");
    console.log("✨ Features:");
    console.log("   • Reply Buttons: 📞 Get Number, 🔄 Change Number, ℹ️ Help");
    console.log(`   • Users receive ${NUMBERS_PER_USER} numbers per request`);
    console.log("   • Auto OTP forwarding");
    console.log("   • 5-second cooldown");
    console.log("   • Working Admin Panel (Add/Delete Numbers)");
    console.log("   • Delete Service (Fully Working)");
    console.log("   • User Stats (Fully Working with Refresh)");
    console.log("   • Stock Report (Fully Working with Refresh)");
    console.log("   • File Upload (.txt)");
    console.log("   • Manual number addition");
    console.log("   • Stock management");
    console.log("   • Join verification for groups");
    console.log("   • TEXT BROADCAST (with Markdown)");
    console.log("   • MEDIA BROADCAST (Photos, Videos, Documents, Audio)");
    console.log("   • ✅ AUTO CSV BACKUP to Telegram Group");
    console.log("   • ✅ Update CSV (/updatecsv)");
    console.log("   • ✅ Restore users from CSV (/restorecsv)");
    console.log("=====================================");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    console.log("🔄 Restarting in 10 seconds...");
    setTimeout(startBot, 10000);
  }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));