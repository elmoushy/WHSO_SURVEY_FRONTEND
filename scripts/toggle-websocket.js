#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the .env file
const envPath = path.join(__dirname, '..', '.env');

// Read the current .env file
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

// Check current WebSocket status
const isCurrentlyEnabled = envContent.includes('VITE_WEBSOCKET_ENABLED=true');

if (process.argv.includes('--status')) {
  console.log(`WebSocket is currently: ${isCurrentlyEnabled ? 'ENABLED' : 'DISABLED'}`);
  process.exit(0);
}

if (process.argv.includes('--enable')) {
  // Enable WebSocket
  envContent = envContent
    .replace('VITE_WEBSOCKET_ENABLED=false', 'VITE_WEBSOCKET_ENABLED=true')
    .replace('# VITE_WS_URL=', 'VITE_WS_URL=');
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ WebSocket ENABLED');
  console.log('ℹ️  Restart your development server for changes to take effect');
  
} else if (process.argv.includes('--disable')) {
  // Disable WebSocket
  envContent = envContent
    .replace('VITE_WEBSOCKET_ENABLED=true', 'VITE_WEBSOCKET_ENABLED=false')
    .replace(/^VITE_WS_URL=/gm, '# VITE_WS_URL=');
  
  fs.writeFileSync(envPath, envContent);
  console.log('❌ WebSocket DISABLED');
  console.log('ℹ️  Restart your development server for changes to take effect');
  
} else {
  // Toggle WebSocket
  if (isCurrentlyEnabled) {
    envContent = envContent
      .replace('VITE_WEBSOCKET_ENABLED=true', 'VITE_WEBSOCKET_ENABLED=false')
      .replace(/^VITE_WS_URL=/gm, '# VITE_WS_URL=');
    console.log('❌ WebSocket DISABLED');
  } else {
    envContent = envContent
      .replace('VITE_WEBSOCKET_ENABLED=false', 'VITE_WEBSOCKET_ENABLED=true')
      .replace('# VITE_WS_URL=', 'VITE_WS_URL=');
    console.log('✅ WebSocket ENABLED');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('ℹ️  Restart your development server for changes to take effect');
}
