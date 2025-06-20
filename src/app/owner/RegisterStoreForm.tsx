'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const categories = ['한식', '중식', '일식', '양식', '분식'];
const seoulcity = [
  '서울시 종로구', '서울시 중구', '서울시 용산구', '서울시 성동구', '서울시 광진구',
  '서울시 동대문구', '서울시 중랑구', '서울시 성북구', '서울시 강북구', '서울시 도봉구',
  '서울시 노원구', '서울시 은평구', '서울시 서대문구', '서울시 마포구', '서울시 양천구',
  '서울시 강서구', '서울시 구로구', '서울시 금천구', '서울시 영등포구', '서울시 동작구',
  '서울시 관악구', '서울시 서초구', '서울시 강남구', '서울시 송파구', '서울시 강동구',
];

interface ShopForm {
  name: string;
  category: string;
  district: string;
  detailAddress: string;
  basePay: string;
  description: string;
  imageUrl: string;
}

export default function RegisterStoreForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ShopForm>({
    name: '', category: '', district: '', detailAddress: '',
    basePay: '', description: '', imageUrl: '',
  });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setCategoryOpen(false);
      if (addressRef.current && !addressRef.current.contains(event.target as Node)) setAddressOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const isEditMode = searchParams.get('editMode') === 'true';
    setEditMode(isEditMode);
    if (isEditMode) {
      const editingShopData = localStorage.getItem('editingShopData');
      if (editingShopData) {
        const shop = JSON.parse(editingShopData);
        setForm({
          name: shop.name || '',
          category: shop.category || '',
          district: shop.address1 || '',
          detailAddress: shop.address2 || '',
          basePay: shop.originalHourlyPay?.toString() || '',
          description: shop.description || '',
          imageUrl: shop.imageUrl || '',
        });
        setShopId(shop.id);
        localStorage.removeItem('editingShopData');
      }
    }
  }, [searchParams]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('로그인이 필요합니다.');
      router.push('/login');
      setUploading(false);
      return;
    }
    try {
      const res = await fetch('https://bootcamp-api.codeit.kr/api/15-8/the-julge/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: file.name }),
      });
      const { item } = await res.json();
      await fetch(item.url, { method: 'PUT', body: file });
      setForm((prev) => ({ ...prev, imageUrl: item.url.split('?')[0] }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.district || !form.detailAddress || !form.basePay) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    const req = {
      name: form.name,
      category: form.category,
      address1: form.district,
      address2: form.detailAddress,
      description: form.description,
      imageUrl: form.imageUrl,
      originalHourlyPay: parseInt(form.basePay),
    };
    try {
      const response = await fetch(
        editMode
          ? `https://bootcamp-api.codeit.kr/api/15-8/the-julge/shops/${shopId}`
          : 'https://bootcamp-api.codeit.kr/api/15-8/the-julge/shops',
        {
          method: editMode ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(req),
        }
      );
      const data = await response.json();
      localStorage.setItem('registeredShop', JSON.stringify(data.item));
      setShowModal(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="xl:px-[208px] mx-auto p-4">
      {/* 입력 폼 생략 - 위 코드에서 그대로 사용 가능 */}
      {/* 제출 버튼과 모달도 동일 */}
    </div>
  );
}
