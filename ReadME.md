# 🚀 Amazon Review Intelligence Dashboard

> AI-Powered Amazon Product Review Analysis with Real-time Insights

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**Amazon Review Intelligence** is an AI-powered analytics platform that transforms Amazon product reviews into actionable insights. Built with modern technologies, it provides sentiment analysis, keyword extraction, emotion detection, and comprehensive visualizations.

### Key Capabilities

- 🤖 **AI-Powered Analysis**: Advanced NLP using transformers and sentiment models
- 📊 **Interactive Dashboards**: Real-time visualizations with Chart.js and D3.js
- 🌍 **Multi-Country Support**: Fetch reviews from Amazon marketplaces worldwide
- 📈 **Trend Detection**: Identify patterns and emerging issues
- 💬 **Emotion Analysis**: Detect joy, anger, surprise, and more
- 📄 **Report Generation**: Export professional PDF/Excel reports

## ✨ Features

### Backend (FastAPI)
- ✅ RESTful API with automatic OpenAPI documentation
- ✅ Apify integration for review scraping
- ✅ Multi-model NLP pipeline (VADER, TextBlob, Transformers)
- ✅ Sentiment scoring with confidence intervals
- ✅ Keyword clustering and topic modeling
- ✅ Emotion detection (8 categories)
- ✅ Automated report generation (PDF/Excel)
- ✅ Rate limiting and error handling
- ✅ CORS support for cross-origin requests

### Frontend (Next.js)
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Real-time data visualization
- ✅ Interactive charts and graphs
- ✅ Product search with ASIN/URL support
- ✅ Multi-tab analytics view
- ✅ Export functionality
- ✅ Loading states and error boundaries
- ✅ Dark mode support

## 🛠️ Tech Stack

### Backend
```
- Framework: FastAPI 0.109+
- Language: Python 3.11+
- NLP: Transformers, NLTK, spaCy
- Scraping: Apify API
- Database: PostgreSQL (optional)
- Caching: Redis (optional)
```

### Frontend
```
- Framework: Next.js 14
- Language: TypeScript
- UI: Shadcn UI + Tailwind CSS
- Charts: Recharts, D3.js
- State: React Hooks
- HTTP: Axios
```

### DevOps
```
- CI/CD: GitHub Actions
- Backend: Render
- Frontend: Vercel
- Monitoring: Sentry (optional)
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐      ┌──────────────┐
│   Backend       │◄────►│  Apify API   │
│   (FastAPI)     │      │  (Scraping)  │
│   Port: 8000    │      └──────────────┘
└────────┬────────┘
         │
         │
┌────────▼────────┐      ┌──────────────┐
│  NLP Pipeline   │◄────►│  AI Models   │
│  - Sentiment    │      │  - OpenAI    │
│  - Keywords     │      │  - HuggingFace│
│  - Emotions     │      └──────────────┘
└─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

```bash
# Check versions
python --version  # 3.11+
node --version    # 18+
npm --version     # 9+
```

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/amazon-review-intelligence.git
cd amazon-review-intelligence
```

#### 2️⃣ Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python -m nltk.downloader punkt stopwords vader_lexicon

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

**Required Environment Variables:**
```env
APIFY_API_TOKEN=your_apify_token_here
OPENAI_API_KEY=your_openai_key_here  # Optional
DEBUG=True
ENABLE_AI=True
ENABLE_EMOTIONS=True
MAX_REVIEWS_PER_REQUEST=100
```

#### 3️⃣ Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Frontend Environment:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APIFY_TOKEN=your_token_here
```

### Running Locally

#### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🌐 Deployment

### Backend (Render)

1. **Create Render Account**: https://render.com
2. **Create New Web Service**
3. **Connect GitHub Repository**
4. **Configure Settings:**
   ```
   Name: amazon-review-intelligence-api
   Environment: Python
   Branch: main
   Build Command: pip install -r requirements.txt && python -m nltk.downloader punkt stopwords vader_lexicon
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Add Environment Variables** (from Render dashboard)
6. **Deploy!**

### Frontend (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Or use Vercel Dashboard**:
   - Connect GitHub repo
   - Auto-deploy on push to main
   - Configure environment variables

### CI/CD Setup

1. **Add GitHub Secrets**:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `APIFY_API_TOKEN`
   - `OPENAI_API_KEY`

2. **Copy Workflow File**:
   ```bash
   mkdir -p .github/workflows
   cp .github-workflows-deploy.yml .github/workflows/deploy.yml
   ```

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push origin main
   ```

## 📚 API Documentation

### Endpoints

#### Health Check
```http
GET /health
```

#### Analyze Reviews
```http
POST /api/v1/reviews/analyze
Content-Type: application/json

{
  "asin": "B08N5WRWNW",
  "country": "US",
  "max_reviews": 100,
  "enable_ai": true,
  "enable_emotions": true
}
```

#### Get Sentiment Analysis
```http
GET /api/v1/reviews/sentiment/{asin}
```

### Response Example
```json
{
  "success": true,
  "data": {
    "product_info": {
      "asin": "B08N5WRWNW",
      "title": "Product Name",
      "rating": 4.5
    },
    "sentiment_analysis": {
      "overall_sentiment": "positive",
      "positive_percentage": 75.5,
      "negative_percentage": 15.2,
      "neutral_percentage": 9.3
    },
    "emotions": {
      "joy": 0.65,
      "surprise": 0.15,
      "anger": 0.10
    },
    "keywords": [
      {"word": "quality", "frequency": 45},
      {"word": "fast", "frequency": 32}
    ]
  }
}
```

Full API documentation available at: `http://localhost:8000/docs`

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:e2e
```

## 📊 Performance Optimization

### Backend
- ✅ Response caching with Redis
- ✅ Batch processing for reviews
- ✅ Async I/O operations
- ✅ Connection pooling
- ✅ Rate limiting

### Frontend
- ✅ Code splitting
- ✅ Image optimization
- ✅ Lazy loading
- ✅ CDN deployment
- ✅ Bundle size optimization

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for TypeScript
- Write tests for new features
- Update documentation

## 🐛 Known Issues & Roadmap

### Known Issues
- [ ] Heavy models may timeout on free hosting tiers
- [ ] Rate limiting needs tuning for high traffic

### Roadmap
- [ ] Multi-product comparison
- [ ] Historical trend analysis
- [ ] Email report scheduling
- [ ] Authentication system
- [ ] Admin dashboard
- [ ] Webhook integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apify for Amazon scraping API
- Hugging Face for NLP models
- FastAPI for the amazing framework
- Next.js team for the frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/amazon-review-intelligence/issues)
- **Email**: support@yourproject.com
- **Documentation**: [Wiki](https://github.com/yourusername/amazon-review-intelligence/wiki)

---

**Made with ❤️ by Technolity**

⭐ Star this repo if you find it helpful!

