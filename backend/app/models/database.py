# Add connection pooling in app/database.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Add indexes to frequently queried columns
# In your migration file:
"""
CREATE INDEX idx_reviews_asin ON reviews(asin);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_analysis_asin ON analysis(asin);
"""