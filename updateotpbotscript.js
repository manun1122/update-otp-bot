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
// Load countries
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

// Load services
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

// Load numbers
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
        } else {
          continue;
        }
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

// Load users
let users = {};
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading users:", e);
    users = {};
  }
}

// Load active numbers
let activeNumbers = {};
if (fs.existsSync(ACTIVE_NUMBERS_FILE)) {
  try {
    activeNumbers = JSON.parse(fs.readFileSync(ACTIVE_NUMBERS_FILE, 'utf8'));
  } catch (e) {
    console.error("Error loading active numbers:", e);
    activeNumbers = {};
  }
}

// Load OTP log
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
  if (!activeNumbers[phoneNumber]) {
    console.log(`❌ No active user for number: ${phoneNumber}`);
    return false;
  }
  
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

bot.use((ctx, next) => {
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
      await ctx.editMessageText(
        `❌ *Verification Failed*\n\nYou haven't joined the following:\n${failedList}\n\nPlease join all required groups and try again.`,
        { parse_mode: "Markdown" }
      );
      return;
    }
    
    ctx.session.verified = true;
    
    await ctx.editMessageText(
      "✅ *Verification Successful!*\n\n" +
      "You can now use all bot features.",
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
    if (!ctx.session.verified) {
      return ctx.reply("❌ Please verify first. Use /start");
    }
    
    if (ctx.session.currentNumbers.length > 0 && ctx.session.lastNumberTime) {
      const now = Date.now();
      const timeSinceLast = now - ctx.session.lastNumberTime;
      const cooldown = 5000;
      
      if (timeSinceLast < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
        return ctx.reply(
          `⏳ Please wait ${remaining} seconds before getting new numbers.`,
          Markup.keyboard([
            ["📞 Get Number"],
            ["🔄 Change Number"],
            ["ℹ️ Help"]
          ]).resize()
        );
      }
    }
    
    const serviceButtons = [];
    for (const serviceId in services) {
      const service = services[serviceId];
      const availableCountries = getAvailableCountriesForService(serviceId);
      
      if (availableCountries.length > 0) {
        serviceButtons.push([
          { 
            text: `${service.icon} ${service.name}`, 
            callback_data: `user_select_service:${serviceId}` 
          }
        ]);
      }
    }
    
    if (serviceButtons.length === 0) {
      return ctx.reply(
        "📭 *No Numbers Available*\n\n" +
        "Sorry, all numbers are currently in use.\n" +
        "Please try again later or contact admin.",
        {
          parse_mode: "Markdown",
          reply_markup: Markup.keyboard([
            ["📞 Get Number"],
            ["🔄 Change Number"],
            ["ℹ️ Help"]
          ]).resize()
        }
      );
    }
    
    await ctx.reply(
      "🎯 *Select Service*\n\n" +
      "Choose the service you need numbers for:",
      {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: serviceButtons }
      }
    );
    
  } catch (error) {
    console.error("Get number error:", error);
    ctx.reply(
      "❌ Error getting number. Please try again.",
      Markup.keyboard([
        ["📞 Get Number"],
        ["🔄 Change Number"],
        ["ℹ️ Help"]
      ]).resize()
    );
  }
});

/******************** USER SELECT SERVICE ********************/
bot.action(/^user_select_service:(.+)$/, async (ctx) => {
  try {
    const serviceId = ctx.match[1];
    const availableCountries = getAvailableCountriesForService(serviceId);
    
    if (availableCountries.length === 0) {
      return ctx.answerCbQuery("❌ No numbers for this service", { show_alert: true });
    }
    
    const countryButtons = availableCountries.map(countryCode => {
      const country = countries[countryCode];
      const count = numbersByCountryService[countryCode][serviceId].length;
      
      return [
        { 
          text: `${country.flag} ${country.name} (${count})`, 
          callback_data: `user_select_country:${serviceId}:${countryCode}` 
        }
      ];
    });
    
    const service = services[serviceId];
    
    await ctx.editMessageText(
      `🌍 *Select Country for ${service.icon} ${service.name}*\n\n` +
      "Choose a country to get numbers from:",
      {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: countryButtons }
      }
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
    
    if (!numbers) {
      return ctx.answerCbQuery(`❌ Need ${NUMBERS_PER_USER} numbers but not enough available`, { show_alert: true });
    }
    
    if (ctx.session.currentNumbers.length > 0) {
      for (const oldNum of ctx.session.currentNumbers) {
        delete activeNumbers[oldNum];
      }
      saveActiveNumbers();
    }
    
    ctx.session.currentNumbers = numbers;
    ctx.session.currentService = serviceId;
    ctx.session.currentCountry = countryCode;
    ctx.session.lastNumberTime = now;
    
    const country = countries[countryCode];
    const service = services[serviceId];
    
    const numbersList = numbers.map((num, idx) => 
      `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``
    ).join('\n');
    
    await ctx.editMessageText(
      `✅ *Numbers Received!*\n\n` +
      `📱 *Service:* ${service.name}\n` +
      `${country.flag} *Country:* ${country.name}\n` +
      `${numbersList}\n\n` +
      `⏰ *You can change numbers after 5 seconds*\n` +
      `📨 *OTP Group:* ${OTP_GROUP}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "🔄 Change Numbers", 
                callback_data: `user_change_number:${serviceId}:${countryCode}` 
              }
            ]
          ]
        }
      }
    );
    
    await ctx.reply(
      `Use "🔄 Change Numbers" button or wait 5 seconds and click menu button.`,
      Markup.keyboard([
        ["📞 Get Number"],
        ["🔄 Change Number"],
        ["ℹ️ Help"]
      ]).resize()
    );
    
  } catch (error) {
    console.error("Country selection error:", error);
    ctx.answerCbQuery("❌ Error getting numbers", { show_alert: true });
  }
});

