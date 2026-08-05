import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, PenLine, Send, Sparkles } from 'lucide-react';
import { toFriendlyMessage } from '@/api/http';
import { getReceiptCategories } from '@/api/catalog.api';
import { DEFAULT_MODE, DOCUMENT_MODES } from '@/constants/documentModes';
import { useApprovers, useFormTemplates, useProjects } from '@/hooks/useCatalog';
import { useCreateJob } from '@/hooks/useCreateJob';
import { useCreateRequisition, useSuggestItems } from '@/hooks/useRequisitions';
import { useDraftRequisition } from '@/hooks/useAiAssist';
import type {
  DocumentMode,
  ReceiptCategoryId,
  RequisitionDraft,
  RequisitionItem,
  RequisitionKind,
} from '@/types';
import { LiffPrimaryButton, LiffSheet } from './components/LiffSheet';
import { LineChat, LineChatHeader, type ChatItem } from './components/LineChat';
import { PhoneFrame, StatusBar } from './components/PhoneFrame';
import { PresenterPanel } from './components/PresenterPanel';
import { RichMenu } from './components/RichMenu';
import { BudgetScreen, type BudgetId } from './screens/BudgetScreen';
import { AiComposerInputScreen, AiComposerReviewScreen } from './screens/AiComposerScreen';
import { CameraScreen } from './screens/CameraScreen';
import { JobsScreen } from './screens/JobsScreen';
import { HowToScreen, PendingSignScreen } from './screens/MiscScreens';
import type { PendingDoc } from './data/pendingDocs';
import { OcrCheckScreen } from './screens/OcrCheckScreen';
import { OtpScreen } from './screens/OtpScreen';
import { PortfolioScreen } from './screens/PortfolioScreen';
import {
  AiSuggestSheet,
  RequisitionApproverScreen,
  RequisitionInfoScreen,
  RequisitionItemsScreen,
} from './screens/RequisitionScreens';
import {
  UploadModeScreen,
  UploadReviewScreen,
  UploadSourceScreen,
  type FormatSource,
} from './screens/UploadScreens';
import { FLOW_SEQUENCE, STEPS, type FlowId, type StepId } from './journey';

/** ข้อความตั้งต้นในห้องแชท ก่อนครูเริ่มทำอะไร */
function initialChat(): ChatItem[] {
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
      text: 'มีใบเสร็จที่ยังไม่ได้ลงบัญชีไหมคะ? แตะเมนูด้านล่างได้เลยค่ะ',
    },
  ];
}

const AUTOPLAY_MS = 3600;

/** สร้างไฟล์จำลองให้ mock API — ระบบจริงจะได้ไฟล์จากกล้อง/คลังภาพของเครื่อง */
const makeMockFile = (name: string) =>
  new File([`mock-${name}`], name, {
    type: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
  });

/**
 * Prototype จำลอง user journey บน LINE OA
 *
 * ใช้ hooks และ API layer ชุดเดียวกับหน้าเว็บจริง (src/api, src/hooks)
 * ทุกฟังก์ชันบนเว็บจึงทำได้ครบที่นี่ และตรรกะตรงกันทุกจุด
 *
 * ข้อจำกัดของโหมด mock: ข้อมูลเก็บอยู่ในหน่วยความจำของหน้าเว็บนั้น ๆ
 * เปิดคนละหน้า (/ กับ /line-demo.html) จึงเริ่มจากชุดข้อมูลตั้งต้นเหมือนกัน แต่แยกกัน
 * เมื่อต่อ backend จริง (ตั้ง VITE_API_BASE_URL) ทั้งสองฝั่งจะเห็นข้อมูลเดียวกันทันที
 */
