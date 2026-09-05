import Campus from '@/components/campus';
import { createWorkspace } from '@/lib/seed';
export default function Home() {
  return <Campus initial={createWorkspace()} />;
}
