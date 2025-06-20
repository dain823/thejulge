import { Suspense } from 'react';
import RegisterStoreForm from '@/components/owner/RegisterStoreForm';

export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <RegisterStoreForm />
    </Suspense>
  );
}
