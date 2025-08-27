import { Toaster } from 'sonner';

import { PlateEditor } from '@/shared/ui/plate-editor';
import { Card } from '@/shared/ui/card';

export default function Page() {
  return (
    <Card className="py-0 h-screen col-span-full">
      <PlateEditor />

      <Toaster />
    </Card>
  );
}
