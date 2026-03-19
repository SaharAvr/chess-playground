#!/bin/bash

# Best Move Trainer - Local Android Launcher
# This script ensures Java 21+ is found and launches the app on your emulator.

# Try to find OpenJDK 21 installed via Homebrew (Capacitor 8+ requirement)
BREW_JAVA="/opt/homebrew/opt/openjdk@21"
if [ ! -d "$BREW_JAVA" ]; then
  BREW_JAVA="/usr/local/opt/openjdk@21"
fi

# Fallback to OpenJDK 17 if 21 isn't found (though build might fail if project requires 21)
if [ ! -d "$BREW_JAVA" ]; then
    BREW_JAVA="/opt/homebrew/opt/openjdk@17"
    if [ ! -d "$BREW_JAVA" ]; then
        BREW_JAVA="/usr/local/opt/openjdk@17"
    fi
fi

if [ -d "$BREW_JAVA" ]; then
  echo "☕ Using Java from: $BREW_JAVA"
  # Set JAVA_HOME for the current session to avoid system-wide linkage issues
  export JAVA_HOME="$BREW_JAVA"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "🚀 Building web assets..."
VITE_APP_PLATFORM=android yarn build

echo "🔄 Syncing with Capacitor..."
npx cap sync android

echo "📱 Launching on Android..."
# This will prompt you to select a device if multiple are running
npx cap run android