export function LineDemoApp() {
  const [flow, setFlow] = useState<FlowId>('docdone');
  const [stepId, setStepId] = useState<StepId>('chat-idle');
  const [menuTab, setMenuTab] = useState<'docdone' | 'teachgrow'>('docdone');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>(initialChat);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ---- Flow A: ถ่ายใบเสร็จ ---- */
  const [amount, setAmount] = useState('1,2S0.00');
  const [amountConfirmed, setAmountConfirmed] = useState(false);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [signingDoc, setSigningDoc] = useState<PendingDoc | null>(null);
  const [signedIds, setSignedIds] = useState<string[]>([]);

  /* ---- Flow: ส่งเอกสารให้ AI (ตรงกับหน้าเว็บ) ---- */
  const [mode, setMode] = useState<DocumentMode>(DEFAULT_MODE);
  const [formatSource, setFormatSource] = useState<FormatSource>('saved');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [receiptCategory, setReceiptCategory] = useState<ReceiptCategoryId | null>(null);
  const [notes, setNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  /* ---- Flow: เบิกงบ / ยืมพัสดุ ---- */
  const [reqKind, setReqKind] = useState<RequisitionKind>('budget');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqProjectId, setReqProjectId] = useState('');
  const [reqNeededBy, setReqNeededBy] = useState('');
  const [reqApproverId, setReqApproverId] = useState('');
  const [reqItems, setReqItems] = useState<RequisitionItem[]>([]);
  // AI ร่างใบเบิกให้จากประโยคเดียว — ทางหลักของ flow นี้
  const [reqDescription, setReqDescription] = useState('');
  const [reqDraft, setReqDraft] = useState<RequisitionDraft | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const templates = useFormTemplates();
  const projects = useProjects();
  const approvers = useApprovers();
  const createJob = useCreateJob();
  const createRequisition = useCreateRequisition();
  const suggest = useSuggestItems();
  const drafting = useDraftRequisition();

  const modeConfig = DOCUMENT_MODES[mode];
  const usesSavedTemplate = mode === 'template' && formatSource === 'saved';

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
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goTo = useCallback((next: StepId) => {
    setStepId(next);
    setFlow(STEPS[next].flow);
  }, []);

  const closeLiff = useCallback(() => goTo('chat-idle'), [goTo]);

  const pushMessage = useCallback((item: ChatItem) => {
    setMenuCollapsed(true);
    setMessages((current) =>
      current.some((entry) => entry.id === item.id) ? current : [...current, item],
    );
  }, []);

  const pushSummaryCard = useCallback(() => {
    pushMessage({
      kind: 'receipt-summary',
      id: 'flex-summary',
      time: '09:42',
      amount: '1,250.00',
      vendor: 'ร้านสหกรณ์โรงเรียน',
      budget: projects.data?.find((item) => item.id === projectId)?.name ?? 'งบพัสดุหมวดวิชา',
      onSign: () => goTo('liff-otp'),
    });
  }, [goTo, projectId, projects.data, pushMessage]);

  const pushSignedCard = useCallback(() => {
    pushMessage({
      kind: 'signed-proof',
      id: 'flex-signed',
      time: '09:44',
      docNo: signingDoc?.docNo ?? 'บก.01-2569-0842',
      amount: '1,250.00',
    });
  }, [pushMessage, signingDoc]);

  /* ---------------- ส่งเอกสารให้ AI ---------------- */
  const canSubmitUpload =
    (attachedFiles.length > 0 || (usesSavedTemplate && templateId !== null)) &&
    (mode !== 'accounting' || (projectId !== null && receiptCategory !== null));

  const handleSubmitUpload = async () => {
    try {
      const files =
        attachedFiles.length > 0
          ? attachedFiles
          : usesSavedTemplate
            ? []
            : [makeMockFile('เอกสาร.jpg')];

      await createJob.submit({
        mode,
        files,
        notes: notes.trim() || undefined,
        formTemplateId: usesSavedTemplate && templateId ? templateId : undefined,
        projectId: mode === 'accounting' && projectId ? projectId : undefined,
        receiptCategory: mode === 'accounting' && receiptCategory ? receiptCategory : undefined,
      });

      const stamp = Date.now();
      pushMessage({
        kind: 'text',
        id: `sent-${stamp}`,
        from: 'user',
        time: '09:41',
        text: `📄 ส่ง “${modeConfig.title}” ให้ AI แล้ว`,
      });
      pushMessage({
        kind: 'text',
        id: `ack-${stamp}`,
        from: 'oa',
        time: '09:41',
        text: 'รับเรื่องแล้วค่ะ AI กำลังทำให้อยู่ ใช้เวลาประมาณ 1–2 นาที คุณครูปิดแชทไปพักได้เลย ดูความคืบหน้าได้ที่ช่อง “งานของฉัน” ค่ะ',
      });

      setAttachedFiles([]);
      setNotes('');
      goTo('chat-upload-done');
    } catch (error) {
      setToast(toFriendlyMessage(error));
    }
  };

  /* ---------------- เบิกงบ / ยืมพัสดุ ---------------- */
  const reqValidItems = reqItems.filter((item) => item.name.trim().length > 0);
  const reqTotal = reqValidItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const reqProject = projects.data?.find((item) => item.id === reqProjectId);
  const overBudgetBy =
    reqProject && reqKind === 'budget'
      ? reqTotal - (reqProject.budgetTotal - reqProject.budgetUsed)
      : null;

  const handleSubmitRequisition = async () => {
    try {
      const created = await createRequisition.mutateAsync({
        kind: reqKind,
        purpose: reqPurpose.trim(),
        projectId: reqProjectId,
        neededBy: reqNeededBy.trim(),
        approverId: reqApproverId,
        items: reqValidItems.map(({ id: _id, ...rest }) => {
          void _id;
          return rest;
        }),
      });

      pushMessage({
        kind: 'text',
        id: `req-${created.id}`,
        from: 'oa',
        time: '10:05',
        text: `ส่งใบเบิกเลขที่ ${created.docNo} ให้ ${created.approverName} เซ็นอนุมัติแล้วค่ะ รอผลภายใน 2 วันทำการ ระบบจะแจ้งในแชทนี้`,
      });

      setReqPurpose('');
      setReqProjectId('');
      setReqNeededBy('');
      setReqApproverId('');
      setReqItems([]);
      setReqDescription('');
      setReqDraft(null);
      goTo('chat-req-done');
    } catch (error) {
      setToast(toFriendlyMessage(error));
    }
  };

  const handleDraftRequisition = () => {
    drafting.mutate(reqDescription, {
      onSuccess: (result) => {
        setReqDraft(result);
        setReqKind(result.kind.value);
        setReqPurpose(result.purpose.value);
        setReqProjectId(result.projectId.value);
        setReqNeededBy(result.neededBy.value);
        setReqApproverId(result.approverId.value);
        setReqItems(result.items.map((item, index) => ({ ...item, id: `draft-${index}` })));
        goTo('liff-req-review');
      },
      onError: (error) => setToast(toFriendlyMessage(error)),
    });
  };

  const handleAskAi = () => {
    setAiSelected(new Set());
    suggest.mutate(aiDescription, {
      onSuccess: (result) => setAiSelected(new Set(result.map((_, index) => index))),
    });
  };

  const handleAddAiItems = () => {
    const picked = (suggest.data ?? []).filter((_, index) => aiSelected.has(index));
    setReqItems((current) => [
      ...current,
      ...picked.map((item, index) => ({
        id: `ai-${Date.now()}-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: reqKind === 'budget' ? item.unitPrice : 0,
      })),
    ]);
    setAiOpen(false);
    setAiDescription('');
    suggest.reset();
  };

  /* ---------------- รีเซ็ต / เล่นอัตโนมัติ ---------------- */
  const reset = useCallback(() => {
    setIsPlaying(false);
    setMessages(initialChat());
    setAmount('1,2S0.00');
    setAmountConfirmed(false);
    setBudget(null);
    setOtp(['', '', '', '', '', '']);
    setSigningDoc(null);
    setSignedIds([]);
    setMode(DEFAULT_MODE);
    setFormatSource('saved');
    setTemplateId(null);
    setProjectId(null);
    setReceiptCategory(null);
    setNotes('');
    setAttachedFiles([]);
    setReqItems([]);
    setReqDescription('');
    setReqDraft(null);
    setMenuTab('docdone');
    setMenuCollapsed(false);
    setFlow('docdone');
    setStepId('chat-idle');
  }, []);

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
        setProjectId((current) => current ?? projects.data?.[0]?.id ?? null);
        setReceiptCategory((current) => current ?? 'supplies');
      }
      if (next === 'chat-summary') {
        setBudget((current) => current ?? 'supplies');
        pushSummaryCard();
      }
      if (next === 'liff-otp') setOtp(['4', '8', '2', '9', '1', '6']);
      if (next === 'chat-signed') pushSignedCard();
      if (next === 'liff-upload-source') {
        setTemplateId((current) => current ?? templates.data?.[0]?.id ?? null);
        setProjectId((current) => current ?? projects.data?.[0]?.id ?? null);
        setReceiptCategory((current) => current ?? 'supplies');
      }
      goTo(next);
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, stepId, flow, goTo, pushSummaryCard, pushSignedCard, templates.data, projects.data]);

  const jumpTo = useCallback(
    (target: StepId) => {
      setIsPlaying(false);
      if (['liff-budget', 'chat-summary', 'liff-otp', 'chat-signed'].includes(target)) {
        setAmount('1,250.00');
        setAmountConfirmed(true);
        setProjectId((current) => current ?? projects.data?.[0]?.id ?? null);
        setReceiptCategory((current) => current ?? 'supplies');
        setBudget((current) => current ?? 'supplies');
      }
      if (['chat-summary', 'liff-otp', 'chat-signed'].includes(target)) pushSummaryCard();
      if (target === 'chat-signed') {
        setOtp(['4', '8', '2', '9', '1', '6']);
        pushSignedCard();
      }
      if (['liff-upload-source', 'liff-upload-review', 'chat-upload-done'].includes(target)) {
        setTemplateId((current) => current ?? templates.data?.[0]?.id ?? null);
        setProjectId((current) => current ?? projects.data?.[0]?.id ?? null);
        setReceiptCategory((current) => current ?? 'supplies');
      }
      goTo(target);
    },
    [goTo, projects.data, templates.data, pushSummaryCard, pushSignedCard],
  );

  const templateName = useMemo(
    () => templates.data?.find((item) => item.id === templateId)?.name,
    [templates.data, templateId],
  );
  const projectName = useMemo(
    () => projects.data?.find((item) => item.id === projectId)?.name,
    [projects.data, projectId],
  );
  const categoryName = getReceiptCategories().find((item) => item.id === receiptCategory)?.name;

  const openMenuScreen = (target: StepId) => {
    setMenuCollapsed(false);
    goTo(target);
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-heading text-ink">
              KruAssist บน LINE OA — Prototype สำหรับนำเสนอ
            </h1>
            <p className="mt-0.5 text-base text-ink-light">
              ฟังก์ชันครบเท่าหน้าเว็บ ใช้ API layer และชุดข้อมูลตั้งต้นเดียวกัน · ทั้งหมดเป็นข้อมูลจำลอง
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
            <div className="flex h-full flex-col bg-line-bg">
              <StatusBar />
              <LineChatHeader />
              <LineChat items={messages} scrollRef={chatScrollRef} />
              <RichMenu
                tab={menuTab}
                onSwitchTab={(tab) => {
                  const next = tab === 'teachgrow' ? 'teachgrow' : 'docdone';
                  setMenuTab(next);
                  setMenuCollapsed(false);
                  setStepId('chat-idle');
                  setFlow(next);
                }}
                onTapCamera={() => openMenuScreen('liff-camera')}
                onTapUpload={() => openMenuScreen('liff-upload-mode')}
                onTapPendingSign={() => openMenuScreen('liff-pending')}
                onTapRequisition={() => openMenuScreen('liff-req-tell')}
                onTapJobs={() => openMenuScreen('liff-jobs')}
                onTapHowTo={() => openMenuScreen('liff-howto')}
                onTapPortfolio={() => openMenuScreen('liff-portfolio')}
                onTapUnavailable={(label) =>
                  setToast(`“${label}” อยู่ใน Phase 2 ของแผนพัฒนา ยังไม่ได้ทำใน prototype นี้ค่ะ`)
                }
                pendingSignatures={3 - signedIds.length}
                collapsed={menuCollapsed}
                onToggleCollapsed={() => setMenuCollapsed((value) => !value)}
              />
            </div>

            {/* ---------- Flow A: ถ่ายใบเสร็จ ---------- */}
            {stepId === 'liff-camera' && (
              <LiffSheet variant="camera" title="ถ่ายใบเสร็จ" onBack={closeLiff} onClose={closeLiff}>
                <CameraScreen onShoot={() => goTo('liff-ocr')} />
              </LiffSheet>
            )}

            {stepId === 'liff-ocr' && (
              <LiffSheet
                title="ตรวจข้อมูลจากใบเสร็จ"
                step={{ current: 1, total: 2 }}
                onBack={() => goTo('liff-camera')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton onClick={() => goTo('liff-budget')}>
                    ยืนยันข้อมูล ไปเลือกโครงการ
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
                title="เลือกโครงการ + หมวดงบ"
                step={{ current: 2, total: 2 }}
                onBack={() => goTo('liff-ocr')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => {
                      pushSummaryCard();
                      goTo('chat-summary');
                    }}
                    disabled={!projectId || !receiptCategory}
                    icon={<Send className="h-5 w-5" aria-hidden />}
                  >
                    {projectId && receiptCategory
                      ? 'สร้างใบเบิกจากใบเสร็จนี้'
                      : 'เลือกโครงการและประเภทก่อน'}
                  </LiffPrimaryButton>
                }
              >
                <BudgetScreen selected={budget} onSelect={setBudget} />
                <div className="mt-4">
                  <UploadSourceScreen
                    mode="accounting"
                    source="new"
                    onSourceChange={() => {}}
                    templateId={null}
                    onTemplateChange={() => {}}
                    projectId={projectId}
                    onProjectChange={setProjectId}
                    category={receiptCategory}
                    onCategoryChange={setReceiptCategory}
                    attachedCount={1}
                    onAttach={() => setToast('ถ่ายรูปเพิ่มแล้วค่ะ (จำลอง)')}
                  />
                </div>
              </LiffSheet>
            )}

            {stepId === 'liff-otp' && (
              <LiffSheet
                title="ยืนยันการเซ็นเอกสาร"
                onBack={() => goTo(signingDoc ? 'liff-pending' : 'chat-summary')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => {
                      if (signingDoc) setSignedIds((current) => [...current, signingDoc.id]);
                      pushSignedCard();
                      goTo('chat-signed');
                    }}
                    disabled={otp.some((digit) => !digit)}
                    icon={<PenLine className="h-5 w-5" aria-hidden />}
                  >
                    {otp.every((digit) => digit) ? 'ยืนยันการเซ็น' : 'กรอกรหัสให้ครบ 6 หลัก'}
                  </LiffPrimaryButton>
                }
              >
                <OtpScreen
                  amount={signingDoc ? `${signingDoc.amount.toLocaleString('th-TH')}.00` : '1,250.00'}
                  budgetName={projectName ?? 'งบพัสดุหมวดวิชา'}
                  otp={otp}
                  onOtpChange={setOtp}
                />
              </LiffSheet>
            )}

            {/* ---------- Flow: ส่งเอกสารให้ AI ---------- */}
            {stepId === 'liff-upload-mode' && (
              <LiffSheet
                title="ส่งเอกสารให้ AI"
                step={{ current: 1, total: 3 }}
                onBack={closeLiff}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton onClick={() => goTo('liff-upload-source')}>
                    เลือกแล้ว ไปขั้นต่อไป
                  </LiffPrimaryButton>
                }
              >
                <UploadModeScreen value={mode} onChange={setMode} />
              </LiffSheet>
            )}

            {stepId === 'liff-upload-source' && (
              <LiffSheet
                title={modeConfig.shortTitle}
                step={{ current: 2, total: 3 }}
                onBack={() => goTo('liff-upload-mode')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => goTo('liff-upload-review')}
                    disabled={!canSubmitUpload}
                  >
                    {canSubmitUpload ? 'ไปตรวจทานก่อนส่ง' : 'ยังกรอกไม่ครบ'}
                  </LiffPrimaryButton>
                }
              >
                <UploadSourceScreen
                  mode={mode}
                  source={formatSource}
                  onSourceChange={setFormatSource}
                  templateId={templateId}
                  onTemplateChange={setTemplateId}
                  projectId={projectId}
                  onProjectChange={setProjectId}
                  category={receiptCategory}
                  onCategoryChange={setReceiptCategory}
                  attachedCount={attachedFiles.length}
                  onAttach={(kind) => {
                    setAttachedFiles((current) => [
                      ...current,
                      makeMockFile(kind === 'camera' ? 'รูปถ่ายเอกสาร.jpg' : 'ไฟล์แนบ.pdf'),
                    ]);
                    setToast('แนบไฟล์แล้วค่ะ (จำลอง)');
                  }}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-upload-review' && (
              <LiffSheet
                title="ตรวจทานก่อนส่ง"
                step={{ current: 3, total: 3 }}
                onBack={() => goTo('liff-upload-source')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => void handleSubmitUpload()}
                    loading={createJob.isSubmitting}
                    loadingText={`กำลังส่ง… ${createJob.uploadPercent}%`}
                    icon={<Send className="h-5 w-5" aria-hidden />}
                  >
                    {modeConfig.submitLabel}
                  </LiffPrimaryButton>
                }
              >
                <UploadReviewScreen
                  mode={mode}
                  notes={notes}
                  onNotesChange={setNotes}
                  templateName={usesSavedTemplate ? templateName : undefined}
                  projectName={mode === 'accounting' ? projectName : undefined}
                  categoryName={mode === 'accounting' ? categoryName : undefined}
                  attachedCount={attachedFiles.length}
                />
              </LiffSheet>
            )}

            {/* ---------- Flow: เบิกงบ / ยืมพัสดุ (AI ร่างให้ก่อน) ---------- */}
            {stepId === 'liff-req-tell' && (
              <LiffSheet
                title="เบิกงบ / ยืมพัสดุ"
                onBack={closeLiff}
                onClose={closeLiff}
                footer={
                  <div className="space-y-2">
                    <LiffPrimaryButton
                      onClick={handleDraftRequisition}
                      disabled={!reqDescription.trim()}
                      loading={drafting.isPending}
                      loadingText="AI กำลังร่างใบเบิกให้…"
                      icon={<Sparkles className="h-5 w-5" aria-hidden />}
                    >
                      ให้ AI ร่างใบเบิกให้
                    </LiffPrimaryButton>
                    <button
                      type="button"
                      onClick={() => goTo('liff-req-info')}
                      className="h-11 w-full rounded-btn text-[13px] font-bold text-ink-light"
                    >
                      หรือกรอกเองทีละขั้น
                    </button>
                  </div>
                }
              >
                <AiComposerInputScreen
                  description={reqDescription}
                  onDescriptionChange={setReqDescription}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-req-review' && reqDraft && (
              <LiffSheet
                title="ตรวจใบเบิกที่ AI ร่างให้"
                onBack={() => goTo('liff-req-tell')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => void handleSubmitRequisition()}
                    loading={createRequisition.isPending}
                    loadingText="กำลังส่งใบเบิก…"
                    disabled={!reqPurpose.trim() || reqValidItems.length === 0}
                    icon={<Send className="h-5 w-5" aria-hidden />}
                  >
                    ถูกต้องแล้ว — ส่งให้เซ็น
                  </LiffPrimaryButton>
                }
              >
                <AiComposerReviewScreen
                  draft={reqDraft}
                  purpose={reqPurpose}
                  onPurposeChange={setReqPurpose}
                  projectId={reqProjectId}
                  onProjectChange={setReqProjectId}
                  neededBy={reqNeededBy}
                  onNeededByChange={setReqNeededBy}
                  approverId={reqApproverId}
                  onApproverChange={setReqApproverId}
                  items={reqItems}
                  onItemsChange={setReqItems}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-req-info' && (
              <LiffSheet
                title="เบิกงบ / ยืมพัสดุ"
                step={{ current: 1, total: 3 }}
                onBack={closeLiff}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => goTo('liff-req-items')}
                    disabled={!reqPurpose.trim() || !reqProjectId || !reqNeededBy.trim()}
                  >
                    {reqPurpose.trim() && reqProjectId && reqNeededBy.trim()
                      ? 'ไปกรอกรายการที่ต้องการ'
                      : 'กรอกให้ครบก่อน'}
                  </LiffPrimaryButton>
                }
              >
                <RequisitionInfoScreen
                  kind={reqKind}
                  onKindChange={setReqKind}
                  purpose={reqPurpose}
                  onPurposeChange={setReqPurpose}
                  projectId={reqProjectId}
                  onProjectChange={setReqProjectId}
                  neededBy={reqNeededBy}
                  onNeededByChange={setReqNeededBy}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-req-items' && (
              <LiffSheet
                title="รายการที่ต้องการ"
                step={{ current: 2, total: 3 }}
                onBack={() => goTo('liff-req-info')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => goTo('liff-req-approver')}
                    disabled={reqValidItems.length === 0}
                  >
                    {reqValidItems.length > 0 ? 'ไปเลือกผู้อนุมัติ' : 'ต้องมีอย่างน้อย 1 รายการ'}
                  </LiffPrimaryButton>
                }
              >
                <RequisitionItemsScreen
                  items={reqItems}
                  showPrice={reqKind === 'budget'}
                  onChange={setReqItems}
                  onOpenAi={() => setAiOpen(true)}
                  aiPending={suggest.isPending}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-req-approver' && (
              <LiffSheet
                title="ผู้อนุมัติและตรวจทาน"
                step={{ current: 3, total: 3 }}
                onBack={() => goTo('liff-req-items')}
                onClose={closeLiff}
                footer={
                  <LiffPrimaryButton
                    onClick={() => void handleSubmitRequisition()}
                    disabled={!reqApproverId}
                    loading={createRequisition.isPending}
                    loadingText="กำลังส่งใบเบิก…"
                    icon={<Send className="h-5 w-5" aria-hidden />}
                  >
                    {reqApproverId
                      ? `ส่งให้ ${approvers.data?.find((item) => item.id === reqApproverId)?.name ?? 'ผู้อนุมัติ'} เซ็น`
                      : 'เลือกผู้อนุมัติก่อน'}
                  </LiffPrimaryButton>
                }
              >
                <RequisitionApproverScreen
                  approverId={reqApproverId}
                  onApproverChange={setReqApproverId}
                  summary={{
                    kindLabel: reqKind === 'budget' ? 'เบิกงบซื้อของ' : 'ยืมพัสดุของโรงเรียน',
                    purpose: reqPurpose.trim(),
                    projectName: reqProject?.name ?? '',
                    neededBy: reqNeededBy.trim(),
                    itemCount: reqValidItems.length,
                    total: reqTotal,
                    showPrice: reqKind === 'budget',
                    overBudgetBy,
                  }}
                />
              </LiffSheet>
            )}

            {/* ---------- หน้าที่เปิดได้ตลอด ---------- */}
            {stepId === 'liff-jobs' && (
              <LiffSheet title="งานของฉัน" onBack={closeLiff} onClose={closeLiff}>
                <JobsScreen onToast={setToast} />
              </LiffSheet>
            )}

            {stepId === 'liff-pending' && (
              <LiffSheet title="รอฉันเซ็น" onBack={closeLiff} onClose={closeLiff}>
                <PendingSignScreen
                  signedIds={signedIds}
                  onPick={(doc) => {
                    setSigningDoc(doc);
                    setOtp(['', '', '', '', '', '']);
                    goTo('liff-otp');
                  }}
                />
              </LiffSheet>
            )}

            {stepId === 'liff-howto' && (
              <LiffSheet title="วิธีใช้งาน" onBack={closeLiff} onClose={closeLiff}>
                <HowToScreen />
              </LiffSheet>
            )}

            {stepId === 'liff-portfolio' && (
              <LiffSheet
                title="แฟ้มสะสมงาน ว.PA"
                onBack={closeLiff}
                onClose={closeLiff}
                footer={<LiffPrimaryButton tone="grow">Export PDF ตามแบบ ว.PA</LiffPrimaryButton>}
              >
                <PortfolioScreen />
              </LiffSheet>
            )}

            {/* แผ่น AI ช่วยคิดรายการ — ลอยทับหน้า LIFF อีกชั้น */}
            <AiSuggestSheet
              open={aiOpen}
              description={aiDescription}
              onDescriptionChange={setAiDescription}
              items={suggest.data ?? []}
              selected={aiSelected}
              onToggle={(index) =>
                setAiSelected((current) => {
                  const next = new Set(current);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                })
              }
              onAsk={handleAskAi}
              onAdd={handleAddAiItems}
              onClose={() => {
                setAiOpen(false);
                suggest.reset();
              }}
              pending={suggest.isPending}
              error={suggest.error}
            />

            {toast && (
              <div className="absolute inset-x-4 bottom-24 z-40 animate-slide-up rounded-btn bg-slate-900/90 px-4 py-3 text-center text-[12px] font-medium text-white">
                {toast}
              </div>
            )}
          </PhoneFrame>

          <p className="mt-3 text-center text-sm text-ink-mute">
            แตะเมนูล่างจอได้เหมือนใช้ LINE จริง — ทุกช่องใช้งานได้
          </p>
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
