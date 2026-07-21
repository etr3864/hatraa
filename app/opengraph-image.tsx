import { ImageResponse } from "next/og";

export const alt = "התראה בקליק — מכתב התראה מקצועי תוך דקות";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Bold.ttf",
      { next: { revalidate: 60 * 60 * 24 * 30 } }
    );
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(145deg, #0d0d0f 0%, #15151a 55%, #1b2b3a 100%)",
          direction: "rtl",
          fontFamily: fontData ? "Noto Sans Hebrew" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            padding: "0 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#c9a84c",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            התראה בקליק
          </div>
          <div
            style={{
              display: "flex",
              color: "#f5f5f5",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            מכתב התראה מקצועי תוך דקות
          </div>
          <div
            style={{
              display: "flex",
              color: "#a0a4ab",
              fontSize: 28,
              marginTop: 4,
            }}
          >
            כלי עזר לניסוח מכתבים · מוכן להורדה כ־PDF
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            color: "#6b7078",
            fontSize: 22,
          }}
        >
          hatraa.co.il
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Noto Sans Hebrew",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : [],
    }
  );
}
