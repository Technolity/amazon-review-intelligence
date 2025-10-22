"""
Fix Import Errors - Python Script
Automatically fixes 'from backend.app' to 'from app' in all Python files
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(filepath):
    """Fix imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace backend.app imports with app imports
        content = re.sub(r'from backend\.app\.', 'from app.', content)
        content = re.sub(r'import backend\.app\.', 'import app.', content)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")
        return False

def find_and_fix_imports(directory):
    """Find and fix all Python files in directory."""
    fixed_files = []
    
    backend_dir = Path(directory) / 'backend'
    
    if not backend_dir.exists():
        print(f"❌ Directory not found: {backend_dir}")
        return fixed_files
    
    # Walk through all Python files
    for py_file in backend_dir.rglob('*.py'):
        # Skip venv directory
        if 'venv' in py_file.parts or '.venv' in py_file.parts:
            continue
        
        if fix_imports_in_file(py_file):
            fixed_files.append(py_file)
    
    return fixed_files

def main():
    print("🔧 Python Import Fixer")
    print("=" * 50)
    print()
    
    # Get current directory
    current_dir = Path.cwd()
    print(f"📍 Working directory: {current_dir}")
    print()
    
    # Check if we're in the right place
    if not (current_dir / 'backend').exists():
        print("❌ Error: backend/ directory not found")
        print("Please run this script from your project root")
        return
    
    print("🔍 Scanning for files with incorrect imports...")
    print()
    
    # Fix imports
    fixed_files = find_and_fix_imports(current_dir)
    
    if fixed_files:
        print(f"✅ Fixed imports in {len(fixed_files)} file(s):")
        print()
        for file in fixed_files:
            print(f"  ✅ {file.relative_to(current_dir)}")
    else:
        print("✅ No files needed fixing (or already fixed!)")
    
    print()
    print("=" * 50)
    print("✅ Done!")
    print()
    print("📝 Next steps:")
    print()
    print("1. Activate venv:")
    print("   cd backend")
    
    # Platform-specific instructions
    if os.name == 'nt':  # Windows
        print("   .\\venv\\Scripts\\activate")
    else:  # macOS/Linux
        print("   source venv/bin/activate")
    
    print()
    print("2. Run server:")
    print("   uvicorn app.main:app --reload")
    print()
    print("3. Test:")
    print("   http://localhost:8000/health")
    print()

if __name__ == '__main__':
    main()