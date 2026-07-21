function numberToHebrewLetters(num: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];

  if (num === 15) return "ט״ו";
  if (num === 16) return "ט״ז";

  let result = "";
  let n = num;

  if (n >= 100) {
    const h = Math.floor(n / 100);
    if (h <= 4) {
      result += hundreds[h];
    } else {
      for (let i = 0; i < Math.floor(h / 4); i++) result += "ת";
      if (h % 4 > 0) result += hundreds[h % 4];
    }
    n %= 100;
  }
  if (n >= 10) {
    if (n === 15) {
      result += "טו";
      n = 0;
    } else if (n === 16) {
      result += "טז";
      n = 0;
    } else {
      result += tens[Math.floor(n / 10)];
      n %= 10;
    }
  }
  if (n > 0) {
    result += ones[n];
  }

  if (result.length > 1) {
    result = result.slice(0, -1) + "״" + result.slice(-1);
  } else if (result.length === 1) {
    result += "׳";
  }

  return result;
}

export function getHebrewDateLabel(date = new Date()): string {
  const dayStr = date.toLocaleDateString("he-IL-u-ca-hebrew", { day: "numeric" });
  const month = date.toLocaleDateString("he-IL-u-ca-hebrew", { month: "long" });
  const yearStr = date.toLocaleDateString("he-IL-u-ca-hebrew", { year: "numeric" });

  const hebrewDay = numberToHebrewLetters(parseInt(dayStr, 10));
  const hebrewYear = numberToHebrewLetters(parseInt(yearStr, 10) % 1000);

  return `${hebrewDay} ב${month} ${hebrewYear}`;
}
