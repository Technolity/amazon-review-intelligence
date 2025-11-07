# Property Synchronization Checklist

This document ensures all properties are properly synced between backend and frontend.

---

## ✅ Review Interface

### Backend Returns (`backend/main.py` & `backend/app/services/apify_service.py`)
```python
{
    "id": str,
    "rating": float,
    "title": str,
    "text": str,
    "author": str,
    "date": str,
    "verified": bool,
    "helpful_count": int,
    "sentiment": str,              # Added by AI analysis
    "sentiment_confidence": float, # Added by AI analysis
    "polarity": float,             # Added by AI analysis
    "subjectivity": float,         # Added by AI analysis
    "bot_score": float,            # Added by bot detector
    "is_bot_likely": bool,         # Added by bot detector
    "bot_indicators": list[str],   # Added by bot detector
    "images": list[str],           # From Apify
    "variant": str,                # From Apify
    "country": str,                # From Apify
    "source": str,                 # Data source identifier
}
```

### Frontend Expects (`frontend/types/index.ts`)
```typescript
interface Review {
  id: string;
  rating: number;
  title: string;
  text: string;
  content?: string;              // Alias for text
  author: string;
  date: string;
  verified: boolean;
  verified_purchase?: boolean;   // Alias for verified
  helpful_count: number;
  sentiment?: string;
  sentiment_confidence?: number;
  polarity?: number;
  subjectivity?: number;
  emotions?: Record<string, number>;
  bot_score?: number;
  is_bot_likely?: boolean;
  bot_indicators?: string[];
  images?: string[];
  variant?: string;
  country?: string;
  source?: string;
}
```

**Status**: ✅ **SYNCED** - All required properties present, optional properties marked with `?`

---

## ✅ Product Info Interface

### Backend Returns
```python
{
    "title": str,
    "brand": str,
    "price": str,
    "image": str,
    "rating": float,
    "total_reviews": int,
    "asin": str,
}
```

### Frontend Expects
```typescript
interface ProductInfo {
  title: string;
  brand: string;
  price: string;
  image: string;
  rating?: number;
  total_reviews?: number;
  asin?: string;
}
```

**Status**: ✅ **SYNCED**

---

## ✅ Analysis Result Interface

### Backend Returns
```python
{
    "success": bool,
    "asin": str,
    "country": str,
    "total_reviews": int,
    "average_rating": float,
    "rating_distribution": dict,
    "sentiment_distribution": dict,
    "aggregate_metrics": dict,
    "emotions": dict,
    "top_keywords": list,
    "themes": list,
    "insights": list,
    "summary": str,
    "data_source": str,
    "ai_provider": str,
    "bot_detection": dict,      # NEW
    "product_info": dict,
    "reviews": list,
    "metadata": dict,
}
```

### Frontend Expects
```typescript
interface AnalysisResult {
  success: boolean;
  asin?: string;
  country?: string;
  product_info?: ProductInfo;
  reviews?: Review[];
  total_reviews: number;
  average_rating: number;
  rating_distribution: RatingDistribution;
  sentiment_distribution?: SentimentDistribution;
  aggregate_metrics?: { ... };
  emotions?: Record<string, number>;
  top_keywords?: Keyword[];
  themes?: Theme[];
  insights?: Insights | string[];
  summary?: string;
  data_source?: 'apify' | 'mock' | 'unknown';
  ai_provider?: string;
  metadata?: AnalysisMetadata;
  bot_detection?: BotDetectionStats;  // NEW
  models_used?: any;
  error?: string;
  error_type?: string;
}
```

**Status**: ✅ **SYNCED** - Bot detection stats added

---

## ✅ Bot Detection Stats Interface

### Backend Returns (NEW)
```python
{
    "total_reviews": int,
    "genuine_count": int,
    "bot_count": int,
    "bot_percentage": float,
    "suspicious_count": int,
    "filtered_count": int,
}
```

