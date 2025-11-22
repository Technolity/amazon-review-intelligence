"""
Database Models - SQLAlchemy ORM models for all database tables
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Text, ForeignKey, JSON, ARRAY, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """
    User model for authentication and authorization
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    api_key = Column(String(255), unique=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    analysis_results = relationship("AnalysisResult", back_populates="user")
    export_history = relationship("ExportHistory", back_populates="user")
    api_usage = relationship("APIUsage", back_populates="user")
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }


class Product(Base):
    """
    Product model for Amazon products
    """
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asin = Column(String(10), unique=True, nullable=False, index=True)
    title = Column(Text)
    brand = Column(String(255))
    category = Column(String(255))
    price = Column(Float)
    currency = Column(String(3), default="USD")
    image_url = Column(Text)
    average_rating = Column(Float)
    total_reviews = Column(Integer)
    
    # Additional product information
    description = Column(Text)
    features = Column(JSON)  # List of product features
    variants = Column(JSON)  # Product variants (size, color, etc.)
    url = Column(Text)
    
    # Tracking
    first_analyzed = Column(DateTime, default=datetime.utcnow)
    last_analyzed = Column(DateTime)
    analysis_count = Column(Integer, default=0)
    
    # Metadata
    metadata = Column(JSON)  # Store any additional product data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    analysis_results = relationship("AnalysisResult", back_populates="product")
    
    # Indexes
    __table_args__ = (
        Index('idx_product_asin', 'asin'),
        Index('idx_product_brand', 'brand'),
        Index('idx_product_category', 'category'),
    )
    
    def __repr__(self):
        return f"<Product(asin={self.asin}, title={self.title[:50]})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "asin": self.asin,
            "title": self.title,
            "brand": self.brand,
            "category": self.category,
            "price": self.price,
            "currency": self.currency,
            "image_url": self.image_url,
            "average_rating": self.average_rating,
            "total_reviews": self.total_reviews,
            "url": self.url,
            "features": self.features,
            "variants": self.variants,
            "last_analyzed": self.last_analyzed.isoformat() if self.last_analyzed else None
        }


class Review(Base):
    """
    Review model for Amazon product reviews
    """
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String(255))  # Amazon's review ID
    
    # Review content
    rating = Column(Integer, nullable=False)
    title = Column(Text)
    content = Column(Text)  # Review text
    author = Column(String(255))
    author_id = Column(String(255))
    review_date = Column(Date)
    
    # Review metadata
    verified_purchase = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    images = Column(ARRAY(Text))  # URLs of review images
    variant = Column(String(255))  # Product variant reviewed
    location = Column(String(255))  # Reviewer location
    vine_program = Column(Boolean, default=False)
    
    # NLP Analysis results (cached)
    sentiment = Column(String(50))
    sentiment_score = Column(Float)
    sentiment_confidence = Column(Float)
    polarity = Column(Float)
    subjectivity = Column(Float)
    emotions = Column(JSON)  # Emotion scores
    key_phrases = Column(ARRAY(Text))
    
    # Bot detection
    bot_score = Column(Float)
    is_bot_likely = Column(Boolean, default=False)
    bot_indicators = Column(ARRAY(Text))
    
    # Metadata
    source = Column(String(50))  # 'apify', 'manual', etc.
    language = Column(String(10), default="en")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('product_id', 'external_id', name='uix_product_review'),
        Index('idx_review_product_id', 'product_id'),
        Index('idx_review_rating', 'rating'),
        Index('idx_review_date', 'review_date'),
        Index('idx_review_sentiment', 'sentiment'),
    )
    
    def __repr__(self):
        return f"<Review(id={self.id}, rating={self.rating}, product_id={self.product_id})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "external_id": self.external_id,
            "rating": self.rating,
            "title": self.title,
            "text": self.content,
            "author": self.author,
            "date": self.review_date.isoformat() if self.review_date else None,
            "verified": self.verified_purchase,
            "helpful_count": self.helpful_count,
            "sentiment": self.sentiment,
            "sentiment_score": self.sentiment_score,
            "sentiment_confidence": self.sentiment_confidence,
            "polarity": self.polarity,
            "subjectivity": self.subjectivity,
            "emotions": self.emotions,
            "bot_score": self.bot_score,
            "is_bot_likely": self.is_bot_likely,
            "images": self.images,
            "variant": self.variant,
            "source": self.source
        }


