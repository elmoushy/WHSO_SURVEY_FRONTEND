/**
 * TypeScript declarations for Amiri font module
 */

import { jsPDF } from 'jspdf';

/**
 * Adds the Amiri font to a jsPDF instance
 * @param doc - The jsPDF document instance
 */
export function addAmiriFont(doc: jsPDF): void;

/**
 * Base64-encoded font data
 */
declare const font: string;
export default font;