### Frontend Expects (NEW)
```typescript
interface BotDetectionStats {
  total_reviews: number;
  genuine_count: number;
  bot_count: number;
  bot_percentage: number;
  suspicious_count?: number;
  filtered_count?: number;
}
```

**Status**: ✅ **SYNCED**

---

## ✅ Rating Distribution Interface

### Backend Returns (Supports Both Formats)
```python
{
    "5": int,
    "4": int,
    "3": int,
    "2": int,
    "1": int,
}
# OR
{
    "5_star": int,
    "4_star": int,
    "3_star": int,
    "2_star": int,
    "1_star": int,
}
```

### Frontend Expects (Supports Both)
```typescript
interface RatingDistribution {
  '5_star'?: number;
  '4_star'?: number;
  '3_star'?: number;
  '2_star'?: number;
  '1_star'?: number;
  '5'?: number;  // Backwards compatibility
  '4'?: number;
  '3'?: number;
  '2'?: number;
  '1'?: number;
}
```

**Status**: ✅ **SYNCED** - Supports both formats

---

## ✅ Sentiment Distribution Interface

### Backend Returns
```python
{
    "positive": int,
    "neutral": int,
    "negative": int,
}
```

### Frontend Expects
```typescript
interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}
```

**Status**: ✅ **SYNCED**

---

## ✅ Keyword Interface

### Backend Returns
```python
{
    "word": str,
    "frequency": int,
    "weight": float,  # Optional
}
```

### Frontend Expects
```typescript
interface Keyword {
  word: string;
  frequency: number;
  weight?: number;
}
```

**Status**: ✅ **SYNCED**

---

## ✅ Theme Interface

### Backend Returns
```python
{
    "theme": str,
    "keywords": list[str],  # Optional
    "mentions": int,
    "importance": float,    # Optional
    "sentiment": str,       # Optional
}
```

### Frontend Expects
```typescript
interface Theme {
  theme: string;
  keywords?: string[];
  mentions: number;
  importance?: number;
  sentiment?: string;
}
```

**Status**: ✅ **SYNCED**

---

## 🔍 Validation Commands

### Run Property Validation Script
```bash
python scripts/validate-properties.py
```

### TypeScript Type Check
```bash
cd frontend
npm run type-check
```

### Python Import Check
```bash
cd backend
python -c "from main import app"
```

---

## 🛠️ Maintenance

### Adding New Properties

**When adding a new property to backend:**

1. Add to Python response dict
2. Add to TypeScript interface
3. Mark as optional (`?`) if not always present
4. Update this checklist
5. Run validation script

**Example:**

Backend:
```python
review = {
    "id": "123",
    "new_property": "value",  # NEW
}
```

Frontend:
```typescript
interface Review {
  id: string;
  new_property?: string;  // NEW
}
```

### Removing Properties

1. Mark as deprecated in code comments
2. Keep in types for backward compatibility (as optional)
3. Remove after ensuring no usage
4. Update this checklist

---

## 📋 Common Property Aliases

Some properties have aliases for backward compatibility:

| Backend Property | Frontend Alias | Notes |
|-----------------|----------------|-------|
| `text` | `content` | Both supported |
| `verified` | `verified_purchase` | Both supported |
| `5` | `5_star` | Rating distribution |

---

## ✅ Deployment Checklist

Before deploying:

- [ ] Run `python scripts/validate-properties.py`
- [ ] Run `cd frontend && npm run type-check`
- [ ] Run `cd backend && python -c "from main import app"`
- [ ] Check that all new properties are documented
- [ ] Update this checklist if properties changed
- [ ] Test locally with real data
- [ ] Verify exports include new properties

---

## 🎯 Zero-Error Guarantee

Following this checklist ensures:

✅ No TypeScript errors related to missing properties
✅ No runtime errors from undefined properties
✅ Full compatibility between backend and frontend
✅ Smooth deployments on Vercel and Render
✅ Proper export functionality (PDF/CSV)

---

Last Updated: 2025-11-07
Backend Version: 2.0.0
Frontend Version: 2.0.0
