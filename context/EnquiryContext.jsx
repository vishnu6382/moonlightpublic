'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const EnquiryContext = createContext({
  prefilledMessage: '',
  setPrefilledMessage: () => {},
  scrollToContact: () => {},
});

export function EnquiryProvider({ children }) {
  const [prefilledMessage, setPrefilledMessage] = useState('');

  const scrollToContact = useCallback((customMsg = '') => {
    if (customMsg) {
      setPrefilledMessage(customMsg);
    }
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // If there's an input or textarea, focus it after scrolling
      setTimeout(() => {
        const textarea = el.querySelector('textarea[name="message"]');
        if (textarea) textarea.focus();
      }, 500);
    }
  }, []);

  return (
    <EnquiryContext.Provider value={{ prefilledMessage, setPrefilledMessage, scrollToContact }}>
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  return useContext(EnquiryContext);
}