class AnalysisResult(Base):
    """
    Analysis results model for storing complete analysis sessions
    """
    __tablename__ = "analysis_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Analysis configuration
    analysis_type = Column(String(50))  # 'full', 'quick', 'custom'
    settings = Column(JSON)  # Analysis settings used
    
    # Aggregate results
    total_reviews_analyzed = Column(Integer)
    sentiment_scores = Column(JSON)  # Detailed sentiment breakdown
    emotion_scores = Column(JSON)  # Aggregate emotion scores
    keywords = Column(JSON)  # Top keywords with scores
    themes = Column(JSON)  # Extracted themes
    insights = Column(ARRAY(Text))  # Generated insights
    summary = Column(Text)  # Executive summary
    
    # Advanced metrics
    readability_score = Column(Float)
    authenticity_score = Column(Float)
    diversity_index = Column(Float)  # Review diversity metric
    controversy_score = Column(Float)  # Measure of opinion polarization
    
    # AI Provider information
    ai_provider = Column(String(50))  # 'openai', 'local', 'hybrid'
    ai_model = Column(String(100))
    processing_time = Column(Float)  # Seconds
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="analysis_results")
    user = relationship("User", back_populates="analysis_results")
    exports = relationship("ExportHistory", back_populates="analysis")
    
    # Indexes
    __table_args__ = (
        Index('idx_analysis_product_id', 'product_id'),
        Index('idx_analysis_user_id', 'user_id'),
        Index('idx_analysis_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, product_id={self.product_id})>"


class ExportHistory(Base):
    """
    Export history model for tracking generated reports
    """
    __tablename__ = "export_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analysis_results.id", ondelete="CASCADE"))
    
    # Export details
    file_type = Column(String(10))  # 'pdf', 'excel', 'csv'
    file_name = Column(String(255))
    file_path = Column(Text)  # S3 URL or local path
    file_size = Column(Integer)  # Bytes
    
    # Export configuration
    template = Column(String(50))  # Template used
    filters = Column(JSON)  # Any filters applied
    custom_options = Column(JSON)  # Custom export options
    
    # Status
    status = Column(String(20), default="completed")  # 'pending', 'processing', 'completed', 'failed'
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime)  # For temporary files
    
    # Relationships
    user = relationship("User", back_populates="export_history")
    analysis = relationship("AnalysisResult", back_populates="exports")
    
    def __repr__(self):
        return f"<ExportHistory(id={self.id}, file_type={self.file_type}, status={self.status})>"


class APIUsage(Base):
    """
    API usage tracking for monitoring and rate limiting
    """
    __tablename__ = "api_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Request details
    endpoint = Column(String(255))
    method = Column(String(10))
    status_code = Column(Integer)
    response_time = Column(Float)  # Milliseconds
    
    # Request metadata
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(Text)
    request_body_size = Column(Integer)
    response_body_size = Column(Integer)
    
    # Error tracking
    error_type = Column(String(100))
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="api_usage")
    
    # Indexes
    __table_args__ = (
        Index('idx_api_usage_user_id', 'user_id'),
        Index('idx_api_usage_endpoint', 'endpoint'),
        Index('idx_api_usage_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<APIUsage(id={self.id}, endpoint={self.endpoint}, status={self.status_code})>"


# Create all tables
def create_tables(engine):
    """
    Create all database tables
    """
    Base.metadata.create_all(bind=engine)


# Drop all tables (use with caution)
def drop_tables(engine):
    """
    Drop all database tables
    """
    Base.metadata.drop_all(bind=engine)