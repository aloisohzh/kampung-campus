import Campus from '@/components/campus';
import { createSeed } from '@/lib/seed';
export default function Home() {
  return <Campus initial={createSeed()} />;
}
