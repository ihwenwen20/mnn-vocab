// reindex.js
const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "vocab2.csv");
const OUTPUT = path.join(__dirname, "vocab.reindexed.csv");

const csv = fs.readFileSync(INPUT, "utf8");

// ================= utils =================
function normalizeCSV(csv) {
  return csv
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
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

function joinCSVLine(values) {
  return values.join(",");
}

// ================= main =================
const lines = normalizeCSV(csv).trim().split(/\r?\n/);
const headers = splitCSVLine(lines.shift());

const idIndex = headers.indexOf("id");
const lessonIndex = headers.indexOf("lesson");

if (idIndex === -1 || lessonIndex === -1) {
  console.error("❌ Kolom 'id' atau 'lesson' tidak ditemukan");
  process.exit(1);
}

const expectedCols = headers.length;
let newId = 1;
let lastLesson = null;

const output = [];
output.push(joinCSVLine(headers));

lines.forEach((line, i) => {
  if (!line.trim()) return;

  const values = splitCSVLine(line);

  if (values.length !== expectedCols) {
    console.warn(
      `⚠️ Baris ${i + 2}: kolom=${values.length}, expected=${expectedCols}`
    );
  }

  const currentLesson = values[lessonIndex];

  // 👉 Tambahkan baris kosong jika lesson berubah
  if (lastLesson !== null && currentLesson !== lastLesson) {
    output.push(""); // empty line
  }

  values[idIndex] = String(newId++);
  output.push(joinCSVLine(values));

  lastLesson = currentLesson;
});

fs.writeFileSync(OUTPUT, output.join("\n"), "utf8");

console.log("✅ Reindex + separator lesson selesai");
console.log(`📄 Output: ${OUTPUT}`);