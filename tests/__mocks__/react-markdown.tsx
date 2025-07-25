import React from 'react';

// Simple mock for react-markdown that just renders the children as text
const ReactMarkdown = ({ children }: { children: string }) => {
  return <div data-testid="react-markdown">{children}</div>;
};

export default ReactMarkdown;