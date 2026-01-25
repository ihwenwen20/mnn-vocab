const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "vocab2.csv");

// ================= utils =================
function normalizeCSV(csv) {
  return csv.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

// ================= main =================
const csv = fs.readFileSync(INPUT, "utf8");
const lines = normalizeCSV(csv).trim().split(/\r?\n/);
const headers = splitCSVLine(lines.shift());

// Ambil keyword dari command line
const keyword = process.argv.slice(2).join(" ").toLowerCase();
// console.log('keyword', keyword)


if (!keyword) {
  console.log("Gunakan: node search.js <kata>");
  process.exit(0);
}

const results = [];
// console.log('lines', lines)


lines.forEach((line) => {
  const values = splitCSVLine(line);  

  // Gabungkan semua kolom yang ingin dicari
  const searchable = [
    values[headers.indexOf("kana")],
    values[headers.indexOf("kanji")],
    values[headers.indexOf("romaji")],
    values[headers.indexOf("meaning")],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();    

  if (searchable.includes(keyword)) {
    results.push(values);
  }
});

// Tampilkan hasil
if (results.length === 0) {
  console.log(`❌ Tidak ditemukan hasil untuk "${keyword}"`);
} else {
  console.log(`✅ Ditemukan ${results.length} hasil untuk "${keyword}":\n`);
  results.forEach((r) => {
    console.log(headers.map((h, i) => `${h}: ${r[i]}`).join(" | "));
  });
}
