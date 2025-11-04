/**
 * Type declarations for arabic-persian-reshaper
 * @see https://github.com/louy/arabic-persian-reshaper
 */

declare module 'arabic-persian-reshaper' {
  /**
   * Reshapes Arabic/Persian text for proper display in systems that don't support contextual shaping.
   * Converts letters to their proper isolated, initial, medial, or final forms.
   * 
   * @param text - The Arabic or Persian text to reshape
   * @returns The reshaped text with proper letter forms
   * 
   * @example
   * ```typescript
   * import { reshape } from 'arabic-persian-reshaper';
   * 
   * const original = 'مرحبا';
   * const shaped = reshape(original);
   * console.log(shaped); // Properly shaped Arabic text
   * ```
   */
  export function reshape(text: string): string;
  
  /**
   * Default export (same as reshape function)
   */
  export default function reshape(text: string): string;
}
