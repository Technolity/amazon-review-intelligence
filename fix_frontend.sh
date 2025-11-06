#!/bin/bash

echo "🚀 Complete Frontend Reset..."

cd /home/walorex/Desktop/Amazon_review_intelligence

# Remove everything and start fresh
rm -rf frontend
mkdir frontend
cd frontend

echo "📦 Creating package.json..."
cat > package.json << 'EOL'
{
  "name": "amazon-review-intelligence-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "1.5.0",
    "recharts": "2.8.0",
    "d3": "7.8.5",
    "lucide-react": "0.292.0",
    "class-variance-authority": "0.7.0",
    "clsx": "2.0.0",
    "tailwind-merge": "2.0.0"
  },
  "devDependencies": {
    "typescript": "5.2.0",
    "@types/node": "20.8.0",
    "@types/react": "18.2.0",
    "@types/d3": "7.4.3",
    "tailwindcss": "3.3.0",
    "autoprefixer": "10.4.16",
    "postcss": "8.4.31"
  }
}
EOL

echo "📥 Installing dependencies..."
npm install

echo "✅ Setup complete! Now run: npm run dev"