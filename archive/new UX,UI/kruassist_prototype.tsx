import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, FileText, Calendar, Award, BarChart2, Folder, HelpCircle, ChevronLeft, ArrowRight, Search, Plus, Download, Lock, Check } from 'lucide-react';

const COLORS = {
  docDone: '#2E7D5B', // เขียว
  teachGrow: '#2C6BB0', // น้ำเงิน
  accent: '#F5A623', // ส้ม (รอดำเนินการ/แก้ไข)
  error: '#D64545', // แดง (มีปัญหา)
  gray: '#9E9E9E', // เทา
  bg: '#F5F7FA', // สีพื้นหลังแอป
  white: '#FFFFFF',
  textMain: '#333333',
  textLight: '#666666'
};

const TYPOGRAPHY = {
  fontFamily: "'Noto Sans Thai', sans-serif", // จำลองการใช้ Noto Sans Thai
};

// --- Mock Data ---
const MOCK_PORTFOLIO_ITEMS = [
  { id: 1, type: 'teach', title: 'สอนวิชาคณิตศาสตร์ ม.2/3', date: 'วันนี้, 10:00', desc: 'เรื่องสมการเชิงเส้นตัวแปรเดียว', complete: true },
  { id: 2, type: 'train', title: 'อบรมเชิงปฏิบัติการ การจัดการเรียนรู้แบบ Active Learning', date: '12 ส.ค. 2567', desc: 'ณ สพฐ.', complete: true },
  { id: 3, type: 'compete', title: 'พานักเรียนแข่งขันทักษะวิชาการ', date: '5 ส.ค. 2567', desc: 'ได้รับรางวัลเหรียญทอง ระดับเขตพื้นที่', complete: false },
];

const ButtonMain = ({ onClick, children, color = COLORS.docDone, icon: Icon, loading = false }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full h-14 rounded-xl flex items-center justify-center font-bold text-white text-[16px] transition-transform active:scale-95 shadow-sm"
    style={{ backgroundColor: color, height: '56px' }}
  >
    {loading ? (
      <span>กำลังส่ง...</span>
    ) : (
      <>
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {children}
      </>
    )}
  </button>
);

const Header = ({ title, onBack, rightElement }) => (
  <div className="flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-10">
    <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-gray-100">
      <ChevronLeft className="w-6 h-6 text-gray-700" />
    </button>
    <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    <div className="w-10 flex justify-end">{rightElement}</div>
  </div>
);

