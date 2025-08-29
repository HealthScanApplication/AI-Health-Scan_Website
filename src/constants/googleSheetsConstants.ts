export const SETUP_STEPS = [
  {
    id: 1,
    title: "Create Google Cloud Project",
    color: "green",
    steps: [
      {
        text: "Go to Google Cloud Console",
        link: "https://console.cloud.google.com/"
      },
      "Create a new project or select an existing one",
      "Note your project ID for later use"
    ]
  },
  {
    id: 2,
    title: "Enable Google Sheets API",
    color: "blue", 
    steps: [
      'In Google Cloud Console, go to "APIs & Services" → "Library"',
      'Search for "Google Sheets API"',
      'Click "Enable" on the Google Sheets API'
    ]
  },
  {
    id: 3,
    title: "Create API Credentials",
    color: "purple",
    steps: [
      'Go to "APIs & Services" → "Credentials"',
      'Click "Create Credentials" → "API Key"',
      "Copy your API key (keep it secure!)",
      "Optionally: Restrict the API key to Google Sheets API only"
    ]
  },
  {
    id: 4,
    title: "Create Google Sheet",
    color: "orange",
    steps: [
      {
        text: "Go to Google Sheets",
        link: "https://sheets.google.com/"
      },
      "Create a new blank spreadsheet",
      'Name it "HealthScan Email Signups" (or any name you prefer)',
      "Copy the Spreadsheet ID from the URL",
      "Make sure the sheet is accessible (not private)"
    ]
  }
];

export const SHEET_HEADERS = [
  "Email", "Signup Date", "Name", "Source", "Queue Position", 
  "Total Waitlist", "Referral Code", "Used Referral Code", 
  "Email Confirmed", "User Agent", "IP Address", "Sheet Added Date"
];

export const ENVIRONMENT_VARIABLES = [
  { name: "GOOGLE_SHEETS_API_KEY", description: "Your Google Sheets API key" },
  { name: "GOOGLE_SHEETS_SPREADSHEET_ID", description: "The spreadsheet ID from the URL" }
];

export const TEST_CHECKS = [
  "Google Sheets API connectivity",
  "Spreadsheet access permissions", 
  "Sheet initialization and header setup",
  "Recent signup data retrieval"
];