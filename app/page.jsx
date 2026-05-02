"use client";

export default function Page() {
  const goToVip = () => {
    window.location.href = "https://www.quanlyhoihoa.vip/selina";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, #2d1b69 0%, #12091f 45%, #020617 100%)",
        color: "white",
        overflow: "hidden",
        position: "relative",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(236,72,153,0.22), rgba(168,85,247,0.2), rgba(34,197,94,0.12))",
          filter: "blur(40px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16) 0 2px, transparent 3px), radial-gradient(circle at 70% 30%, rgba(244,114,182,0.25) 0 3px, transparent 4px), radial-gradient(circle at 40% 80%, rgba(250,204,21,0.22) 0 3px, transparent 4px)",
          backgroundSize: "90px 90px, 130px 130px, 160px 160px",
          animation: "floatBg 12s linear infinite",
          opacity: 0.75,
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "820px",
          padding: "42px 28px",
          borderRadius: "32px",
          textAlign: "center",
          background: "rgba(15, 23, 42, 0.72)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div
          style={{
            fontSize: "42px",
            marginBottom: "18px",
          }}
        >
          🌸
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 5vw, 52px)",
            lineHeight: 1.22,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            background:
              "linear-gradient(90deg, #fff7ed, #fde68a, #f9a8d4, #c4b5fd)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 28px rgba(244,114,182,0.18)",
          }}
        >
          Web quản lý hoa của Hội SELINA đã chuyển sang phiên bản VIP PRO MAX
        </h1>

        <p
          style={{
            margin: "20px auto 30px",
            maxWidth: "560px",
            fontSize: "18px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          Bấm nút bên dưới để chuyển sang phiên bản mới.
        </p>

        <button
          onClick={goToVip}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "18px 34px",
            borderRadius: "999px",
            fontSize: "22px",
            fontWeight: 900,
            color: "white",
            background:
              "linear-gradient(135deg, #ec4899, #f97316, #facc15)",
            boxShadow:
              "0 16px 38px rgba(236,72,153,0.45), inset 0 1px 0 rgba(255,255,255,0.45)",
            transform: "translateY(0)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          Tới luôn bạn êi ✨
        </button>
      </section>

      <style jsx>{`
        @keyframes floatBg {
          from {
            background-position: 0 0, 0 0, 0 0;
          }
          to {
            background-position: 180px 180px, -260px 180px, 220px -220px;
          }
        }

        button {
          transition: all 0.22s ease;
        }
      `}</style>
    </main>
  );
}