const StepProgress = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center space-x-2 py-3 bg-white border-b border-gray-100">
    {Array.from({ length: totalSteps }).map((_, index) => (
      <React.Fragment key={index}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index + 1 <= currentStep ? 'bg-[#2E7D5B] text-white' : 'bg-gray-200 text-gray-500'}`}>
          {index + 1}
        </div>
        {index < totalSteps - 1 && (
          <div className={`h-1 w-8 ${index + 1 < currentStep ? 'bg-[#2E7D5B]' : 'bg-gray-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const MockRichMenuScreen = ({ setScreen }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm text-center">
      <h2 className="text-2xl font-bold mb-2">KruAssist Prototype</h2>
      <p className="text-gray-500 mb-6 text-sm">จำลองการเข้าถึงจาก LINE OA</p>
      
      <div className="space-y-4">
        <div className="text-left font-semibold text-gray-700 mb-2">Flow A: งานเอกสาร (Doc Done)</div>
        <button 
          onClick={() => setScreen('camera')}
          className="w-full bg-[#2E7D5B] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Camera /> ถ่ายใบเสร็จ
        </button>
        <button 
          onClick={() => setScreen('otp')}
          className="w-full bg-white border-2 border-[#2E7D5B] text-[#2E7D5B] p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Lock /> จำลองหน้าเซ็นเอกสาร (OTP)
        </button>

        <div className="text-left font-semibold text-gray-700 mt-6 mb-2">Flow G: งานพัฒนา (Teach & Grow)</div>
        <button 
          onClick={() => setScreen('portfolio')}
          className="w-full bg-[#2C6BB0] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Folder /> จัดการแฟ้ม ว.PA
        </button>
      </div>
    </div>
  </div>
);

// 1. Camera Screen
const CameraScreen = ({ setScreen }) => {
  return (
    <div className="h-screen bg-black flex flex-col relative" style={TYPOGRAPHY}>
      <div className="p-4 flex justify-between items-center text-white z-10 absolute top-0 w-full">
        <button onClick={() => setScreen('menu')}><ChevronLeft className="w-8 h-8" /></button>
        <span className="font-bold">ถ่ายใบเสร็จ</span>
        <button className="w-8 h-8 flex items-center justify-center"><HelpCircle className="w-6 h-6" /></button>
      </div>
      
      {/* Mock Camera View */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Guide frame */}
        <div className="border-2 border-white border-dashed w-3/4 h-1/2 rounded-lg opacity-70 flex items-center justify-center">
           <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">วางใบเสร็จในกรอบนี้</p>
        </div>
      </div>

      <div className="h-32 bg-black pb-8 flex items-center justify-center w-full z-10 absolute bottom-0">
         <button 
           onClick={() => setScreen('ocr_check')}
           className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
         >
           <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-800"></div>
         </button>
      </div>
    </div>
  );
};

// 2. OCR Check Screen
const OcrCheckScreen = ({ setScreen }) => {
  const [vendorName, setVendorName] = useState('ร้านสหกรณ์โรงเรียน');
  const [date, setDate] = useState('12 ส.ค. 2567');
  const [amount, setAmount] = useState('350.00'); // สมมติว่า AI ไม่แน่ใจจุดนี้
  const [isAmountEdited, setIsAmountEdited] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col pb-24" style={TYPOGRAPHY}>
      <Header title="ตรวจสอบข้อมูล" onBack={() => setScreen('camera')} rightElement={<button className="text-xs text-gray-500 underline">ถามเจ้าหน้าที่</button>} />
      
      <div className="p-4 flex-1">
        {/* Helper Banner */}
        <div className="bg-[#FFF8E1] border border-[#F5A623] rounded-lg p-3 flex items-start gap-3 mb-6">
          <AlertCircle className="text-[#F5A623] w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-[#D84315] text-sm">แก้แค่ 1 ช่องพอ!</p>
            <p className="text-sm text-gray-700 mt-1">AI ไม่แน่ใจยอดเงิน โปรดตรวจสอบและแก้ไขให้ถูกต้อง</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Confident Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อร้านค้า</label>
            <div className="relative">
              <input 
                type="text" 
                value={vendorName}
                readOnly
                className="w-full p-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
              />
              <CheckCircle className="absolute right-4 top-4 text-[#9E9E9E] w-5 h-5" />
            </div>
          </div>

          {/* Confident Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">วันที่ในใบเสร็จ</label>
            <div className="relative">
              <input 
                type="text" 
                value={date}
                readOnly
                className="w-full p-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
              />
              <CheckCircle className="absolute right-4 top-4 text-[#9E9E9E] w-5 h-5" />
            </div>
          </div>

          {/* Unconfident Field (Needs Attention) */}
          <div>
            <label className="block text-sm font-bold text-[#F5A623] mb-1">ยอดเงินสุทธิ (บาท) *</label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setIsAmountEdited(true);
                }}
                className={`w-full p-4 bg-[#FFF8E1] border-2 border-[#F5A623] rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623] ${isAmountEdited ? 'bg-white border-green-500' : ''}`}
              />
              {isAmountEdited && <CheckCircle className="absolute right-4 top-4 text-green-500 w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <ButtonMain onClick={() => setScreen('select_budget')}>
            ดำเนินการต่อไป
         </ButtonMain>
      </div>
    </div>
  );
};

