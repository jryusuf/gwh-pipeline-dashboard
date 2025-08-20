"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

// Clean up browser extension attributes immediately when module loads
// This runs before React hydration to prevent hydration mismatches
if (typeof window !== 'undefined') {
  try {
    // Remove common browser extension attributes that cause hydration issues
    const attributesToRemove = [
      '__processed_',
      'bis_register',
      'data-extension-installed',
      'data-extension-id',
      'data-browser-extension'
    ];
    
    // Clean up attributes from the document and body
    const elementsToClean = [document.documentElement, document.body];
    
    elementsToClean.forEach(element => {
      if (element) {
        // Remove attributes that start with the problematic prefixes
        const attributes = Array.from(element.attributes);
        attributes.forEach(attr => {
          if (attributesToRemove.some(prefix => attr.name.startsWith(prefix))) {
            console.log('Removing browser extension attribute:', attr.name);
            element.removeAttribute(attr.name);
          }
        });
      }
    });
    
    // Also clean up any elements that might have these attributes
    attributesToRemove.forEach(prefix => {
      const elements = document.querySelectorAll(`[class*="${prefix}"], [id*="${prefix}"]`);
      elements.forEach(el => {
        // Remove classes containing the prefix
        const classList = Array.from(el.classList);
        classList.forEach(className => {
          if (className.includes(prefix)) {
            el.classList.remove(className);
          }
        });
        
        // Remove attributes containing the prefix
        const attributes = Array.from(el.attributes);
        attributes.forEach(attr => {
          if (attr.name.includes(prefix) || (attr.value && attr.value.includes(prefix))) {
            el.removeAttribute(attr.name);
          }
        });
      });
    });
  } catch (error) {
    console.warn('Error during browser extension cleanup:', error);
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Additional cleanup in useEffect for any attributes that might be added later
  useEffect(() => {
    const cleanupExtensionAttributes = () => {
      // Remove common browser extension attributes that cause hydration issues
      const attributesToRemove = [
        '__processed_',
        'bis_register',
        'data-extension-installed',
        'data-extension-id',
        'data-browser-extension'
      ];
      
      // Clean up attributes from the document and body
      const elementsToClean = [document.documentElement, document.body];
      
      elementsToClean.forEach(element => {
        if (element) {
          // Remove attributes that start with the problematic prefixes
          const attributes = Array.from(element.attributes);
          attributes.forEach(attr => {
            if (attributesToRemove.some(prefix => attr.name.startsWith(prefix))) {
              element.removeAttribute(attr.name);
            }
          });
        }
      });
      
      // Also clean up any elements that might have these attributes
      attributesToRemove.forEach(prefix => {
        const elements = document.querySelectorAll(`[class*="${prefix}"], [id*="${prefix}"]`);
        elements.forEach(el => {
          // Remove classes containing the prefix
          const classList = Array.from(el.classList);
          classList.forEach(className => {
            if (className.includes(prefix)) {
              el.classList.remove(className);
            }
          });
          
          // Remove attributes containing the prefix
          const attributes = Array.from(el.attributes);
          attributes.forEach(attr => {
            if (attr.name.includes(prefix) || (attr.value && attr.value.includes(prefix))) {
              el.removeAttribute(attr.name);
            }
          });
        });
      });
    };

    // Run cleanup on mount
    cleanupExtensionAttributes();
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}