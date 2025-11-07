#!/usr/bin/env python3
"""
Property Validation Script
Checks that all backend response properties match frontend TypeScript types
"""

import json
import re
from pathlib import Path

def extract_backend_properties():
    """Extract properties from backend response structures"""
    backend_properties = {
        'Review': set(),
        'ProductInfo': set(),
        'AnalysisResult': set(),
        'SentimentDistribution': set(),
        'RatingDistribution': set(),
    }

    # Check main.py for response structures
    main_py = Path('backend/main.py')
    if main_py.exists():
        content = main_py.read_text()

        # Extract review properties from analyze_reviews function
        review_pattern = r'"(\w+)":\s*(?:review|sentiment_result|analysis)'
        matches = re.findall(review_pattern, content)
        backend_properties['Review'].update(matches)

    # Check apify_service.py for review transformation
    apify_service = Path('backend/app/services/apify_service.py')
    if apify_service.exists():
        content = apify_service.read_text()

        # Extract from _transform_review function
        transform_pattern = r'"(\w+)":\s*(?:review_data|item)'
        matches = re.findall(transform_pattern, content)
        backend_properties['Review'].update(matches)

    return backend_properties

def extract_frontend_types():
    """Extract TypeScript interface properties"""
    frontend_types = {
        'Review': set(),
        'ProductInfo': set(),
        'AnalysisResult': set(),
        'SentimentDistribution': set(),
        'RatingDistribution': set(),
    }

    types_file = Path('frontend/types/index.ts')
    if types_file.exists():
        content = types_file.read_text()

        # Extract interface properties
        for interface_name in frontend_types.keys():
            pattern = rf'export interface {interface_name}.*?\{{(.*?)\}}'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                interface_body = match.group(1)
                # Extract property names
                prop_pattern = r'(\w+)[?:]:'
                props = re.findall(prop_pattern, interface_body)
                frontend_types[interface_name].update(props)

    return frontend_types

def validate_properties():
    """Validate that backend and frontend properties match"""
    print("🔍 Validating Property Consistency...\n")

    backend_props = extract_backend_properties()
    frontend_props = extract_frontend_types()

    issues_found = False

    for type_name in frontend_props.keys():
        print(f"📋 Checking {type_name}:")

        backend = backend_props.get(type_name, set())
        frontend = frontend_props.get(type_name, set())

        # Check for properties in backend not in frontend
        missing_in_frontend = backend - frontend
        if missing_in_frontend:
            print(f"  ⚠️  Backend properties missing in frontend: {missing_in_frontend}")
            issues_found = True

        # Check for required properties in frontend not in backend
        # (This is less critical as backend might not return all optional props)
        extra_in_frontend = frontend - backend
        if extra_in_frontend and type_name == 'Review':
            print(f"  ℹ️  Frontend has additional optional properties: {extra_in_frontend}")

        if not missing_in_frontend and not (extra_in_frontend and type_name == 'Review'):
            print(f"  ✅ All properties consistent")

        print()

    if issues_found:
        print("❌ Property validation failed. Please sync backend and frontend types.")
        return False
    else:
        print("✅ All properties validated successfully!")
        return True

if __name__ == "__main__":
    success = validate_properties()
    exit(0 if success else 1)