/******************** USER CHANGE NUMBER - REPLY BUTTON ********************/
bot.hears("🔄 Change Number", async (ctx) => {
  try {
    if (!ctx.session.verified) {
      return ctx.reply("❌ Please verify first. Use /start");
    }
    
    if (ctx.session.currentNumbers.length === 0) {
      return ctx.reply(
        "❌ You don't have active numbers.\nClick '📞 Get Number' first.",
        Markup.keyboard([
          ["📞 Get Number"],
          ["🔄 Change Number"],
          ["ℹ️ Help"]
        ]).resize()
      );
    }
    
    const now = Date.now();
    const timeSinceLast = now - ctx.session.lastNumberTime;
    const cooldown = 5000;
    
    if (timeSinceLast < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
      return ctx.reply(
        `⏳ Please wait ${remaining} seconds before changing numbers.`,
        Markup.keyboard([
          ["📞 Get Number"],
          ["🔄 Change Number"],
          ["ℹ️ Help"]
        ]).resize()
      );
    }
    
    const serviceId = ctx.session.currentService;
    const countryCode = ctx.session.currentCountry;
    
    if (!serviceId || !countryCode) {
      return ctx.reply(
        "❌ Cannot change numbers. Please get numbers first.",
        Markup.keyboard([
          ["📞 Get Number"],
          ["🔄 Change Number"],
          ["ℹ️ Help"]
        ]).resize()
      );
    }
    
    const userId = ctx.from.id;
    const numbers = getNumbersByCountryAndService(NUMBERS_PER_USER, countryCode, serviceId, userId);
    
    if (!numbers) {
      return ctx.reply(
        `❌ Not enough numbers available for this service/country.\nPlease try a different service or country.`,
        Markup.keyboard([
          ["📞 Get Number"],
          ["🔄 Change Number"],
          ["ℹ️ Help"]
        ]).resize()
      );
    }
    
    for (const oldNum of ctx.session.currentNumbers) {
      delete activeNumbers[oldNum];
    }
    saveActiveNumbers();
    
    ctx.session.currentNumbers = numbers;
    ctx.session.lastNumberTime = now;
    
    const country = countries[countryCode];
    const service = services[serviceId];
    
    const numbersList = numbers.map((num, idx) => 
      `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``
    ).join('\n');
    
    await ctx.reply(
      `🔄 *Numbers Changed!*\n\n` +
      `📱 *Service:* ${service.name}\n` +
      `${country.flag} *Country:* ${country.name}\n` +
      `${numbersList}\n\n` +
      `⏰ *Next change in:* 5 seconds\n` +
      `📨 *OTP Group:* ${OTP_GROUP}`,
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
    console.error("Change number error:", error);
    ctx.reply(
      "❌ Error changing numbers. Please try again.",
      Markup.keyboard([
        ["📞 Get Number"],
        ["🔄 Change Number"],
        ["ℹ️ Help"]
      ]).resize()
    );
  }
});

/******************** USER CHANGE NUMBER - INLINE BUTTON ********************/
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
    
    if (!numbers) {
      return ctx.answerCbQuery(`❌ Need ${NUMBERS_PER_USER} numbers but not enough`, { show_alert: true });
    }
    
    if (ctx.session.currentNumbers.length > 0) {
      for (const oldNum of ctx.session.currentNumbers) {
        delete activeNumbers[oldNum];
      }
      saveActiveNumbers();
    }
    
    ctx.session.currentNumbers = numbers;
    ctx.session.currentService = serviceId;
    ctx.session.currentCountry = countryCode;
    ctx.session.lastNumberTime = now;
    
    const country = countries[countryCode];
    const service = services[serviceId];
    
    const numbersList = numbers.map((num, idx) => 
      `📞 *Number ${idx+1}:* \`+${countryCode} ${num.slice(countryCode.length)}\``
    ).join('\n');
    
    await ctx.editMessageText(
      `🔄 *Numbers Changed!*\n\n` +
      `📱 *Service:* ${service.name}\n` +
      `${country.flag} *Country:* ${country.name}\n` +
      `${numbersList}\n\n` +
      `⏰ *Next change in:* 5 seconds\n` +
      `📨 *OTP Group:* ${OTP_GROUP}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "🔄 Change Again", 
                callback_data: `user_change_number:${serviceId}:${countryCode}` 
              }
            ]
          ]
        }
      }
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
    
    if (parts.length < 2) {
      return ctx.reply("❌ Usage: /adminlogin [password]\nExample: /adminlogin mamun1132");
    }
    
    const password = parts[1];
    
    if (password === ADMIN_PASSWORD) {
      ctx.session.isAdmin = true;
      ctx.session.verified = true;
      
      await ctx.reply(
        "✅ *Admin Login Successful!*\n\n" +
        "You now have administrator privileges.\n" +
        "Use /admin to access admin panel.",
        { 
          parse_mode: "Markdown",
          reply_markup: Markup.keyboard([
            ["📞 Get Number"],
            ["🔄 Change Number"],
            ["ℹ️ Help"]
          ]).resize()
        }
      );
    } else {
      await ctx.reply("❌ Wrong password. Access denied.");
    }
  } catch (error) {
    console.error("Admin login error:", error);
    await ctx.reply("❌ Error during admin login.");
  }
});

bot.command("admin", async (ctx) => {
  try {
    if (!ctx.session.isAdmin) {
      return ctx.reply(
        "❌ *Admin Access Required*\n\n" +
        `Use /adminlogin ${ADMIN_PASSWORD} to login as admin.`,
        { parse_mode: "Markdown" }
      );
    }
    
    await ctx.reply(
      "🛠 *Admin Dashboard*\n\n" +
      "Select an option:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📤 Upload Numbers", callback_data: "admin_upload" },
              { text: "📊 Stock Report", callback_data: "admin_stock" }
            ],
            [
              { text: "🌍 Add Country", callback_data: "admin_add_country" },
              { text: "🔧 Add Service", callback_data: "admin_add_service" }
            ],
            [
              { text: "🗑️ Delete Service", callback_data: "admin_delete_service" },
              { text: "👥 User Stats", callback_data: "admin_users" }
            ],
            [
              { text: "📢 Broadcast", callback_data: "admin_broadcast" },
              { text: "➕ Add Numbers", callback_data: "admin_add_numbers" }
            ],
            [
              { text: "❌ Delete Numbers", callback_data: "admin_delete" },
              { text: "📋 List Services", callback_data: "admin_list_services" }
            ],
            [
              { text: "🚪 Logout", callback_data: "admin_logout" }
            ]
          ]
        }
      }
    );
    
  } catch (error) {
    console.error("Admin command error:", error);
    await ctx.reply("❌ Error accessing admin panel.");
  }
});

/******************** ADMIN ACTIONS - DELETE SERVICE ********************/
bot.action("admin_delete_service", async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  
  const serviceList = Object.keys(services);
  
  if (serviceList.length === 0) {
    return ctx.editMessageText("📭 *No services available to delete.*", {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] }
    });
  }
  
  const buttons = serviceList.map(serviceId => {
    const service = services[serviceId];
    return [{ text: `${service.icon} Delete ${service.name}`, callback_data: `admin_delete_service_confirm:${serviceId}` }];
  });
  
  buttons.push([{ text: "❌ Cancel", callback_data: "admin_back" }]);
  
  await ctx.editMessageText(
    "🗑️ *Delete Service*\n\n" +
    "Select a service to delete. This will also delete all numbers under this service!\n\n" +
    "⚠️ *WARNING:* This action cannot be undone!",
    {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons }
    }
  );
});

bot.action(/^admin_delete_service_confirm:(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  
  const serviceId = ctx.match[1];
  const service = services[serviceId];
  
  if (!service) {
    return ctx.answerCbQuery("❌ Service not found", { show_alert: true });
  }
  
  await ctx.editMessageText(
    `⚠️ *Confirm Service Deletion*\n\n` +
    `Are you sure you want to delete *${service.icon} ${service.name}*?\n\n` +
    `This will also delete ALL numbers associated with this service!\n\n` +
    `This action cannot be undone!`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Yes, Delete Service", callback_data: `admin_delete_service_execute:${serviceId}` },
            { text: "❌ Cancel", callback_data: "admin_delete_service" }
          ]
        ]
      }
    }
  );
});

bot.action(/^admin_delete_service_execute:(.+)$/, async (ctx) => {
  if (!ctx.session.isAdmin) return ctx.answerCbQuery("❌ Admin only");
  
  const serviceId = ctx.match[1];
  const service = services[serviceId];
  
  if (!service) {
    return ctx.editMessageText("❌ Service not found.", {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "admin_back" }]] }
    });
  }
  
  // Remove service from all countries
  let totalDeleted = 0;
  for (const countryCode in numbersByCountryService) {
    if (numbersByCountryService[countryCode][serviceId]) {
      totalDeleted += numbersByCountryService[countryCode][serviceId].length;
      delete numbersByCountryService[countryCode][serviceId];
    }
    
    // Remove country if no services left
    if (Object.keys(numbersByCountryService[countryCode]).length === 0) {
      delete numbersByCountry