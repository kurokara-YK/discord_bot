#!/bin/bash

echo "╔══╣ Install: Discord Bot GAS Environment (STARTING) ╠══╗"

# Keep track of the current directory
DIR=`pwd`

# Update package list
echo "Updating apt packages..."
sudo apt update

# Install required Ubuntu packages
echo "Installing required packages..."
sudo apt install -y \
    curl \
    git

# Install Volta if not already installed
if ! command -v volta &> /dev/null; then
    echo "Installing Volta..."
    curl https://get.volta.sh | bash
else
    echo "Volta is already installed."
fi

# Load Volta environment for this script
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

# Check Volta
echo "Checking Volta version..."
volta --version

# Install Node.js and npm
echo "Installing Node.js and npm..."
volta install node

# Check Node.js and npm
echo "Checking Node.js and npm versions..."
node --version
npm --version

# Install clasp
echo "Installing clasp..."
npm install -g @google/clasp

# Check clasp
echo "Checking clasp version..."
clasp --version

echo ""
echo "Google Apps Script APIを有効にする場合は，以下のURLをブラウザに貼ってください。"
echo "https://script.google.com/home/usersettings"

echo ""
echo "Googleアカウント認証用のURLを取得します。"
echo ""

# Create temporary log file
TMP_LOG=$(mktemp)

# Run clasp login in background and save output
clasp login 2>&1 | tee "$TMP_LOG" &
CLASP_PID=$!

# Wait until authorization URL appears
for i in {1..30}; do
    AUTH_URL=$(grep -o 'https://accounts.google.com[^ ]*' "$TMP_LOG" | head -n 1)

    if [ -n "$AUTH_URL" ]; then
        echo ""
        echo "以下のURLをブラウザに貼ってください。"
        echo ""
        echo "$AUTH_URL"
        echo ""

        # Stop clasp login so install.sh does not keep waiting
        kill $CLASP_PID >/dev/null 2>&1
        break
    fi

    sleep 1
done

# Remove temporary log file
rm -f "$TMP_LOG"

# Go back to previous directory
cd ${DIR}

# Reload shell configuration
echo "Reloading ~/.bashrc..."
source ~/.bashrc

echo "╚══╣ Install: Discord Bot GAS Environment (FINISHED) ╠══╝"