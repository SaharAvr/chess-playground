import { useEffect, useRef } from 'react';

/**
 * Hook to handle "back to close" functionality for modals.
 * On mobile/PWA, it prevents the back button from closing the app/navigating
 * when a modal is open, and instead just shuts the modal.
 */
export const usePreventMobileBackNavigation = (isOpen, onClose) => {
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      isClosingRef.current = false;
      return;
    }

    // Add dummy state to history
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = (event) => {
      // If we go back, set ref to prevent double-popping and close modal
      isClosingRef.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If we are closing via something other than back button (X, backdrop click),
      // we need to manually pop the history state we added.
      if (!isClosingRef.current && window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
};
