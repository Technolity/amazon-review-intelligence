# OpenAI Integration Setup Guide

Complete guide for enabling GPT-powered summaries and insights in your Amazon Review Intelligence app.

---

## 🎯 What OpenAI Adds

With OpenAI integration enabled, you get:

✅ **Professional Executive Summaries** - 3-4 sentence comprehensive product summaries
✅ **Actionable Business Insights** - 5 AI-generated strategic recommendations
✅ **Context-Aware Analysis** - Understanding of customer sentiment patterns
✅ **Competitive Positioning** - Insights on market positioning
✅ **Better Quality** - More coherent and professional than basic NLP

---

## 🆚 With vs Without OpenAI

### Without OpenAI (Free NLP Stack)
```
Summary: "Analyzed 50 reviews. Overall sentiment: Positive"

Insights:
- ⭐ Excellent satisfaction: 78.0% positive reviews
- 🔤 Top keywords: quality, great, price, value, recommend
```

### With OpenAI (GPT-Powered)
```
Summary: "This product demonstrates strong market performance with 78% positive
sentiment across 50 reviews. Customers consistently praise the exceptional build
quality and value proposition, though some note shipping delays. The overwhelming
positive feedback suggests this is a reliable choice for budget-conscious buyers
seeking quality."

Insights:
- 🏆 Premium quality perception drives 78% customer satisfaction and repeat purchases
- 💰 Value-for-money positioning resonates strongly with target demographic
- 📦 Shipping experience improvements could reduce negative sentiment by 15%
- ⭐ 4.6/5 rating places product in top 10% of category competitors
- 🎯 Strong recommendation rate indicates high customer loyalty potential
```

---

## 🔧 Setup Instructions

### 1. Get OpenAI API Key

