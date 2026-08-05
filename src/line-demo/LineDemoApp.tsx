import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, PenLine, Send } from 'lucide-react';
import { LiffPrimaryButton, LiffSheet } from './components/LiffSheet';
import { LineChat, LineChatHeader, type ChatItem } from './components/LineChat';
import { PhoneFrame, StatusBar } from './components/PhoneFrame';
import { PresenterPanel } from './components/PresenterPanel';
import { RichMenu } from './components/RichMenu';
import { BudgetScreen, BUDGETS, type BudgetId } from './screens/BudgetScreen';
import { CameraScreen } from './screens/CameraScreen';
import { OcrCheckScreen } from './screens/OcrCheckScreen';
import { OtpScreen } from './screens/OtpScreen';
import { PortfolioScreen } from './screens/PortfolioScreen';
import { FLOW_SEQUENCE, STEPS, type FlowId, type StepId } from './journey';

/** ข้อความตั้งต้นในห้องแชท ก่อนครูเริ่มทำอะไร */
function initialChat(onNoop: () => void): ChatItem[] {
  void onNoop;
  return [
    { kind: 'system', id: 'sys-1', text: 'วันนี้' },
    {
      kind: 'text',
      id: 'm1',
      from: 'oa',
      time: '07:30',
      text: 'สวัสดีเช้าวันจันทร์ค่ะ คุณครูสมศรี 🌤️ สัปดาห์นี้มีเอกสารรอคุณครูเซ็น 3 ฉบับนะคะ',
    },
    {
      kind: 'text',
      id: 'm2',
      from: 'oa',
      time: '07:30',
      text: 'มีใบเสร็จที่ยังไม่ได้ลงบัญชีไหมคะ? แตะ “ถ่ายใบเสร็จ” ที่เมนูด้านล่างได้เลยค่ะ',
    },
  ];
}

const AUTOPLAY_MS = 3600;

/**
 * Prototype จำลอง user journey บน LINE OA สำหรับใช้นำเสนอ
 * ทั้งหมดเป็นข้อมูลจำลอง ไม่ได้เชื่อมต่อ LINE Messaging API จริง
 */
