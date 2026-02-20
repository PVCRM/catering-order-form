const fs = require("fs");
const path = require("path");

const htmlPath =
  "c:\\Users\\Admin\\Downloads\\Create_Catering_Order_Form_Single_File (2).html";
const html = fs.readFileSync(htmlPath, "utf8");

// Find the menu array: Q=[{name:"Sweet Pieces",...
const start = html.indexOf('Q=[{name:"Sweet Pieces"');
if (start === -1) {
  console.log("Menu Q=[ not found");
  process.exit(1);
}
// start points at "Q=", so array starts at start+2

let depth = 1; // we're inside Q=[ already
let inString = false;
let escape = false;
let end = -1;
let i = start + 3; // after "Q=["
let stringChar = null;

for (; i < Math.min(start + 5000000, html.length); i++) {
  const c = html[i];
  if (escape) {
    escape = false;
    continue;
  }
  if (inString) {
    if (c === "\\") escape = true;
    else if (c === stringChar) inString = false;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") {
    inString = true;
    stringChar = c;
    continue;
  }
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}

if (end === -1) {
  console.log("Could not find end of array");
  process.exit(1);
}

const arrStr = html.substring(start + 2, end + 1);
let menu;
try {
  menu = new Function("return " + arrStr)();
} catch (e) {
  console.error("Parse error", e.message);
  fs.writeFileSync(path.join(__dirname, "menu-extract.txt"), arrStr.substring(0, 5000));
  console.log("Wrote raw extract to menu-extract.txt");
  process.exit(1);
}
if (!Array.isArray(menu)) {
  console.log("Not an array, type:", typeof menu);
  process.exit(1);
}

fs.writeFileSync(
  path.join(__dirname, "lib", "menuData.js"),
  `// Cravings Cafe - Catering Menu (from original HTML form)
export const CATERING_MENU = ${JSON.stringify(menu, null, 2)};

export const CAFE_INFO = {
  name: "Cravings Cafe - Catering Menu",
  address: "129 Royal St, East Perth WA 6000",
  tradingHours: [
    "Monday – Friday: 6:00 AM – 2:00 PM",
    "Saturday: 7:00 AM – 1:00 PM",
  ],
  payment: {
    bank: "Commonwealth Bank",
    accountName: "Angel grooup pty ltd",
    bsb: "066-202",
    accountNumber: "10560943",
  },
};
`,
  "utf8"
);

console.log("Categories:", menu.length);
menu.forEach((c) => console.log(" -", c.name, ":", c.items.length, "items"));