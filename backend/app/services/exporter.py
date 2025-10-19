"""
Export service for generating CSV and PDF reports.
"""

import os
import pandas as pd
from typing import Dict, Any
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings
from app.utils.helpers import format_timestamp


class Exporter:
    """Export analysis results to various formats."""
    
    def __init__(self):
        self.export_folder = settings.EXPORT_FOLDER
        os.makedirs(self.export_folder, exist_ok=True)
    
    def export_to_csv(
        self, 
        analysis_data: Dict[str, Any],
        reviews: list = None
    ) -> Dict[str, Any]:
        """
        Export analysis results to CSV.
        
        Args:
            analysis_data: Analysis results
            reviews: Optional raw reviews data
        
        Returns:
            Export result with file path
        """
        try:
            asin = analysis_data.get('asin', 'unknown')
            timestamp = format_timestamp()
            filename = f"analysis_{asin}_{timestamp}.csv"
            filepath = os.path.join(self.export_folder, filename)
            
            # Create summary DataFrame
            summary_data = {
                'Metric': [],
                'Value': []
            }
            
            # Add basic info
            summary_data['Metric'].append('ASIN')
            summary_data['Value'].append(asin)
            
            summary_data['Metric'].append('Product Title')
            summary_data['Value'].append(analysis_data.get('product_title', 'N/A'))
            
            summary_data['Metric'].append('Total Reviews')
            summary_data['Value'].append(analysis_data.get('total_reviews', 0))
            
            # Sentiment data
            sentiment = analysis_data.get('sentiment_distribution', {})
            summary_data['Metric'].append('Average Rating')
            summary_data['Value'].append(sentiment.get('average_rating', 0))
            
            summary_data['Metric'].append('Positive Reviews (%)')
            summary_data['Value'].append(sentiment.get('positive', {}).get('percentage', 0))
            
            summary_data['Metric'].append('Neutral Reviews (%)')
            summary_data['Value'].append(sentiment.get('neutral', {}).get('percentage', 0))
            
            summary_data['Metric'].append('Negative Reviews (%)')
            summary_data['Value'].append(sentiment.get('negative', {}).get('percentage', 0))
            
            # Create DataFrame
            df_summary = pd.DataFrame(summary_data)
            
            # Add keywords sheet
            keywords = analysis_data.get('keyword_analysis', {}).get('top_keywords', [])
            df_keywords = pd.DataFrame(keywords)
            
            # Write to Excel with multiple sheets
            with pd.ExcelWriter(filepath.replace('.csv', '.xlsx'), engine='openpyxl') as writer:
                df_summary.to_excel(writer, sheet_name='Summary', index=False)
                if not df_keywords.empty:
                    df_keywords.to_excel(writer, sheet_name='Keywords', index=False)
                
                # Add raw reviews if provided
                if reviews:
                    df_reviews = pd.DataFrame(reviews)
                    df_reviews.to_excel(writer, sheet_name='Raw Reviews', index=False)
            
            # Also create simple CSV
            df_summary.to_csv(filepath, index=False)
            
            file_size = os.path.getsize(filepath)
            
            return {
                "success": True,
                "file_path": filepath,
                "file_size": file_size,
                "format": "csv",
                "download_url": f"/exports/{filename}"
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"CSV export failed: {str(e)}"
            }
    
    def export_to_pdf(
        self, 
        analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Export analysis results to PDF.
        
        Args:
            analysis_data: Analysis results
        
        Returns:
            Export result with file path
        """
        try:
            asin = analysis_data.get('asin', 'unknown')
            timestamp = format_timestamp()
            filename = f"report_{asin}_{timestamp}.pdf"
            filepath = os.path.join(self.export_folder, filename)
            
            # Create PDF
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1f2937'),
                spaceAfter=30,
            )
            title = Paragraph("Amazon Review Analysis Report", title_style)
            story.append(title)
            story.append(Spacer(1, 0.2*inch))
            
            # Product Info
            product_title = analysis_data.get('product_title', 'N/A')
            product_info = Paragraph(
                f"<b>Product:</b> {product_title}<br/>"
                f"<b>ASIN:</b> {asin}<br/>"
                f"<b>Analyzed:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}<br/>"
                f"<b>Total Reviews:</b> {analysis_data.get('total_reviews', 0)}",
                styles['Normal']
            )
            story.append(product_info)
            story.append(Spacer(1, 0.3*inch))
            
            # Summary
            summary_title = Paragraph("<b>Executive Summary</b>", styles['Heading2'])
            story.append(summary_title)
            summary_text = Paragraph(analysis_data.get('summary', 'N/A'), styles['Normal'])
            story.append(summary_text)
            story.append(Spacer(1, 0.3*inch))
            
            # Sentiment Distribution
            sentiment_title = Paragraph("<b>Sentiment Distribution</b>", styles['Heading2'])
            story.append(sentiment_title)
            
            sentiment = analysis_data.get('sentiment_distribution', {})
            sentiment_data = [
                ['Metric', 'Value'],
                ['Average Rating', f"{sentiment.get('average_rating', 0)} ⭐"],
                ['Positive Reviews', f"{sentiment.get('positive', {}).get('percentage', 0)}%"],
                ['Neutral Reviews', f"{sentiment.get('neutral', {}).get('percentage', 0)}%"],
                ['Negative Reviews', f"{sentiment.get('negative', {}).get('percentage', 0)}%"],
            ]
            
            sentiment_table = Table(sentiment_data, colWidths=[3*inch, 2*inch])
            sentiment_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(sentiment_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Top Keywords
            keywords_title = Paragraph("<b>Top Keywords</b>", styles['Heading2'])
            story.append(keywords_title)
            
            keywords = analysis_data.get('keyword_analysis', {}).get('top_keywords', [])[:10]
            if keywords:
                keyword_data = [['Keyword', 'Frequency', 'Importance']]
                for kw in keywords:
                    keyword_data.append([
                        kw.get('word', ''),
                        str(kw.get('frequency', 0)),
                        kw.get('importance', '')
                    ])
                
                keyword_table = Table(keyword_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
                keyword_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(keyword_table)
            
            story.append(Spacer(1, 0.3*inch))
            
            # Key Insights
            insights_title = Paragraph("<b>Key Insights</b>", styles['Heading2'])
            story.append(insights_title)
            
            insights = analysis_data.get('insights', [])
            for insight in insights:
                bullet = Paragraph(f"• {insight}", styles['Normal'])
                story.append(bullet)
                story.append(Spacer(1, 0.1*inch))
            
            # Build PDF
            doc.build(story)
            
            file_size = os.path.getsize(filepath)
            
            return {
                "success": True,
                "file_path": filepath,
                "file_size": file_size,
                "format": "pdf",
                "download_url": f"/exports/{filename}"
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"PDF export failed: {str(e)}"
            }


# Singleton instance
exporter = Exporter()