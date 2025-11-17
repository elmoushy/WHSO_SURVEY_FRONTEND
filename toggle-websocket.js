#!/usr/bin/env node

/**
 * Simple script to toggle WebSocket functionality in the application
 * Usage: node toggle-websocket.js [on|off]
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE_PATH = path.join(__dirname, '.env');

function readEnvFile() {
  try {
    return fs.readFileSync(ENV_FILE_PATH, 'utf8');
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    process.exit(1);
  }
}

function writeEnvFile(content) {
  try {
    fs.writeFileSync(ENV_FILE_PATH, content, 'utf8');
  } catch (error) {
    console.error('Error writing .env file:', error.message);
    process.exit(1);
  }
}

function toggleWebSocket(enable) {
  let envContent = readEnvFile();
  
  // Update VITE_WEBSOCKET_ENABLED
  const websocketEnabledRegex = /VITE_WEBSOCKET_ENABLED=.*/;
  const newWebsocketValue = `VITE_WEBSOCKET_ENABLED=${enable}`;
  
  if (websocketEnabledRegex.test(envContent)) {
    envContent = envContent.replace(websocketEnabledRegex, newWebsocketValue);
  } else {
    // Add the line if it doesn't exist
    const notificationConfigIndex = envContent.indexOf('# Notification Configuration');
    if (notificationConfigIndex !== -1) {
      const insertIndex = envContent.indexOf('\n', notificationConfigIndex) + 1;
      envContent = envContent.slice(0, insertIndex) + newWebsocketValue + '\n' + envContent.slice(insertIndex);
    } else {
      envContent += '\n' + newWebsocketValue + '\n';
    }
  }
  
  // Handle WebSocket URL commenting/uncommenting
  if (enable) {
    // Uncomment WebSocket URLs
    envContent = envContent.replace(/# (VITE_WS_URL=.*)/g, '$1');
  } else {
    // Comment out WebSocket URLs
    envContent = envContent.replace(/^(VITE_WS_URL=.*)/gm, '# $1');
  }
  
  writeEnvFile(envContent);
  
  console.log(`✅ WebSocket functionality ${enable ? 'ENABLED' : 'DISABLED'}`);
  console.log('📝 Updated .env file');
  console.log('🔄 Please restart your development server to apply changes');
}

function showUsage() {
  console.log('Usage: node toggle-websocket.js [on|off]');
  console.log('');
  console.log('Examples:');
  console.log('  node toggle-websocket.js on   # Enable WebSocket');
  console.log('  node toggle-websocket.js off  # Disable WebSocket');
}

function getCurrentStatus() {
  const envContent = readEnvFile();
  const websocketEnabledMatch = envContent.match(/VITE_WEBSOCKET_ENABLED=(true|false)/);
  
  if (websocketEnabledMatch) {
    const isEnabled = websocketEnabledMatch[1] === 'true';
    console.log(`Current WebSocket status: ${isEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    return isEnabled;
  } else {
    console.log('Current WebSocket status: ⚠️  UNKNOWN (VITE_WEBSOCKET_ENABLED not found)');
    return null;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  getCurrentStatus();
  console.log('');
  showUsage();
  process.exit(0);
}

const action = args[0].toLowerCase();

switch (action) {
  case 'on':
  case 'enable':
  case 'true':
    toggleWebSocket(true);
    break;
  case 'off':
  case 'disable':
  case 'false':
    toggleWebSocket(false);
    break;
  case 'status':
    getCurrentStatus();
    break;
  default:
    console.error('❌ Invalid argument:', action);
    showUsage();
    process.exit(1);
}
