// src/app/owner/register-job/page.tsx
// 이 파일은 서버 컴포넌트입니다.
// 'use client' 지시문을 여기에 두면 안 됩니다.

import { Suspense } from 'react';
import JobPostFormClient from '../../../components/owner/JobPostFormClient'; // 새로 생성한 클라이언트 컴포넌트의 경로를 확인하세요.

export default function RegisterJobPage() {
  return (
    <Suspense fallback={<div>공고 등록/편집 페이지 로딩 중...</div>}>
      <JobPostFormClient />
    </Suspense>
  );
}