// 3. Select Budget Screen
const SelectBudgetScreen = ({ setScreen }) => {
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen('menu'); // In real app, goes to Chat Flex
      alert('จำลอง: เด้งกลับไปที่แชท LINE พร้อม Flex Message สรุปข้อมูล');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col pb-24" style={TYPOGRAPHY}>
      <Header title="เลือกหมวดงบประมาณ" onBack={() => setScreen('ocr_check')} />
      <StepProgress currentStep={2} totalSteps={2} />
      
      <div className="p-4 flex-1">
        <h2 className="text-lg font-bold text-gray-800 mb-4">เอกสารนี้เบิกจากงบส่วนใด?</h2>
        
        <div className="space-y-3">
          {[
            { id: 'free15', name: 'เรียนฟรี 15 ปี', desc: 'ค่าอุปกรณ์, กิจกรรมพัฒนาผู้เรียน' },
            { id: 'activity', name: 'งบกิจกรรมโรงเรียน', desc: 'กีฬาสี, วันสำคัญ, ทัศนศึกษา' },
            { id: 'supplies', name: 'งบพัสดุหมวดวิชา', desc: 'อุปกรณ์การสอนประจำหมวด' },
          ].map(budget => (
            <div 
              key={budget.id}
              onClick={() => setSelectedBudget(budget.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedBudget === budget.id ? 'border-[#2E7D5B] bg-[#E8F5E9]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">{budget.name}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedBudget === budget.id ? 'border-[#2E7D5B] bg-[#2E7D5B]' : 'border-gray-300'}`}>
                   {selectedBudget === budget.id && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{budget.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <ButtonMain 
            onClick={handleNext} 
            loading={loading}
            color={selectedBudget ? COLORS.docDone : COLORS.gray}
         >
            สร้างเอกสารเบิกจ่าย
         </ButtonMain>
      </div>
    </div>
  );
};

const OtpScreen = ({ setScreen }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [loading, setLoading] = useState(false);

  // Simple countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next (simplified for demo)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSign = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('จำลอง: เซ็นสำเร็จ ระบบจะส่ง Flex แจ้งเตือนเข้าแชท');
      setScreen('menu');
    }, 1000);
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24" style={TYPOGRAPHY}>
      <Header title="ยืนยันการเซ็นเอกสาร" onBack={() => setScreen('menu')} />
      
      <div className="p-6 flex-1 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-[#2E7D5B]" />
        </div>
        
        {/* Summary Box */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-1">เอกสารที่จะเซ็น</p>
          <p className="font-bold text-gray-800 mb-4">ใบเบิกค่าวัสดุอุปกรณ์วิชาวิทยาศาสตร์ (บก.01)</p>
          <p className="text-sm text-gray-500 mb-1">ยอดเงินรวม</p>
          <p className="text-2xl font-bold text-[#2E7D5B]">1,250.00 บาท</p>
        </div>

        {/* Warning Text - Grey, not Red */}
        <p className="text-sm text-gray-600 text-center mb-8 px-4">
          ลายเซ็นนี้มีผลผูกพันตามระเบียบราชการ โปรดตรวจสอบยอดก่อนยืนยัน
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 mb-6 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="number"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              className="w-12 h-14 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold text-gray-800 focus:border-[#2E7D5B] focus:outline-none"
              maxLength={1}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500">รหัสจะหมดอายุใน {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          <span className="text-gray-300">|</span>
          <button className="text-[#2E7D5B] font-bold" onClick={() => setTimeLeft(180)}>ขอรหัสใหม่</button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 shadow-md">
         <ButtonMain 
            onClick={handleSign} 
            loading={loading}
            color={isComplete ? COLORS.docDone : COLORS.gray}
         >
            ยืนยันการเซ็นด้วย OTP
         </ButtonMain>
      </div>
    </div>
  );
};

const PortfolioScreen = ({ setScreen }) => {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col pb-24" style={TYPOGRAPHY}>
      <Header title="แฟ้มสะสมงาน ว.PA" onBack={() => setScreen('menu')} />
      
      {/* Progress Bar Top */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100">
         <div className="flex justify-between items-end mb-2">
           <span className="font-bold text-gray-800 text-sm">ความครบถ้วนของแฟ้มปีนี้</span>
           <span className="font-bold text-[#2C6BB0]">68%</span>
         </div>
         <div className="w-full bg-gray-200 rounded-full h-2.5">
           <div className="bg-[#2C6BB0] h-2.5 rounded-full" style={{ width: '68%' }}></div>
         </div>
         <p className="text-xs text-gray-500 mt-2">💡 ขาดด้าน: การพัฒนาตนเอง (อบรม)</p>
      </div>

      <div className="p-4 flex-1">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2C6BB0]" /> ไทม์ไลน์ผลงาน (ส.ค. 67)
        </h3>
        
        {/* Timeline Items */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
          
          {MOCK_PORTFOLIO_ITEMS.map((item, index) => (
            <div key={item.id} className="relative flex items-start pl-10 md:pl-0">
               <div className="md:hidden absolute left-0 mt-1.5 w-8 h-8 rounded-full bg-white border-2 border-[#2C6BB0] flex items-center justify-center z-10">
                  {item.type === 'teach' && <FileText className="w-4 h-4 text-[#2C6BB0]" />}
                  {item.type === 'train' && <Award className="w-4 h-4 text-[#2C6BB0]" />}
                  {item.type === 'compete' && <BarChart2 className="w-4 h-4 text-[#2C6BB0]" />}
               </div>
               
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full ml-2 relative">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-400">{item.date}</span>
                    {!item.complete && (
                       <span className="px-2 py-0.5 bg-[#FFF8E1] text-[#F5A623] text-[10px] font-bold rounded-full border border-[#F5A623]">รอเขียนสรุป</span>
                    )}
                 </div>
                 <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                 <p className="text-xs text-gray-500 line-clamp-2">{item.desc}</p>
                 
                 {!item.complete && (
                   <button className="mt-3 text-xs font-bold text-[#2C6BB0] flex items-center gap-1 border border-[#2C6BB0] rounded-lg px-3 py-1">
                     <Plus className="w-3 h-3" /> ให้ AI ช่วยเขียนสรุป
                   </button>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Adding New Item */}
      <button className="fixed bottom-24 right-4 w-14 h-14 bg-[#2C6BB0] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95">
        <Plus className="w-6 h-6" />
      </button>

      {/* Main Export Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <ButtonMain color={COLORS.teachGrow} icon={Download}>
            Export PDF ตามแบบ ว.PA
         </ButtonMain>
      </div>
    </div>
  );
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('menu');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu': return <MockRichMenuScreen setScreen={setCurrentScreen} />;
      case 'camera': return <CameraScreen setScreen={setCurrentScreen} />;
      case 'ocr_check': return <OcrCheckScreen setScreen={setCurrentScreen} />;
      case 'select_budget': return <SelectBudgetScreen setScreen={setCurrentScreen} />;
      case 'otp': return <OtpScreen setScreen={setCurrentScreen} />;
      case 'portfolio': return <PortfolioScreen setScreen={setCurrentScreen} />;
      default: return <MockRichMenuScreen setScreen={setCurrentScreen} />;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden antialiased text-gray-800">
      {/* Mobile constraint wrapper for previewer */}
      <div className="max-w-md mx-auto h-full bg-white shadow-2xl relative overflow-y-auto overflow-x-hidden">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;