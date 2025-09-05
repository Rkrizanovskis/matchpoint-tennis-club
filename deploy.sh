#!/bin/bash

# Matchpoint Tennis Club - Production Deployment Script
# ======================================================

echo "🎾 Matchpoint Tennis Club - Production Deployment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean up test files
echo -e "\n${YELLOW}Step 1: Cleaning up test files...${NC}"
test_files=(
    "test-*.html"
    "debug-*.html"
    "*-test.html"
    "clear-cache.html"
    "minimal-test.html"
    "simple-test.html"
    "confetti-demo.html"
    "grid-preview.html"
)

for pattern in "${test_files[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "  Removing: $file"
            rm "$file"
        fi
    done
done

# Step 2: Check critical files
echo -e "\n${YELLOW}Step 2: Verifying critical files...${NC}"
critical_files=(
    "index.html"
    "styles.css"
    "script-firebase.js"
    "firebase-config.js"
    "modal-styles.css"
    "booking-loading.css"
    "club-wall-styles.css"
    "main-club-wall-styles.css"
    "instructor-styles.css"
    "loading-styles.css"
)

all_present=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        all_present=false
    fi
done

if [ "$all_present" = false ]; then
    echo -e "${RED}Some critical files are missing! Aborting deployment.${NC}"
    exit 1
fi

# Step 3: Add all changes to git
echo -e "\n${YELLOW}Step 3: Adding changes to git...${NC}"
git add -A

# Step 4: Commit changes
echo -e "\n${YELLOW}Step 4: Committing changes...${NC}"
commit_message="Production deployment: Monday/Wednesday unavailable days implementation

- Added unavailable status for Monday and Wednesday
- Fixed text color issues on login screen
- Enhanced loading screen styling
- Improved visual distinction for unavailable days
- Fixed JavaScript errors and localStorage handling"

git commit -m "$commit_message"

# Step 5: Push to GitHub
echo -e "\n${YELLOW}Step 5: Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "Your site will be available at: https://matchpoint.lv"
    echo -e "GitHub Pages may take 2-10 minutes to update."
    echo -e "\nDirect GitHub Pages URL: https://rkrizanovskis.github.io/matchpoint-tennis-club/"
else
    echo -e "\n${RED}❌ Push failed! Please check your git configuration.${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎾 Deployment complete!${NC}"