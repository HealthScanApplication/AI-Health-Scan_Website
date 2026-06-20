import { useState, useEffect } from "react";
import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  link: string;
}

export function BlogPreviewSection() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const substackMainUrl = "https://healthscan.substack.com";

  const loadSampleArticles = () => {
    const sampleArticles: BlogArticle[] = [
      {
        id: "sample-1",
        title: "Reading food labels: your complete guide to healthier choices",
        excerpt: "Decode complex food labels and spot the additives worth avoiding in everyday products, so you can choose with confidence.",
        author: "HealthScan Research Team",
        publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: "5 min read",
        tags: ["nutrition", "food safety", "ingredients"],
        link: substackMainUrl,
      },
      {
        id: "sample-2",
        title: "Hidden toxins in everyday products: what you need to know",
        excerpt: "Common household products can carry harmful chemicals. Here are the ones to watch and the safer alternatives.",
        author: "Dr. Sarah Martinez",
        publishDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: "7 min read",
        tags: ["toxins", "environmental", "safety"],
        link: substackMainUrl,
      },
    ];
    setArticles(sampleArticles);
  };

  const fetchLatestArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const { projectId, publicAnonKey } = await import("../utils/supabase/info");
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/articles`;
      const response = await fetch(serverUrl, {
        headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const result = await response.json();
      if (!result.success || !result.data) throw new Error("Server returned invalid response");
      const transformed: BlogArticle[] = result.data.slice(0, 3).map((a: any, index: number) => ({
        id: a.id || `server-article-${index}`,
        title: a.title?.length > 90 ? a.title.substring(0, 90) + "…" : a.title || "Untitled",
        excerpt: a.excerpt?.length > 200 ? a.excerpt.substring(0, 200) + "…" : a.excerpt || "",
        author: a.author || "HealthScan Team",
        publishDate: a.publishDate || new Date().toISOString(),
        readTime: a.readTime || "3 min read",
        imageUrl: a.imageUrl,
        tags: a.tags?.slice(0, 3) || [],
        link: a.link || substackMainUrl,
      }));
      setArticles(transformed);
    } catch (err: any) {
      setError("Unable to load latest articles");
      loadSampleArticles();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent";
    }
  };

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  return (
    <section style={{ background: ed.paper, width: "100%" }}>
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          paddingLeft: "clamp(20px, 5vw, 72px)",
          paddingRight: "clamp(20px, 5vw, 72px)",
          paddingTop: "clamp(80px, 11vw, 168px)",
          paddingBottom: "clamp(80px, 11vw, 168px)",
        }}
      >
        {/* Header */}
        <div style={{ borderTop: `1px solid ${ed.hair}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <p style={kickerStyle}>From the journal</p>
          <p style={folioStyle}>Reading</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <h2 style={h2Style}>
            Latest <span style={{ fontStyle: "italic", color: ed.accent }}>reading</span>.
          </h2>
          <p style={{ ...deckStyle, marginTop: 22, maxWidth: "46ch" }}>
            Research-backed notes on nutrition, food safety and wellness from the HealthScan team.
          </p>
        </div>

        {/* List */}
        <div style={{ marginTop: "clamp(44px, 6vw, 80px)", maxWidth: 1040, borderTop: `1px solid ${ed.hair}` }}>
          {loading && (
            <p style={{ fontFamily: GRO, fontSize: 15, color: ed.inkSoft, padding: "32px 0" }}>Loading the latest…</p>
          )}

          {!loading &&
            articles.map((article, i) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", flexWrap: "wrap", gap: "12px 40px", alignItems: "baseline", padding: "30px 0", borderBottom: `1px solid ${ed.hair}`, textDecoration: "none" }}
              >
                <div style={{ flexShrink: 0, width: 130, fontFamily: GRO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: ed.inkFaint, lineHeight: 1.6 }}>
                  <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "1.1rem", color: ed.accent, textTransform: "none", letterSpacing: 0, marginBottom: 6 }}>{String(i + 1).padStart(2, "0")}</div>
                  {formatDate(article.publishDate)}
                  <br />
                  {article.readTime}
                </div>
                <div style={{ flex: "1 1 320px", minWidth: 280 }}>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)", lineHeight: 1.15, letterSpacing: "-0.02em", color: ed.ink, margin: "0 0 10px" }}>{article.title}</h3>
                  <p style={{ fontFamily: GRO, fontSize: 16, lineHeight: 1.6, color: ed.inkSoft, margin: "0 0 12px", maxWidth: "60ch" }}>{article.excerpt}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px" }}>
                    {article.tags.map((tag) => (
                      <span key={tag} style={{ fontFamily: GRO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: ed.inkFaint }}>{tag}</span>
                    ))}
                    <span style={{ fontFamily: GRO, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: ed.ink, textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: ed.accent, marginLeft: "auto" }}>Read →</span>
                  </div>
                </div>
              </a>
            ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "clamp(40px, 5vw, 64px)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <a href={substackMainUrl} target="_blank" rel="noopener noreferrer" className="ed-cta">Read all articles →</a>
          <span style={{ fontFamily: GRO, fontSize: 12, color: ed.inkFaint }}>Free · No spam · Research-backed</span>
        </div>
      </div>
    </section>
  );
}
