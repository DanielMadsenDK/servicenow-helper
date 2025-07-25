import { FileText, Lightbulb, Code2, Wrench } from 'lucide-react';

export type RequestType = 'documentation' | 'recommendation' | 'script' | 'troubleshoot';

export const PLACEHOLDER_EXAMPLES = [
  "How do I create a custom widget in ServiceNow?",
  "What's the best way to implement ACLs for security?",
  "Show me how to write a Business Rule for incident management",
  "How do I set up email notifications for approvals?",
  "Explain ServiceNow Flow Designer best practices",
  "How to troubleshoot slow performance in ServiceNow?",
  "Create a script to update user records in bulk",
  "What are the differences between UI Actions and Client Scripts?"
];

export const TYPE_OPTIONS = [
  { value: 'documentation' as const, label: 'Documentation', icon: FileText },
  { value: 'recommendation' as const, label: 'Recommendation', icon: Lightbulb },
  { value: 'script' as const, label: 'Script Solution', icon: Code2 },
  { value: 'troubleshoot' as const, label: 'Troubleshoot', icon: Wrench },
];

export const QUICK_ACTIONS = [
  { text: "Create a Business Rule", icon: Code2, type: 'script' as const },
  { text: "Setup ACL Security", icon: Wrench, type: 'documentation' as const },
  { text: "Build Custom Widget", icon: Lightbulb, type: 'recommendation' as const },
  { text: "Fix Performance Issues", icon: Wrench, type: 'troubleshoot' as const }
];

// Placeholder rotation interval in milliseconds
export const PLACEHOLDER_ROTATION_INTERVAL = 7000;