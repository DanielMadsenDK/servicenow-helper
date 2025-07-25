import { Metadata } from 'next';
import UserManual from '@/components/UserManual';

export const metadata: Metadata = {
  title: 'User Manual | ServiceNow Helper',
  description: 'Learn how to use ServiceNow Helper features and get the most out of your AI-powered ServiceNow assistant.',
};

export default function ManualPage() {
  return <UserManual />;
}