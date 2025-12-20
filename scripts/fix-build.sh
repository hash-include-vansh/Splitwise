#!/bin/bash
# Script to fix Next.js build cache issues
echo "Clearing Next.js build cache..."
rm -rf .next
echo "Rebuilding..."
npm run build
echo "Build complete! You can now run 'npm run dev'"

