export const CATEGORY_LIST =
  "consumer (צרכנות), banking (בנקים), employment (דיני עבודה), rental (שכירות), tort (נזיקין), neighbors (שכנים), authorities (עיריות ורשויות)";

export const CATEGORY_JSON =
  "consumer | banking | employment | rental | tort | neighbors | authorities";

export const CATEGORY_CLASSIFICATION_RULES = `- neighbors: סכסוך מול שכן או דייר בבניין (רעש, חניה, נזילה, רכוש משותף, חיות, ריח, חריגת בנייה לשטח משותף).
- authorities: מול עירייה, מועצה, רשות מקומית, תאגיד מים, חברת חשמל, ביטוח לאומי, מס הכנסה או גוף ציבורי דומה.
- tort: נזק, רשלנות או מטרד שאינם מול שכן ואינם מול רשות.
- אם יש ספק בין neighbors ל-tort והמקרה מול שכן — בחר neighbors.
- אם יש ספק בין authorities ל-tort והנתבע הוא רשות — בחר authorities.`;
