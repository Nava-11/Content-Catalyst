# 🚀 Content Catalyst  
### AI-Powered Creative Intelligence Platform for YouTube Creators

Content Catalyst is a **next-generation creator intelligence system** designed to help YouTube creators understand their content, optimize performance, and generate data-driven creative strategies.

Unlike traditional analytics tools, it acts as a **“Thinking Companion”**, combining semantic analysis, machine learning, and AI reasoning to guide creators toward sustainable growth.

---

## 🎯 Key Features

### 🧠 Creator World Model
- Semantic clustering of videos into content pillars  
- Tone fingerprint and format DNA analysis  
- Identity coherence and creative drift tracking  

### 📊 CRPS (Content Resonance & Performance Score)
- Normalizes engagement relative to channel average  
- Enables fair comparison across videos  
- Detects high-performing and underperforming content  

### 💡 AI Ideas Engine
- Multi-lens idea generation:
  - Contrast  
  - Remix  
  - Inversion  
  - Expansion  
- Uses contextual reasoning + creator history  
- Ranks ideas using intelligent bandit algorithms  

### 🤖 RAG-Based Chatbot
- Ask questions about your channel  
- Answers grounded in:
  - Clusters  
  - CRPS trends  
  - Content history  

### 🔥 Creative Fatigue Detection
- Detects repetition using entropy analysis  
- Alerts when content becomes monotonous  
- Suggests safe exploration strategies  

### 🔮 What-If Simulator
- Simulate content strategies before publishing  
- Predict impact on:
  - Performance  
  - Identity  
  - Fatigue  

### 🌌 Semantic Mood Board
- Visual map of content space  
- Shows:
  - Owned topics  
  - Adjacent opportunities  
  - Unexplored areas  

### 🧩 Additional Intelligence Features
- Narrative structure analysis (Hook → Problem → Solution)  
- Comment emotion clustering  
- Series arc detection  
- Dynamic creator roadmap (auto-updated after each upload)  

---

## 🏗️ System Architecture

Content Catalyst follows a **modular, event-driven architecture**:

### 🔹 Core Layers
- **Data Ingestion Layer** → YouTube API integration  
- **Analytics Layer** → CRPS, engagement metrics  
- **Semantic Layer** → NLP + embeddings  
- **Clustering Layer** → Topic grouping  
- **Creative Intelligence Layer** → Idea generation  
- **Simulation Layer** → What-if analysis  
- **Presentation Layer** → React dashboard  

### 🔹 Technologies Used
- **Frontend**: React, TypeScript  
- **Backend**: Node.js, Express  
- **Database**: PostgreSQL  
- **Caching**: Redis  
- **Event Streaming**: Apache Kafka  
- **AI/ML**:
  - Hugging Face Transformers  
  - K-Means, HDBSCAN clustering  
  - Thompson Sampling (Bandit algorithms)  

---

## 🧪 Testing & Validation

A complete **unit testing suite** is implemented using Vitest.

### 📊 Test Summary

| Component          | Tests | Focus                         | Status |
|------------------|------|------------------------------|--------|
| CRPS Engine       | 8    | Mathematical accuracy         | ✅ Passed |
| Clustering Logic  | 7    | Topic grouping               | ✅ Passed |
| Ranking Engine    | 8    | Idea selection logic         | ✅ Passed |
| API Layer         | 3    | Response handling            | ✅ Passed |
| React Components  | 4    | UI behavior                  | ✅ Passed |
| Utilities         | 3    | Data formatting              | ✅ Passed |

👉 **Total: 33 Tests | 100% Pass Rate**

---

## 📈 Validation Metrics

### 🔹 Performance
- **CRPS** → Relative video performance  

### 🔹 Clustering
- **Silhouette Score** → Topic quality  

### 🔹 Creator Health
- Topic Diversity  
- Engagement Stability  
- Innovation Rate  
- Curiosity Coverage  

### 🔹 Narrative Analysis
- Hook Strength  
- Problem Definition  
- Solution Depth  
- Retention Risk  

### 🔹 AI Ranking
- Alpha/Beta (Thompson Sampling)  
- Risk-based personalization  

---

## 💡 Key Insights

- Transforms raw data into **actionable creative decisions**  
- Balances:
  - Exploration (new ideas)  
  - Exploitation (proven strategies)  
- Enables **long-term creative sustainability**

---


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