1. **Sign up** at [OpenAI Platform](https://platform.openai.com/)
2. **Go to** API Keys section
3. **Create** new secret key
4. **Copy** the key (starts with `sk-...`)

**Cost**:
- GPT-3.5-Turbo: ~$0.0015 per 1K tokens (~$0.002 per analysis)
- GPT-4: ~$0.03 per 1K tokens (~$0.04 per analysis)
- Free tier: $5 credit for new accounts

### 2. Configure Backend (Render)

**Add environment variables in Render:**

```bash
# Required
OPENAI_API_KEY=sk-your-actual-key-here

# Optional (defaults shown)
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better quality
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

**Steps:**
1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add the variables above
6. Click "Save Changes"
7. Render will auto-redeploy

### 3. Configure Local Development

**Create/update `.env` file:**

```bash
cd backend
cp .env.example .env
```

**Edit `.env` and add:**
```bash
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Test locally:**
```bash
python -c "from app.services.openai_service import openai_service; print('Available:', openai_service.is_available())"
```

---

## ✅ Verification

### Check Backend Logs

**On startup, you should see:**
```
✅ OpenAI service loaded and configured
```

**If you see:**
```
⚠️ OpenAI service loaded but API key not configured
```
→ API key is missing or invalid

**During analysis:**
```
🤖 Generating AI-powered insights with OpenAI...
✅ OpenAI insights generated
📝 Generating AI-powered summary with OpenAI...
✅ Summary ready
```

### Test API Response

**The response will include:**
```json
{
  "success": true,
  "data": {
    "summary": "Professional AI-generated summary...",
    "insights": [
      "🏆 AI-powered insight 1",
      "💰 AI-powered insight 2",
      "..."
    ],
    "ai_provider": "openai"
  }
}
```

**Check `ai_provider` field:**
- `"openai"` = OpenAI is working ✅
- `"free"` = Using fallback NLP ⚠️

---

## 🔍 Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution:**
1. Check environment variable is set correctly
2. Verify key starts with `sk-`
3. Ensure no extra spaces in the key
4. Restart the service after adding variable

### Issue: "OpenAI insights failed, using fallback"

**Possible causes:**
1. **Invalid API Key** - Get new key from OpenAI
2. **No Credits** - Add billing to OpenAI account
3. **Rate Limit** - Wait or upgrade plan
4. **Network Error** - Check Render network connectivity

**Check Render logs:**
```bash
# Look for error messages like:
❌ OpenAI summary generation failed: <error>
```

### Issue: Still seeing basic summaries

**Debug steps:**
1. Check `ai_provider` in API response
2. Verify Render redeployed after adding key
3. Check backend logs for OpenAI initialization
4. Test API key with curl:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## 💰 Cost Management

### Monitor Usage

**OpenAI Dashboard:**
- Go to [OpenAI Usage](https://platform.openai.com/usage)
- Check daily costs
- Set spending limits

**Typical Costs:**
- 100 analyses/day with GPT-3.5: ~$0.20/day
- 100 analyses/day with GPT-4: ~$4.00/day

### Cost Optimization

**Use GPT-3.5-Turbo (recommended):**
```bash
OPENAI_MODEL=gpt-3.5-turbo  # Cheaper, fast, good quality
```

**For premium quality, use GPT-4:**
```bash
OPENAI_MODEL=gpt-4  # Best quality, 20x more expensive
```

**Set spending limits in OpenAI dashboard:**
1. Go to Settings → Billing
2. Set usage limit (e.g., $10/month)
3. Get email alerts

---

## 🎛️ Configuration Options

### Model Selection

| Model | Quality | Speed | Cost/1K tokens |
|-------|---------|-------|----------------|
| `gpt-3.5-turbo` | Good | Fast | $0.0015 |
| `gpt-4` | Excellent | Slower | $0.03 |
| `gpt-4-turbo` | Excellent | Fast | $0.01 |

**Recommendation**: Start with `gpt-3.5-turbo`, upgrade to `gpt-4` if needed.

### Temperature (Creativity)

```bash
OPENAI_TEMPERATURE=0.7  # Default (balanced)
# 0.0 = Deterministic, factual
# 1.0 = Creative, varied
```

**Recommendation**: Keep at 0.7 for balanced output.

### Max Tokens (Length)

```bash
OPENAI_MAX_TOKENS=500  # Default
# Summary: ~150 tokens
# Insights: ~200 tokens
# Total: ~350 tokens needed
```

**Recommendation**: 500 tokens is sufficient, reduce to 400 to save costs.

---

## 🔄 Switching Between AI Providers

### Use OpenAI (Best Quality)
```bash
OPENAI_API_KEY=sk-your-key
```

### Use Free NLP (No Cost)
```bash
# Remove or comment out OPENAI_API_KEY
# OPENAI_API_KEY=
```

### Hybrid Approach
- Use free NLP for testing
- Use OpenAI for production
- Set different keys for staging/production

---

## 📊 Performance Comparison

### Response Quality

**Free NLP:**
- ✅ Fast (0.5s)
- ✅ No cost
- ⚠️ Basic insights
- ⚠️ Generic summaries

**OpenAI GPT-3.5:**
- ✅ Professional quality
- ✅ Context-aware
- ✅ Fast (1-2s)
- ⚠️ Minimal cost

**OpenAI GPT-4:**
- ✅ Excellent quality
- ✅ Deep analysis
- ⚠️ Slower (3-5s)
- ⚠️ Higher cost

---

## 🎓 Best Practices

### 1. Start Small
- Begin with free tier ($5 credit)
- Test with GPT-3.5-Turbo
- Monitor usage for 1 week
- Scale up if needed

### 2. Set Limits
- Configure spending limits in OpenAI
- Set up usage alerts
- Review costs weekly

### 3. Fallback Strategy
The app automatically falls back to free NLP if:
- OpenAI API is down
- Rate limit exceeded
- API key invalid
- No credits remaining

### 4. Cache Results (Future Enhancement)
- Cache summaries in database
- Reduce duplicate API calls
- Save costs on repeated analyses

---

## 🆘 Support & Resources

**OpenAI Documentation:**
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Pricing](https://openai.com/pricing)

**Common Questions:**
- How much does it cost? ~$0.002 per analysis with GPT-3.5
- Can I use free tier? Yes, $5 credit for new accounts
- What if I exceed limits? App falls back to free NLP
- Can I switch models? Yes, change OPENAI_MODEL env var

---

## ✅ Deployment Checklist

- [ ] OpenAI API key obtained
- [ ] Key added to Render environment variables
- [ ] Render service redeployed
- [ ] Backend logs show "OpenAI service loaded and configured"
- [ ] Test API returns `"ai_provider": "openai"`
- [ ] Summaries are professional and detailed
- [ ] Insights are actionable and specific
- [ ] Spending limits set in OpenAI dashboard
- [ ] Usage monitoring enabled

---

## 🎉 You're All Set!

Your app now uses GPT-powered AI for professional summaries and insights!

**Test it:**
1. Analyze any product
2. Check the summary quality
3. Review the 5 insights
4. Compare with free NLP (disable key to test)

**Next steps:**
- Monitor OpenAI usage
- Adjust model/settings as needed
- Consider caching for cost savings
- Upgrade to GPT-4 for premium quality

Happy analyzing! 🚀
