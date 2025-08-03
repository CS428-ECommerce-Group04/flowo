import { useState } from 'react';
import ChatBot from './ChatBot';
import ChatToggle from './ChatToggle';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatToggle isOpen={isOpen} onClick={toggleChat} />
      <ChatBot isOpen={isOpen} onClose={closeChat} />
    </>
  );
}
