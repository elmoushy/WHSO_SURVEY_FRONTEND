/**
 * Font Conversion Script for jsPDF
 * This script converts TTF font files to a jsPDF-compatible JavaScript file
 * Supports both regular and bold variants of Amiri font
 * 
 * Usage: node scripts/convert-font.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regularFontPath = path.join(__dirname, '../public/fonts/Amiri-Regular.ttf');
const boldFontPath = path.join(__dirname, '../public/fonts/Amiri-Bold.ttf');
const outputPath = path.join(__dirname, '../src/lib/fonts/Amiri-normal.js');

try {
  // Read the font files
  const regularFontData = fs.readFileSync(regularFontPath);
  const boldFontData = fs.readFileSync(boldFontPath);
  
  // Convert to base64
  const base64Regular = regularFontData.toString('base64');
  const base64Bold = boldFontData.toString('base64');
  
  // Create the JavaScript file content
  const jsContent = `/**
 * Amiri Font for jsPDF
 * Auto-generated from Amiri-Regular.ttf and Amiri-Bold.ttf
 * Includes both regular and bold variants for Arabic text support
 */

import { jsPDF } from 'jspdf';

// Amiri Regular font (base64 encoded)
const fontRegular = '${base64Regular}';

// Amiri Bold font (base64 encoded)
const fontBold = '${base64Bold}';

/**
 * Add Amiri font (regular and bold) to jsPDF instance
 * This enables proper Arabic text rendering in PDF exports
 * @param {jsPDF} doc - The jsPDF document instance
 */
export const addAmiriFont = (doc) => {
  // Add regular variant
  doc.addFileToVFS('Amiri-Regular.ttf', fontRegular);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  
  // Add bold variant
  doc.addFileToVFS('Amiri-Bold.ttf', fontBold);
  doc.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');
};

export default { regular: fontRegular, bold: fontBold };
`;

  // Write the JavaScript file
  fs.writeFileSync(outputPath, jsContent, 'utf8');
  
  console.log('✅ Font conversion successful!');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Regular font size: ${(base64Regular.length / 1024).toFixed(2)} KB (base64)`);
  console.log(`📊 Bold font size: ${(base64Bold.length / 1024).toFixed(2)} KB (base64)`);
  console.log(`📊 Total size: ${((base64Regular.length + base64Bold.length) / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Error converting font:', error.message);
  process.exit(1);
}