export function LineDemoApp() {
  const [flow, setFlow] = useState<FlowId>('docdone');
  const [stepId, setStepId] = useState<StepId>('chat-idle');
  const [menuTab, setMenuTab] = useState<FlowId>('docdone');
  const [messages, setMessages] = useState<ChatItem[]>(() => initialChat(() => {}));

  const [amount, setAmount] = useState('1,2S0.00');
  const [amountConfirmed, setAmountConfirmed] = useState(false);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const budgetName = useMemo(
    () => BUDGETS.find((item) => item.id === budget)?.name ?? 'งบพัสดุหมวดวิชา',
    [budget],
  );

  // เลื่อนแชทลงล่างสุดเมื่อมีข้อความใหม่ โดยไม่แตะ scroll ของหน้าเว็บด้านนอก
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scroller = chatScrollRef.current;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, stepId, menuCollapsed]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goTo = useCallback((next: StepId) => {
    setStepId(next);
    setFlow(STEPS[next].flow);
    if (STEPS[next].flow === 'teachgrow') setMenuTab('teachgrow');
  }, []);

  const pushSummaryCard = useCallback(() => {
    // พับเมนูเก็บเหมือนตอนใช้ LINE จริง เพื่อให้การ์ดสรุปแสดงเต็มใบ
    setMenuCollapsed(true);
    setMessages((current) => {
      if (current.some((item) => item.id === 'flex-summary')) return current;
      return [
        ...current,
        {
          kind: 'text',
          id: 'm3',
          from: 'user',
          time: '09:41',
          text: '📷 ส่งรูปใบเสร็จ 1 รูป',
        },
        {
          kind: 'receipt-summary',
          id: 'flex-summary',
          time: '09:42',
          amount: '1,250.00',
          vendor: 'ร้านสหกรณ์โรงเรียน',
          budget: budgetName,
          onSign: () => goTo('liff-otp'),
        },
      ];
    });
  }, [budgetName, goTo]);

  const pushSignedCard = useCallback(() => {
    setMenuCollapsed(true);
    setMessages((current) => {
      if (current.some((item) => item.id === 'flex-signed')) return current;
      return [
        ...current,
        {
          kind: 'signed-proof',
          id: 'flex-signed',
          time: '09:44',
          docNo: 'บก.01-2567-0842',
          amount: '1,250.00',
        },
      ];
    });
  }, []);

  /** รีเซ็ตทุกอย่างกลับไปจุดเริ่มต้น สำหรับสาธิตรอบถัดไป */
  const reset = useCallback(() => {
    setIsPlaying(false);
    setMessages(initialChat(() => {}));
    setAmount('1,2S0.00');
    setAmountConfirmed(false);
    setBudget(null);
    setOtp(['', '', '', '', '', '']);
    setMenuTab('docdone');
    setMenuCollapsed(false);
    setFlow('docdone');
    setStepId('chat-idle');
  }, []);

  /** เล่นอัตโนมัติสำหรับตอนขึ้นเวทีนำเสนอ */
  useEffect(() => {
    if (!isPlaying) return;

    const sequence = FLOW_SEQUENCE[flow];
    const index = sequence.indexOf(stepId);
    const next = sequence[index + 1];

    if (!next) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      // เติมข้อมูลที่ขั้นนั้นต้องใช้ให้เอง เพื่อให้ flow เดินได้ครบโดยไม่ต้องกรอกมือ
      if (next === 'liff-budget') {
        setAmount('1,250.00');
        setAmountConfirmed(true);
      }
      if (next === 'chat-summary') {
        setBudget((current) => current ?? 'supplies');
        pushSummaryCard();
      }
      if (next === 'liff-otp') setOtp(['4', '8', '2', '9', '1', '6']);
      if (next === 'chat-signed') pushSignedCard();
      goTo(next);
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, stepId, flow, goTo, pushSummaryCard, pushSignedCard]);

  const jumpTo = useCallback(
    (target: StepId) => {
      setIsPlaying(false);
      // เติม state ที่จำเป็นเพื่อให้ข้ามไปขั้นไหนก็แสดงผลถูกต้อง
      if (target === 'liff-budget' || target === 'chat-summary' || target === 'liff-otp' || target === 'chat-signed') {
        setAmount('1,250.00');
        setAmountConfirmed(true);
        setBudget((current) => current ?? 'supplies');
      }
      if (target === 'chat-summary' || target === 'liff-otp' || target === 'chat-signed') {
        pushSummaryCard();
      }
      if (target === 'chat-signed') {
        setOtp(['4', '8', '2', '9', '1', '6']);
        pushSignedCard();
      }
      goTo(target);
    },
    [goTo, pushSummaryCard, pushSignedCard],
  );

  const handleSubmitBudget = () => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      pushSummaryCard();
      goTo('chat-summary');
    }, 900);
  };

  const handleSign = () => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      pushSignedCard();
      goTo('chat-signed');
    }, 1100);
  };

  const otpComplete = otp.every((digit) => digit !== '');
  const isChatStep = stepId.startsWith('chat-');

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-heading text-ink">
              KruAssist บน LINE OA — Prototype สำหรับนำเสนอ
            </h1>
            <p className="mt-0.5 text-base text-ink-light">
              จำลอง user journey ของครูตั้งแต่เปิดแชทจนเซ็นเอกสารเสร็จ · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง
            </p>
          </div>

          <a
            href="/"
            className="tap-target flex shrink-0 items-center gap-2 rounded-btn border-2 border-slate-300 px-4 font-display text-base font-bold text-ink transition hover:bg-slate-50"
          >
            ไปที่ระบบเวอร์ชันเว็บ
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:justify-center">
        <div className="relative mx-auto lg:mx-0">
          <PhoneFrame>
            {/* ชั้นแชท — อยู่ข้างล่างเสมอ LIFF จะเด้งทับ */}
            <div className="flex h-full flex-col bg-line-bg">
              <StatusBar />
              <LineChatHeader />
              <LineChat items={messages} scrollRef={chatScrollRef} />
              <RichMenu
                tab={menuTab}
                onSwitchTab={(tab) => {
                  setMenuTab(tab);
                  setMenuCollapsed(false);
                  setFlow(tab);
                  if (tab === 'teachgrow') setStepId('liff-portfolio');
                  else setStepId(messages.some((m) => m.id === 'flex-signed') ? 'chat-signed' : 'chat-idle');
                }}
                onTapCamera={() => goTo('liff-camera')}
                onTapPortfolio={() => goTo('liff-portfolio')}
                onTapUnavailable={(label) =>
                  setToast(`“${label}” อยู่ใน Phase 2 ของแผนพัฒนา ยังไม่ได้ทำใน prototype นี้ค่ะ`)
                }
                pendingSignatures={3}
                collapsed={menuCollapsed}
                onToggleCollapsed={() => setMenuCollapsed((value) => !value)}
              />
            </div>

            {/* ชั้น LIFF */}
            {stepId === 'liff-camera' && (
              <LiffSheet
                variant="camera"
                title="ถ่ายใบเสร็จ"
                onBack={() => goTo('chat-idle')}
                onClose={() => goTo('chat-idle')}
              >
                <CameraScreen onShoot={() => goTo('liff-ocr')} />
              </LiffSheet>
            )}

            {stepId === 'liff-ocr' && (
              <LiffSheet
                title="ตรวจข้อมูลจากใบเสร็จ"
                step={{ current: 1, total: 2 }}
                onBack={() => goTo('liff-camera')}
                onClose={() => goTo('chat-idle')}
                footer={
                  <LiffPrimaryButton onClick={() => goTo('liff-budget')}>
                    ยืนยันข้อมูล ไปเลือกหมวดงบ
                  </LiffPrimaryButton>
                }
              >
                <OcrCheckScreen
                  amount={amount}
                  onAmountChange={setAmount}
                  confirmed={amountConfirmed}
                  onConfirm={() => setAmountConfirmed(true)}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-budget' && (
              <LiffSheet
                title="เลือกหมวดงบประมาณ"
                step={{ current: 2, total: 2 }}
                onBack={() => goTo('liff-ocr')}
                onClose={() => goTo('chat-idle')}
                footer={
                  <LiffPrimaryButton
                    onClick={handleSubmitBudget}
                    disabled={!budget}
                    loading={isSubmitting}
                    loadingText="กำลังสร้างใบเบิก…"
                    icon={<Send className="h-5 w-5" aria-hidden />}
                  >
                    {budget ? 'สร้างใบเบิกจากใบเสร็จนี้' : 'เลือกหมวดงบก่อน 1 หมวด'}
                  </LiffPrimaryButton>
                }
              >
                <BudgetScreen selected={budget} onSelect={setBudget} />
              </LiffSheet>
            )}

            {stepId === 'liff-otp' && (
              <LiffSheet
                title="ยืนยันการเซ็นเอกสาร"
                onBack={() => goTo('chat-summary')}
                onClose={() => goTo('chat-summary')}
                footer={
                  <LiffPrimaryButton
                    onClick={handleSign}
                    disabled={!otpComplete}
                    loading={isSubmitting}
                    loadingText="กำลังยืนยันลายเซ็น…"
                    icon={<PenLine className="h-5 w-5" aria-hidden />}
                  >
                    {otpComplete ? 'ยืนยันการเซ็น' : 'กรอกรหัสให้ครบ 6 หลัก'}
                  </LiffPrimaryButton>
                }
              >
                <OtpScreen
                  amount="1,250.00"
                  budgetName={budgetName}
                  otp={otp}
                  onOtpChange={setOtp}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-portfolio' && (
              <LiffSheet
                title="แฟ้มสะสมงาน ว.PA"
                onBack={() => {
                  setMenuTab('docdone');
                  goTo('chat-idle');
                }}
                onClose={() => {
                  setMenuTab('docdone');
                  goTo('chat-idle');
                }}
                footer={
                  <LiffPrimaryButton tone="grow">Export PDF ตามแบบ ว.PA</LiffPrimaryButton>
                }
              >
                <PortfolioScreen />
              </LiffSheet>
            )}

            {/* toast ในจอมือถือ */}
            {toast && (
              <div className="absolute inset-x-4 bottom-24 z-30 animate-slide-up rounded-btn bg-slate-900/90 px-4 py-3 text-center text-[12px] font-medium text-white">
                {toast}
              </div>
            )}
          </PhoneFrame>

          {isChatStep && (
            <p className="mt-3 text-center text-sm text-ink-mute">
              แตะเมนูล่างจอได้เหมือนใช้ LINE จริง
            </p>
          )}
        </div>

        <PresenterPanel
          flow={flow}
          stepId={stepId}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((value) => !value)}
          onReset={reset}
          onJump={jumpTo}
        />
      </main>
    </div>
  );
}
