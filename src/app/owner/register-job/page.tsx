'use client';
import { Suspense } from 'react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Modal from '@/components/member/Modal';
import { useRouter, useSearchParams } from 'next/navigation';
import useToken from '@/lib/hooks/use-token';
import axiosInstance from '@/lib/api/axios';
export const dynamic = 'force-dynamic';

interface JobPostRequestBody {
  hourlyPay: number;
  startsAt: string;
  workhour: number;
  description: string;
}

interface JobPostDetailResponseItem {
  id: string;
  hourlyPay: number;
  startsAt: string;
  workhour: number;
  description: string;
  closed: boolean;
  shop: {
    item: {
      id: string;
      name: string;
      category: string;
      address1: string;
      address2: string;
      description: string;
      imageUrl: string;
      originalHourlyPay: number;
    };
    href: string;
  };
}

export default function JobPostFormPage() {
  // 폼 입력 값 상태
  const [hourlyPay, setHourlyPay] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [workHours, setWorkHours] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');

  // UI 및 로직 제어 상태
  const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 여부
  const [shopId, setShopId] = useState<string | null>(null); // API 요청에 사용할 가게 ID
  const [currentNoticeId, setCurrentNoticeId] = useState<string | null>(null); // 편집할 공고 ID
  const [newRegisteredId, setNewRegisteredId] = useState<string | null>(null); // 새로 등록된 공고 ID

  const [formLoading, setFormLoading] = useState(true); // 데이터 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 중 상태
  const [showModal, setShowModal] = useState(false); // 완료 모달 표시 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지 상태

  // 훅
  const router = useRouter();
  const token = useToken();
  const searchParams = useSearchParams();

  // 폼 유효성 검사
  const isFormValid = hourlyPay && startDate && workHours && jobDescription;

  //get으로 불러오기,
  useEffect(() => {
    const noticeIdFromQuery = searchParams.get('noticeId');
    const shopIdFromQuery = searchParams.get('shopId');

    //편집 모드: URL에 noticeId와 shopId가 모두 있을 때
    if (noticeIdFromQuery && shopIdFromQuery) {
      setIsEditMode(true);
      setShopId(shopIdFromQuery); // API 요청에 사용할 shopId 설정
      setCurrentNoticeId(noticeIdFromQuery); // 편집할 noticeId 설정

      const fetchNoticeDetail = async () => {
        if (!token) {
          alert('로그인이 필요합니다.');
          setFormLoading(false);
          return;
        }
        try {
          const response = await axiosInstance.get<{ item: JobPostDetailResponseItem }>(
            `/shops/${shopIdFromQuery}/notices/${noticeIdFromQuery}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const noticeData = response.data.item;

          // 불러온 데이터로 폼 필드 채우기
          setHourlyPay(String(noticeData.hourlyPay));
          setStartDate(noticeData.startsAt.substring(0, 16));
          setWorkHours(String(noticeData.workhour));
          setJobDescription(noticeData.description);
        } catch (err) {
          console.error('공고 정보 로딩 실패:', err);
          alert('공고 정보를 불러오는 데 실패했습니다.');
          router.back();
        } finally {
          setFormLoading(false);
        }
      };

      fetchNoticeDetail();
    }
    // 등록 모드: URL에 noticeId가 없을 때
    else {
      setIsEditMode(false);
      const storedShop = localStorage.getItem('registeredShop');
      if (storedShop) {
        const parsedShop = JSON.parse(storedShop);
        setShopId(parsedShop.id);
      } else {
        alert('가게 정보가 없습니다. 가게를 먼저 등록해주세요.');
        router.push('/owner');
      }
      setFormLoading(false);
    }
  }, [searchParams, token, router]);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (!shopId) {
      setError('가게 정보가 없어 공고를 등록/수정할 수 없습니다.');
      return;
    }
    if (new Date(startDate).getTime() < Date.now()) {
      setError('시작 일시는 현재 시간보다 미래여야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const requestBody: JobPostRequestBody = {
      hourlyPay: Number(hourlyPay),
      description: jobDescription,
      startsAt: new Date(startDate).toISOString(),
      workhour: Number(workHours),
    };

    try {
      let response;
      if (isEditMode) {
        // 편집 모드 (PUT)
        response = await axiosInstance.put(
          `/shops/${shopId}/notices/${currentNoticeId}`,
          requestBody,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        // 등록 모드 (POST)
        response = await axiosInstance.post(`/shops/${shopId}/notices`, requestBody, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNewRegisteredId(response.data.item.id); // 새로 등록된 ID 저장
      }
      setShowModal(true); // 성공 시 모달 표시
    } catch (error) {
      console.error('API 요청 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowModal(false);
    if (isEditMode) {
      router.push(`/owner/job-detail/${shopId}/${currentNoticeId}`);
    } else if (newRegisteredId) {
      router.push(`/owner/job-detail/${shopId}/${newRegisteredId}`);
    } else {
      router.push('/owner/owner-store-detail'); // fallback
    }
  };

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <div className="w-full max-w-[964px] p-8 max-[375px]:p-4 flex flex-col justify-center mx-auto">
        <header className="flex justify-between mb-8">
          <h1 className="text-lg sm:text-2xl font-bold">
            {isEditMode ? '공고 편집' : '공고 등록'}
          </h1>
          <button
            className="cursor-pointer"
            onClick={() => router.push('/owner/owner-store-detail')}
          >
            <Image
              src="/close-icon.png"
              width={24}
              height={24}
              className="sm:w-8 sm:h-8"
              alt="exit"
            />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label htmlFor="wage" className="mb-2">
                시급
              </label>
              <div className="relative w-full">
                <input
                  id="wage"
                  type="number"
                  placeholder="10,000"
                  value={hourlyPay}
                  onChange={(e) => setHourlyPay(e.target.value)}
                  className="p-3 border border-solid border-gray-300 rounded-md w-full
                            appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-50 pointer-events-none">
                  원
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="start-date" className="mb-2">
                시작 일시
              </label>
              <input
                id="start-date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-3 border border-solid border-gray-300 text-gray-50 rounded-md w-full"
              ></input>
            </div>
            <div className="flex flex-col">
              <label htmlFor="working-time" className="mb-2">
                업무 시간
              </label>
              <div className="relative">
                <input
                  id="working-time"
                  type="number"
                  placeholder="6"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  className="p-3 border border-solid border-gray-300 rounded-md w-full
                            appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                ></input>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-50 pointer-events-none">
                  시간
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col mt-6 ">
            <label htmlFor="job-info" className="mb-2">
              공고 설명
            </label>
            <textarea
              id="job-info"
              placeholder="공고에 대한 기본적인 설명을 해주세요"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="p-2 border border-solid border-gray-300 rounded-md h-[153px] resize-none"
            ></textarea>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`cursor-pointer transition-colors duration-300 ease-in-out custom-button 
                    w-[351px] h-[48px] max-w-full rounded-md
                    ${
                      isFormValid && !isSubmitting
                        ? ' bg-orange hover:bg-orange-700 text-white '
                        : ' bg-gray-30 cursor-not-allowed'
                    }
                    `}
            >
              {isSubmitting ? '처리 중...' : isEditMode ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>

        {showModal && (
          <div className="max-w-[330px]">
            <Modal
              message={isEditMode ? '수정이 완료되었습니다.' : '등록이 완료되었습니다.'}
              onClose={handleCloseModal}
            />
          </div>
        )}
      </div>
    </Suspense>
  );
}
