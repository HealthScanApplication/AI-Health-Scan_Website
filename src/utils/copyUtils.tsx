"use client";

import { toast } from 'sonner';

interface CopyOptions {
  successMessage?: string;
  errorMessage?: string;
  showManualCopy?: boolean;
  timeout?: number;
}

/**
 * Simple and reliable copy to clipboard function
 */
export async function copyToClipboard(
  text: string, 
  options: CopyOptions = {}
): Promise<boolean> {
  const {
    successMessage = '✅ Copied to clipboard!',
    errorMessage = 'Copy failed - please copy manually',
    showManualCopy = true,
    timeout = 3000
  } = options;

  console.log(`📋 Copying text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

  // Method 1: Try modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      
      console.log('✅ Clipboard API success');
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.log('⚠️ Clipboard API failed, trying fallback');
    }
  }

  // Method 2: Try legacy execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      padding: 0;
      border: none;
      outline: none;
      background: transparent;
      opacity: 0;
      pointer-events: none;
    `;
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand && document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (success) {
      console.log('✅ Legacy copy success');
      toast.success(successMessage);
      return true;
    }
  } catch (error) {
    console.log('⚠️ Legacy copy failed');
  }

  // Method 3: Manual copy fallback
  if (showManualCopy) {
    showManualCopyModal(text);
    return true;
  } else {
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Simple manual copy modal
 */
function showManualCopyModal(text: string): void {
  // Remove any existing modal
  const existing = document.querySelector('.copy-modal');
  if (existing) {
    document.body.removeChild(existing);
  }

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'copy-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">
        Copy Your Message
      </h3>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Select and copy the text below
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <div 
        id="copy-text"
        style="
          width: 100%; 
          min-height: 100px; 
          padding: 16px; 
          border: 2px solid #16a34a; 
          border-radius: 8px; 
          font-size: 14px; 
          background: #f0fdf4; 
          color: #111827;
          word-break: break-all;
          cursor: text;
          user-select: all;
        "
        tabindex="0"
      >${text}</div>
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button 
        id="select-btn"
        style="
          padding: 10px 20px; 
          background: #3b82f6; 
          border: none; 
          border-radius: 6px; 
          font-size: 14px; 
          font-weight: 500; 
          color: white; 
          cursor: pointer;
        "
      >Select Text</button>
      <button 
        id="done-btn"
        style="
          padding: 10px 20px; 
          background: #16a34a; 
          border: none; 
          border-radius: 6px; 
          font-size: 14px; 
          font-weight: 500; 
          color: white; 
          cursor: pointer;
        "
      >Done</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Event handlers
  const textDiv = content.querySelector('#copy-text') as HTMLDivElement;
  const selectBtn = content.querySelector('#select-btn') as HTMLButtonElement;
  const doneBtn = content.querySelector('#done-btn') as HTMLButtonElement;

  const closeModal = () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };

  // Select text functionality
  selectBtn.addEventListener('click', () => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textDiv);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      selectBtn.textContent = 'Selected!';
      selectBtn.style.background = '#059669';
      
      setTimeout(() => {
        selectBtn.textContent = 'Select Text';
        selectBtn.style.background = '#3b82f6';
      }, 1500);
      
      toast.success('✅ Text selected! Press Ctrl+C (or Cmd+C) to copy');
    } catch (error) {
      textDiv.focus();
      toast.info('💡 Click the text above, then select all and copy');
    }
  });

  // Auto-select on text click
  textDiv.addEventListener('click', () => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textDiv);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch (error) {
      console.log('Auto-select failed');
    }
  });

  // Close handlers
  doneBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handleEscape);
      closeModal();
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Focus the text
  setTimeout(() => textDiv.focus(), 100);
}

/**
 * Copy referral link with specific messaging
 */
export async function copyReferralLink(
  referralCode: string,
  baseUrl: string = window.location.origin,
  onCopy?: () => void
): Promise<boolean> {
  const referralLink = `${baseUrl}/${referralCode}`;
  
  const result = await copyToClipboard(referralLink, {
    successMessage: '🎉 Referral link copied! Share it to earn rewards.',
    errorMessage: 'Unable to copy referral link automatically',
    showManualCopy: true,
    timeout: 2000
  });
  
  if (result && onCopy) {
    onCopy();
  }
  
  return result;
}

/**
 * Simple text copy
 */
export async function copyText(text: string): Promise<boolean> {
  return await copyToClipboard(text, {
    successMessage: '✅ Copied!',
    showManualCopy: true,
    timeout: 2000
  });
}

/**
 * Check if copy is supported
 */
export function isCopySupported(): boolean {
  return !!(
    (navigator.clipboard && window.isSecureContext) ||
    (document.execCommand && document.queryCommandSupported?.('copy'))
  );
}

/**
 * Initialize clipboard error handling (simplified stub for compatibility)
 */
export function initializeClipboardErrorHandling(): void {
  // Simplified version - no complex error handling needed
  // This is a compatibility stub for existing code
  console.log('📋 Clipboard error handling initialized (simplified)');
}