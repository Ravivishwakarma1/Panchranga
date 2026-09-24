# Panchranga (पंचरंग)

> **Every Color of the Story** — Automated Multi-Perspective Indian News Aggregator

Panchranga is an open-source, independent news intelligence platform for Indian news. We bring together coverage from mainstream national media, grassroots independent reporters, and public discourse — side by side on one screen.

The name Panchranga means "many colors" — because every news story has more than one color to it. We believe you deserve to see them all.

No editors. No paywalls. No bias labels. Just every color of the story.

---

## 🌟 The Three-Lane Structure

1. **Mainstream**: National English & Hindi daily newspapers and official press releases (e.g., Indian Express, Times of India, NDTV, PIB). Provides institutional and official framing.
2. **Grassroots**: Independent outlets, investigative journalists, and ground reporters (e.g., The Wire, Scroll.in, The News Minute, PARI). Offers field reporting and regional depth.
3. **Public Discourse**: Public discussions, online community threads, and citizen reactions from active subreddits (e.g., r/india, r/IndiaSpeaks, r/indiatech).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database & Vectors**: Supabase Postgres with `pgvector`
- **Embeddings**: Open-source vector embeddings (MiniLM-L6-v2, 384 dimensions)
- **Pipeline**: GitHub Actions scheduled ingestion cron

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Ravivishwakarma1/Panchranga.git
cd Panchranga

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ⚖️ License

MIT License. Open Source, No Editors, No Paywall.
