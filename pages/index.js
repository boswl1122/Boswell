// pages/index.js
import AccessGate from '@/components/AccessGate';
import BoswellRun from '@/components/BoswellRun';

export default function Home() {
  return (
    <AccessGate>
      <BoswellRun />
    </AccessGate>
  );
}