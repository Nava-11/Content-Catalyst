# Content-Catalyst: AI Creative Intelligence Engine

Content-Catalyst is an advanced AI-driven platform designed for content creators to analyze performance, discover topic clusters, and generate high-impact content ideas using localized machine learning and game-theoretic ranking.

## 🚀 Key Features

- **Intelligence Engine**: Deep analysis of video performance relative to channel baselines.
- **Creative Health Score**: Metrics for Topic Diversity, Innovation Rate, and Curiosity Coverage.
- **Automated Clustering**: Groups videos into semantic topics using K-Means and Silhouette validation.
- **Idea Spark Generator**: Uses "Tension Detection" and "World Modeling" to recommend new video concepts.
- **Bandit Ranking**: Optimized feedback loop using Thompson Sampling to prioritize ideas.
- **Narrative Analysis**: Extract Hooks, Problem Definitions, and Solutions from transcripts to assess Retention Risk.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Express, Node.js, Drizzle ORM.
- **Database**: PostgreSQL (Storage), Redis (Caching), Vector DB (Embeddings).
- **ML/NLP**: HuggingFace (`@xenova/transformers`), `natural` NLP.
- **Infrastructure**: Kafka (Event-driven processing).
- **Testing**: Vitest, React Testing Library, Supertest.

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Content-Catalyst
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment**:
   Create a `.env` file with your database, Redis, and Kafka credentials.

4. **Initialize Database**:
   ```bash
   npx drizzle-kit push:pg
   ```

## 🧪 Testing

The project includes a comprehensive suite of **33 unit tests** covering mathematical logic, API routes, and UI components.

- **Run all tests**:
  ```bash
  npm run test:run
  ```

- **Run in UI mode**:
  ```bash
  npm run test:ui
  ```

## 📊 Core Metrics

- **CRPS (Creator-Relative Performance Score)**: A weighted metric $(0.5V + 0.3L + 0.2C)$ that compares video performance against your own channel's historical data.
- **Retention Risk**: A structural assessment of video narratives (Hook → Problem → Solution).
- **Ecosystem Health**: A 100-point score evaluating your content strategy's sustainability.

## 📂 Project Structure

- `client/src/components`: UI components and Narrative Visualizers.
- `server/services/features`: Core AI feature extraction logic.
- `server/services/ideas`: Clustering and idea generation engines.
- `server/services/ranking`: Feedback-based ranking and logic.
- `shared/schema.ts`: Database schema definitions.

---

For a detailed walkthrough of recent implementations and testing setup, see:
- [execution_steps.txt](./execution_steps.txt)
- [walkthrough.md](./brain/walkthrough.md)
