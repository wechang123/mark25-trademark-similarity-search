interface EmailTemplateProps {
  name: string
  voucherCode: string
  bookingId: string
  createdAt: string
  trademarkInterest?: string
}

interface NotificationEmailProps {
  email: string
  notificationId: string
  createdAt: string
}

export function getPreBookingEmailTemplate({
  name,
  voucherCode,
  bookingId,
  createdAt,
  trademarkInterest,
}: EmailTemplateProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const shortBookingId = bookingId.slice(0, 8).toUpperCase()

  const trademarkSection = trademarkInterest
    ? `<div class="info-row">
         <span class="info-label">관심 상표</span>
         <span class="info-value">${trademarkInterest}</span>
       </div>`
    : ""

  const trademarkTextSection = trademarkInterest ? `관심 상표: ${trademarkInterest}` : ""

  return {
    subject: "[Mark25] 서비스 사전 예약 완료 - 4만원 무료 바우처 지급",
    html: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mark25 사전 예약 완료</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f8fafc; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: bold; 
    }
    .header p { 
      margin: 10px 0 0 0; 
      font-size: 16px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 40px 30px; 
    }
    .voucher-box { 
      background: linear-gradient(135deg, #34C759 0%, #30D158 100%); 
      color: white; 
      padding: 25px; 
      border-radius: 12px; 
      text-align: center; 
      margin: 30px 0; 
      box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
    }
    .voucher-code { 
      font-size: 24px; 
      font-weight: bold; 
      letter-spacing: 2px; 
      margin: 10px 0; 
      font-family: 'Courier New', monospace; 
      background: rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
    }
    .info-section { 
      background-color: #f8fafc; 
      padding: 25px; 
      border-radius: 12px; 
      margin: 25px 0; 
    }
    .info-row { 
      display: flex; 
      justify-content: space-between; 
      margin: 10px 0; 
      padding: 8px 0; 
      border-bottom: 1px solid #e2e8f0; 
    }
    .info-label { 
      font-weight: 600; 
      color: #64748b; 
    }
    .info-value { 
      color: #1e293b; 
      font-weight: 500;
    }
    .next-steps { 
      background-color: #eff6ff; 
      padding: 25px; 
      border-radius: 12px; 
      border-left: 4px solid #007AFF; 
    }
    .footer { 
      background-color: #1e293b; 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .footer p { 
      margin: 5px 0; 
      opacity: 0.8; 
    }
    .emoji { 
      font-size: 20px; 
      margin-right: 8px; 
    }
    .highlight { 
      background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .content, .header { padding: 25px 20px; }
      .voucher-code { font-size: 20px; }
      .info-row { flex-direction: column; }
      .info-label { margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 사전 예약 완료!</h1>
      <p>안녕하세요, <strong>${name}</strong>님!</p>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 30px; text-align: center;">
        <strong>Mark25 서비스 사전 예약</strong>이 성공적으로 완료되었습니다.<br>
        <span class="highlight">4만원 무료 바우처</span>를 지급해드렸습니다!
      </p>
      
      <div class="voucher-box">
        <div style="font-size: 18px; margin-bottom: 15px;">
          <span class="emoji">🎁</span>바우처 정보
        </div>
        <div class="voucher-code">${voucherCode}</div>
        <div style="font-size: 16px; margin-top: 15px;">
          할인 금액: <strong>4만원</strong> (정가 4만원 → 0원)<br>
          유효기간: <strong>정식 런칭 후 6개월</strong>
        </div>
      </div>
      
      <div class="info-section">
        <h3 style="margin-top: 0; color: #1e293b;">
          <span class="emoji">📋</span>예약 정보
        </h3>
        <div class="info-row">
          <span class="info-label">예약 번호</span>
          <span class="info-value">${shortBookingId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">신청일시</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일</span>
          <span class="info-value">${name}</span>
        </div>
        ${trademarkSection}
        <div class="info-row">
          <span class="info-label">바우처 상태</span>
          <span class="info-value" style="color: #34C759; font-weight: bold;">활성화됨</span>
        </div>
      </div>
      
      <div class="next-steps">
        <h3 style="margin-top: 0; color: #007AFF;">
          <span class="emoji">🚀</span>다음 단계
        </h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">정식 서비스 런칭 시 이메일로 다시 연락드리겠습니다</li>
          <li style="margin-bottom: 8px;"><strong>바우처 코드를 안전하게 보관</strong>해 주세요</li>
          <li style="margin-bottom: 8px;">서비스 출시 후 바우처 코드로 <strong>무료 이용</strong> 가능합니다</li>
          <li>궁금한 점이 있으시면 언제든 연락주세요</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 40px; color: #64748b; font-size: 14px;">
        이 이메일은 Mark25 서비스 사전 예약 확인을 위해 발송되었습니다.<br>
        바우처 코드 분실 시 이 이메일을 참고해 주세요.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Mark25 팀</strong></p>
      <p>AI 기반 상표 분석 서비스</p>
      <p style="font-size: 14px; margin-top: 15px;">
        문의: contact@ipdoctor.co.kr | 이 이메일은 발신 전용입니다.
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `🎉 Mark25 서비스 사전 예약 완료!

안녕하세요, ${name}님!

Mark25 서비스 사전 예약이 성공적으로 완료되었습니다.

🎁 바우처 정보
바우처 코드: ${voucherCode}
할인 금액: 4만원 (정가 4만원 → 0원)
유효기간: 정식 런칭 후 6개월

📋 예약 정보
예약 번호: ${shortBookingId}
신청일시: ${formattedDate}
이메일: ${name}
${trademarkTextSection}
바우처 상태: 활성화됨

🚀 다음 단계
- 정식 서비스 런칭 시 이메일로 다시 연락드리겠습니다
- 바우처 코드를 안전하게 보관해 주세요
- 서비스 출시 후 바우처 코드로 무료 이용 가능합니다
- 궁금한 점이 있으시면 언제든 연락주세요

감사합니다.
Mark25 팀`,
  }
}

export function getNotificationEmailTemplate({
  email,
  notificationId,
  createdAt,
}: NotificationEmailProps) {
  return {
    subject: "[Mark25] 서비스 출시 알림 신청 완료",
    html: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mark25 서비스 출시 알림 신청 완료</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 20px; 
      background-color: #f8fafc; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: bold; 
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 14px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 30px; 
      text-align: center;
    }
    .message {
      font-size: 16px; 
      color: #64748b; 
      margin-bottom: 25px;
    }
    .footer-info {
      background-color: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .footer-info h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #1e293b;
      font-weight: bold;
    }
    .footer-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #64748b;
    }
    .footer-info a {
      color: #007AFF;
      text-decoration: none;
      font-weight: 500;
    }
    .footer-info a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .header, .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 출시 알림 신청 완료!</h1>
      <p>서비스 출시 소식을 가장 먼저 받아보세요</p>
    </div>
    
    <div class="content">
      <div class="message">
        출시 알림 신청해 주셔서 감사합니다.<br>
        더 나은 서비스로 찾아뵙겠습니다.
      </div>
      
      <div class="footer-info">
        <h3>Mark25 팀</h3>
        <p>AI 기반 상표 분석 서비스</p>
        <p>
          웹사이트: <a href="https://ip-dr.com" target="_blank">https://ip-dr.com</a><br>
          문의: tmdals128551@gmail.com
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `🔔 Mark25 서비스 출시 알림 신청 완료!

서비스 출시 소식을 가장 먼저 받아보세요.

출시 알림 신청해 주셔서 감사합니다.
더 나은 서비스로 찾아뵙겠습니다.

Mark25 팀
AI 기반 상표 분석 서비스
웹사이트: https://ip-dr.com
문의: tmdals128551@gmail.com`,  
  }
}
