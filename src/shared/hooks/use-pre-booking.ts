"use client";

import { useState } from "react";
import { createPreBooking } from "@/features/pre-order";
import { trackPreBooking } from "@/shared/utils/analytics";

interface UsePreBookingProps {
  source?: "homepage" | "results_page";
}

interface PreBookingData {
  email: string;
}

interface PreBookingErrors {
  email?: string;
  submit?: string;
}

interface PreBookingSuccess {
  notificationId: string;
  emailSent: boolean;
  emailError?: string;
  fallbackMode?: boolean;
}

export function usePreBooking({ source = "homepage" }: UsePreBookingProps = {}) {
  const [formData, setFormData] = useState<PreBookingData>({ email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<PreBookingErrors>({});
  const [successData, setSuccessData] = useState<PreBookingSuccess | null>(null);

  const validateForm = (): boolean => {
    const newErrors: PreBookingErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PreBookingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await createPreBooking({
        source,
        email: formData.email,
      });

      setSuccessData({
        notificationId: result.booking.id,
        emailSent: result.email_sent,
        emailError: result.email_error,
        fallbackMode: result.fallback_mode,
      });

      // Track analytics
      trackPreBooking(formData.email);
    } catch (error) {
      console.error("Pre-booking submission failed:", error);

      let errorMessage = "요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.";

      if (error instanceof Error) {
        if (error.message.includes("이미 등록된") || error.message.includes("이미 해당 이메일")) {
          errorMessage = "이미 해당 이메일로 출시 알림 신청이 완료되었습니다.";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: "" });
    setErrors({});
    setSuccessData(null);
    setIsSubmitting(false);
  };

  const closeSuccess = () => {
    setSuccessData(null);
  };

  return {
    // Form data
    formData,
    isSubmitting,
    errors,
    successData,
    
    // Actions
    handleInputChange,
    handleSubmit,
    resetForm,
    closeSuccess,
    
    // Computed states
    isSuccess: !!successData,
    hasErrors: Object.keys(errors).length > 0,
  };
}