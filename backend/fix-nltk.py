"""
Download all required NLTK data for the application
Run this script once to fix NLTK errors
"""

import nltk
import ssl

# Handle SSL certificate issues
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

print("📥 Downloading NLTK data packages...")
print("This may take a minute...")
print("")

# Download all required packages
packages = [
    'punkt',
    'punkt_tab',
    'stopwords',
    'averaged_perceptron_tagger',
    'averaged_perceptron_tagger_eng',
    'wordnet',
    'omw-1.4'
]

for package in packages:
    try:
        print(f"⏳ Downloading {package}...", end=" ")
        nltk.download(package, quiet=True)
        print("✅")
    except Exception as e:
        print(f"❌ Error: {e}")

print("")
print("🎉 NLTK data download complete!")
print("")
print("Now restart your backend:")
print("  python main.py")