"use client";

import { FormEvent, useMemo, useState } from "react";

type CoreForm = {
  eventName: string;
  objective: string;
  eventDate: string;
  venue: string;
  durationHours: string;
  students: string;
  parents: string;
  teachers: string;
  guests: string;
  budget: string;
  agenda: string;
};

type Question = {
  id: string;
  label: string;
  reason: string;
  placeholder: string;
  type: "number" | "text";
  suffix?: string;
};

type BudgetItem = {
  availability: "โรงเรียนไม่มี" | "อาจจะมี" | "มีแน่นอน";
  item: string;
  quantity: string;
  reference: string;
  amount: number;
  source: string;
  owner: string;
};

const initialForm: CoreForm = {
  eventName: "กิจกรรมวันแม่แห่งชาติ",
  objective: "จัดพิธีถวายพระพร เปิดโอกาสให้นักเรียนแสดงความกตัญญู และสร้างความสัมพันธ์กับผู้ปกครอง",
  eventDate: "2026-08-12",
  venue: "หอประชุมโรงเรียน",
  durationHours: "3",
  students: "180",
  parents: "90",
  teachers: "25",
  guests: "5",
  budget: "30000",
  agenda: "พิธีถวายพระพร การแสดงของนักเรียน ตัวแทนนักเรียนกล่าวถึงแม่ มอบพวงมาลัย และถ่ายภาพร่วมกัน",
};

const questions: Question[] = [
  {
    id: "performances",
    label: "มีการแสดงบนเวทีกี่ชุด และแต่ละชุดใช้เวลาประมาณกี่นาที?",
    reason: "ใช้ประเมินเวลาเวที ทีมควบคุมเสียง และอุปกรณ์ที่ต้องเตรียม",
    placeholder: "เช่น 5 ชุด ชุดละประมาณ 8 นาที",
    type: "text",
  },
  {
    id: "audio",
    label: "กรุณาอธิบายเครื่องเสียงและอุปกรณ์ภาพที่โรงเรียนมีอยู่ พร้อมสภาพการใช้งาน",
    reason: "ช่วยแยกของที่มีแน่นอน อาจจะมี และของที่ต้องเช่าหรือซื้อ",
    placeholder: "เช่น มีเครื่องเสียง 1 ชุด ไมค์ไร้สาย 2 ตัว ยังไม่ได้ทดสอบ โปรเจกเตอร์พร้อมใช้",
    type: "text",
  },
  {
    id: "snacks",
    label: "ต้องเตรียมอาหารว่างจริงทั้งหมดกี่ชุด?",
    reason: "AI จะใช้ตัวเลขนี้คำนวณงบอาหารโดยตรง",
    placeholder: "300",
    type: "number",
    suffix: "ชุด",
  },
  {
    id: "foodNeeds",
    label: "มีข้อจำกัดด้านอาหารหรือความต้องการพิเศษอะไรบ้าง?",
    reason: "ใช้เพิ่มอาหารทางเลือกและป้องกันการตกหล่นของผู้เข้าร่วม",
    placeholder: "เช่น มังสวิรัติ 8 ชุด แพ้นม 3 ชุด หรือพิมพ์ว่า ไม่มี",
    type: "text",
  },
  {
    id: "elderly",
    label: "คาดว่าจะมีผู้สูงอายุหรือผู้ใช้รถเข็นกี่คน?",
    reason: "ใช้ตรวจจำนวนที่นั่งพิเศษ ทางเข้า และจุดปฐมพยาบาล",
    placeholder: "40",
    type: "number",
    suffix: "คน",
  },
  {
    id: "accessibility",
    label: "สถานที่มีทางลาด จุดพัก และทางออกฉุกเฉินพร้อมหรือไม่? อธิบายสิ่งที่ยังขาด",
    reason: "ช่วยให้รายการด้านสถานที่และความปลอดภัยครบถ้วน",
    placeholder: "เช่น มีทางลาดและทางออกฉุกเฉิน แต่ต้องเพิ่มเก้าอี้บริเวณทางเข้า 12 ตัว",
    type: "text",
  },
  {
    id: "decoration",
    label: "ต้องการรูปแบบเวที ฉากหลัง และการตกแต่งระดับใด?",
    reason: "ใช้กำหนดปริมาณวัสดุและแยกสิ่งที่โรงเรียนทำเองได้",
    placeholder: "เช่น เวทีแบบมาตรฐาน ใช้โครงฉากเดิมของโรงเรียน ซื้อเฉพาะดอกไม้และงานพิมพ์",
    type: "text",
  },
];

const money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

function answerQuality(value: string, type: Question["type"]) {
  const clean = value.trim();
  if (!clean) return 0;
  if (type === "number") return Number(clean) >= 0 ? 1 : 0;
  if (/ไม่รู้|ไม่แน่ใจ|ยังไม่ทราบ|ยังไม่สรุป/.test(clean)) return 0.35;
  if (clean.length < 8) return 0.6;
  return 1;
}

export default function App() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [form, setForm] = useState<CoreForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extraContext, setExtraContext] = useState("");

  const attendees = [form.students, form.parents, form.teachers, form.guests]
    .map((value) => Number(value) || 0)
    .reduce((sum, value) => sum + value, 0);

  const answeredQuestions = questions.slice(0, questionIndex);
  const qualityPoints = answeredQuestions.reduce(
    (sum, question) => sum + answerQuality(answers[question.id] || "", question.type),
    0,
  );
  const extraBoost = extraContext.trim().length >= 12 ? 4 : 0;
  const confidence = Math.min(94, Math.round(50 + qualityPoints * 6 + extraBoost));
  const ready = confidence >= 85;

  const dimensions = {
    coverage: Math.min(96, Math.round(58 + qualityPoints * 5)),
    people: Math.min(98, 72 + (answers.snacks ? 14 : 0) + (answers.elderly ? 8 : 0)),
    prices: Math.min(66, 26 + answeredQuestions.length * 4),
    assets: Math.min(92, 30 + (answers.audio ? answerQuality(answers.audio, "text") * 50 : 0)),
  };

  const budgetItems = useMemo<BudgetItem[]>(() => {
    const snackCount = Math.max(0, Number(answers.snacks) || attendees);
    const audioText = (answers.audio || "").toLowerCase();
    const hasAudio = audioText.includes("มีเครื่องเสียง") && !audioText.includes("ไม่มีเครื่องเสียง");
    const hasProjector = audioText.includes("โปรเจกเตอร์") && !audioText.includes("ไม่มีโปรเจกเตอร์");
    const needsExtraChairs = Number(answers.elderly || 0) > 0;

    return [
      {
        availability: "โรงเรียนไม่มี",
        item: "อาหารว่าง",
        quantity: `${money.format(snackCount)} ชุด`,
        reference: "35 บาท/ชุด",
        amount: snackCount * 35,
        source: "ราคา AI เบื้องต้น • ต้องแนบใบเสนอราคา",
        owner: "ฝ่ายโภชนาการ",
      },
      {
        availability: "โรงเรียนไม่มี",
        item: "น้ำดื่ม",
        quantity: `${money.format(attendees)} ขวด`,
        reference: "8 บาท/ขวด",
        amount: attendees * 8,
        source: "ราคา AI เบื้องต้น • ต้องแนบใบเสนอราคา",
        owner: "ฝ่ายพัสดุ",
      },
      {
        availability: "โรงเรียนไม่มี",
        item: "พวงมาลัยสำหรับตัวแทนแม่",
        quantity: "10 พวง",
        reference: "250 บาท/พวง",
        amount: 2500,
        source: "ราคา AI เบื้องต้น • ต้องสำรวจร้านค้า",
        owner: "ฝ่ายพิธีการ",
      },
      {
        availability: "อาจจะมี",
        item: "วัสดุตกแต่งเวทีและฉากหลัง",
        quantity: "1 งาน",
        reference: "4,500 บาท/งาน",
        amount: 4500,
        source: "รอตรวจคลังและเปรียบเทียบราคา",
        owner: "ฝ่ายอาคารสถานที่",
      },
      {
        availability: hasAudio ? "มีแน่นอน" : "อาจจะมี",
        item: "ชุดเครื่องเสียงและไมโครโฟน",
        quantity: "1 ชุด",
        reference: "ค่าเช่าทดแทน 8,500 บาท",
        amount: hasAudio ? 0 : 8500,
        source: hasAudio ? "ข้อมูลผู้ใช้ • รอทดสอบก่อนวันงาน" : "รอฝ่ายโสตฯ ตรวจสอบ",
        owner: "ฝ่ายโสตทัศนูปกรณ์",
      },
      {
        availability: hasProjector ? "มีแน่นอน" : "อาจจะมี",
        item: "โปรเจกเตอร์และจอภาพ",
        quantity: "1 ชุด",
        reference: "ค่าเช่าทดแทน 4,000 บาท",
        amount: hasProjector ? 0 : 4000,
        source: hasProjector ? "ข้อมูลผู้ใช้ • รอยืนยันสภาพ" : "รอฝ่ายโสตฯ ตรวจสอบ",
        owner: "ฝ่ายโสตทัศนูปกรณ์",
      },
      {
        availability: "อาจจะมี",
        item: needsExtraChairs ? "ที่นั่งสำรองสำหรับผู้สูงอายุ" : "โต๊ะและเก้าอี้",
        quantity: needsExtraChairs ? `${money.format(Number(answers.elderly))} ที่นั่ง` : `${money.format(attendees)} ที่นั่ง`,
        reference: "ค่าเช่าทดแทน 20 บาท/ที่นั่ง",
        amount: 0,
        source: "รอตรวจจำนวนในคลัง",
        owner: "ฝ่ายอาคารสถานที่",
      },
      {
        availability: "อาจจะมี",
        item: "ชุดปฐมพยาบาลประจำจุด",
        quantity: "1 ชุด",
        reference: "1,000 บาท/ชุด",
        amount: 1000,
        source: "รอตรวจของคงเหลือห้องพยาบาล",
        owner: "ครูพยาบาล",
      },
    ];
  }, [answers, attendees]);

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const budgetLimit = Number(form.budget) || 0;

  function updateForm(field: keyof CoreForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitCore(event: FormEvent) {
    event.preventDefault();
    if (!form.eventName.trim() || !form.objective.trim() || !form.eventDate || !form.venue.trim() || attendees <= 0 || Number(form.budget) <= 0) {
      setFormError("กรุณากรอกชื่อกิจกรรม วัตถุประสงค์ วันจัดงาน สถานที่ จำนวนผู้เข้าร่วม และวงเงินให้ครบ");
      return;
    }
    setFormError("");
    setStage(1);
  }

  function submitAnswer(event: FormEvent) {
    event.preventDefault();
    const question = questions[questionIndex];
    if (!question) return;
    if (!draftAnswer.trim() || (question.type === "number" && Number(draftAnswer) < 0)) return;
    setAnswers((current) => ({ ...current, [question.id]: draftAnswer.trim() }));
    setDraftAnswer("");
    setQuestionIndex((current) => current + 1);
  }

  function resetAll() {
    setStage(0);
    setForm(initialForm);
    setFormError("");
    setQuestionIndex(0);
    setDraftAnswer("");
    setAnswers({});
    setExtraContext("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">SB</div>
        <div className="brand-copy">
          <strong>School Budget AI</strong>
          <span>ผู้ช่วยวางงบกิจกรรมโรงเรียน</span>
        </div>
        <div className="event-draft">ร่างกิจกรรม • บันทึกอัตโนมัติ</div>
      </header>

      <nav className="stepper" aria-label="ขั้นตอนการสร้างงบ">
        {[
          ["1", "ข้อมูลสำคัญ"],
          ["2", "AI ถามเพิ่มเติม"],
          ["3", "ตรวจรายการงบ"],
          ["4", "ส่งผู้รับผิดชอบ"],
        ].map(([number, label], index) => {
          const active = (stage === 0 && index === 0) || (stage === 1 && index === 1) || (stage === 2 && index === 2);
          const done = index < stage;
          return (
            <div className={`step ${active ? "active" : ""} ${done ? "done" : ""}`} key={label}>
              <span>{done ? "✓" : number}</span>{label}
            </div>
          );
        })}
      </nav>

      {stage === 0 && (
        <section className="form-page">
          <div className="page-heading">
            <p className="eyebrow">ขั้นตอนที่ 1 จาก 4</p>
            <h1>เริ่มจากข้อมูลที่จำเป็น</h1>
            <p>ข้อมูลชุดแรกใช้กำหนดขอบเขตงาน จากนั้น AI จะถามเฉพาะสิ่งที่ยังไม่ชัดเจน</p>
          </div>
          <form className="core-form" onSubmit={submitCore}>
            <div className="wide-field">
              <label htmlFor="eventName">ชื่อกิจกรรม</label>
              <input id="eventName" value={form.eventName} onChange={(event) => updateForm("eventName", event.target.value)} />
            </div>
            <div className="wide-field">
              <label htmlFor="objective">วัตถุประสงค์</label>
              <textarea id="objective" rows={3} value={form.objective} onChange={(event) => updateForm("objective", event.target.value)} />
            </div>
            <div>
              <label htmlFor="eventDate">วันที่จัดงาน</label>
              <input id="eventDate" type="date" value={form.eventDate} onChange={(event) => updateForm("eventDate", event.target.value)} />
            </div>
            <div>
              <label htmlFor="venue">สถานที่</label>
              <input id="venue" value={form.venue} onChange={(event) => updateForm("venue", event.target.value)} />
            </div>
            <div>
              <label htmlFor="duration">ระยะเวลางาน</label>
              <div className="input-unit"><input id="duration" type="number" min="1" value={form.durationHours} onChange={(event) => updateForm("durationHours", event.target.value)} /><span>ชั่วโมง</span></div>
            </div>
            <div>
              <label htmlFor="budget">วงเงินสูงสุด</label>
              <div className="input-unit"><input id="budget" type="number" min="1" value={form.budget} onChange={(event) => updateForm("budget", event.target.value)} /><span>บาท</span></div>
            </div>
            <fieldset className="wide-field people-fields">
              <legend>จำนวนผู้เข้าร่วม</legend>
              <div className="people-grid">
                {([
                  ["students", "นักเรียน"],
                  ["parents", "ผู้ปกครอง"],
                  ["teachers", "ครู/บุคลากร"],
                  ["guests", "แขกรับเชิญ"],
                ] as [keyof CoreForm, string][]).map(([field, label]) => (
                  <div key={field}>
                    <label htmlFor={field}>{label}</label>
                    <div className="input-unit"><input id={field} type="number" min="0" value={form[field]} onChange={(event) => updateForm(field, event.target.value)} /><span>คน</span></div>
                  </div>
                ))}
              </div>
              <p className="field-note">รวม {money.format(attendees)} คน</p>
            </fieldset>
            <div className="wide-field">
              <label htmlFor="agenda">กำหนดการหรือกิจกรรมสำคัญ</label>
              <textarea id="agenda" rows={4} value={form.agenda} onChange={(event) => updateForm("agenda", event.target.value)} />
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions wide-field">
              <button className="primary-button" type="submit">ให้ AI วิเคราะห์ข้อมูล <span aria-hidden="true">→</span></button>
            </div>
          </form>
        </section>
      )}

      {stage === 1 && (
        <div className="workspace-layout">
          <section className="conversation-panel">
            <div className="conversation-heading">
              <div>
                <p className="eyebrow">ขั้นตอนที่ 2 จาก 4</p>
                <h1>AI กำลังเก็บรายละเอียด</h1>
                <p>ตอบเป็นข้อความหรือตัวเลขจริง ระบบจะใช้คำตอบสร้างรายการและคำนวณงบ</p>
              </div>
              <div className="question-progress">{Math.min(questionIndex + 1, questions.length)} / {questions.length}</div>
            </div>

            <div className="context-strip">
              <span>{form.eventName}</span><span>{money.format(attendees)} คน</span><span>{form.venue}</span><span>วงเงิน {money.format(budgetLimit)} บาท</span>
            </div>

            <div className="chat-log" aria-live="polite">
              {answeredQuestions.map((question) => (
                <div className="history-pair" key={question.id}>
                  <div className="ai-message compact"><div className="ai-avatar">AI</div><p>{question.label}</p></div>
                  <div className="user-message"><span>คุณ</span><p>{answers[question.id]}</p></div>
                </div>
              ))}

              {questionIndex < questions.length ? (
                <div className="current-question">
                  <div className="ai-message">
                    <div className="ai-avatar">AI</div>
                    <div><h2>{questions[questionIndex].label}</h2><p className="question-reason">เหตุผลที่ถาม: {questions[questionIndex].reason}</p></div>
                  </div>
                  <form className="answer-form" onSubmit={submitAnswer}>
                    <label htmlFor="dynamic-answer">คำตอบของคุณ</label>
                    {questions[questionIndex].type === "number" ? (
                      <div className="input-unit large-input"><input id="dynamic-answer" autoFocus type="number" min="0" inputMode="numeric" placeholder={questions[questionIndex].placeholder} value={draftAnswer} onChange={(event) => setDraftAnswer(event.target.value)} /><span>{questions[questionIndex].suffix}</span></div>
                    ) : (
                      <textarea id="dynamic-answer" autoFocus rows={4} placeholder={questions[questionIndex].placeholder} value={draftAnswer} onChange={(event) => setDraftAnswer(event.target.value)} />
                    )}
                    <div className="answer-actions"><span>ยิ่งระบุจำนวนและสภาพจริง ความมั่นใจยิ่งสูงขึ้น</span><button className="primary-button" type="submit" disabled={!draftAnswer.trim()}>ส่งคำตอบ <span aria-hidden="true">→</span></button></div>
                  </form>
                </div>
              ) : (
                <div className={`readiness-box ${ready ? "ready" : "needs-more"}`}>
                  <div className="readiness-icon" aria-hidden="true">{ready ? "✓" : "!"}</div>
                  <div>
                    <h2>{ready ? "ข้อมูลเพียงพอสำหรับสร้างรายการเบื้องต้น" : "AI ยังพบความไม่แน่นอนบางส่วน"}</h2>
                    <p>{ready ? "ระบบจะสร้างรายการพร้อมสมมติฐาน และส่งทุกชิ้นให้ผู้รับผิดชอบตรวจสอบ" : "คุณสามารถเพิ่มรายละเอียด หรือสร้างร่างที่มีคำเตือนไว้ก่อน"}</p>
                  </div>
                  {!ready && (
                    <div className="extra-context">
                      <label htmlFor="extraContext">รายละเอียดเพิ่มเติม</label>
                      <textarea id="extraContext" rows={3} placeholder="อธิบายข้อมูลที่ก่อนหน้านี้ยังไม่ทราบ เช่น อุปกรณ์ที่มี หรือจำนวนที่ยืนยันแล้ว" value={extraContext} onChange={(event) => setExtraContext(event.target.value)} />
                    </div>
                  )}
                  <div className="readiness-actions">
                    <button className="secondary-button" type="button" onClick={() => { setQuestionIndex(Math.max(0, questions.length - 1)); }}>กลับไปแก้คำตอบ</button>
                    <button className="primary-button" type="button" onClick={() => setStage(2)}>{ready ? "สร้างรายการงบ" : "สร้างร่างพร้อมคำเตือน"} <span aria-hidden="true">→</span></button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <ConfidencePanel confidence={confidence} dimensions={dimensions} ready={ready} pending={questions.slice(questionIndex).map((question) => question.label)} />
        </div>
      )}

      {stage === 2 && (
        <div className="budget-page">
          <section className="budget-main">
            <div className="budget-heading">
              <div><p className="eyebrow">ขั้นตอนที่ 3 จาก 4</p><h1>รายการงบประมาณเบื้องต้น</h1><p>ราคา AI เป็นเพียงจุดเริ่มต้น ทุกรายการต้องมีหลักฐานและผู้รับผิดชอบยืนยัน</p></div>
              <button className="secondary-button" type="button" onClick={() => setStage(1)}>กลับไปแก้คำตอบ</button>
            </div>
            <div className="budget-stats">
              <div><span>งบตั้งต้น</span><strong>{money.format(totalBudget)} บาท</strong></div>
              <div><span>วงเงินสูงสุด</span><strong>{money.format(budgetLimit)} บาท</strong></div>
              <div className={budgetLimit - totalBudget < 0 ? "over" : ""}><span>{budgetLimit - totalBudget >= 0 ? "งบคงเหลือ" : "เกินวงเงิน"}</span><strong>{money.format(Math.abs(budgetLimit - totalBudget))} บาท</strong></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>ประเภท</th><th>รายการ</th><th>จำนวน</th><th>ราคาอ้างอิง</th><th>รวม</th><th>ผู้ตรวจสอบ</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {budgetItems.map((item) => (
                    <tr key={item.item}>
                      <td><span className={`availability ${item.availability === "โรงเรียนไม่มี" ? "missing" : item.availability === "มีแน่นอน" ? "available" : "maybe"}`}>{item.availability}</span></td>
                      <td><strong>{item.item}</strong><small>{item.source}</small></td>
                      <td>{item.quantity}</td><td>{item.reference}</td><td className="money-cell">{money.format(item.amount)} บาท</td><td>{item.owner}</td><td><span className="review-status">รอตรวจสอบ</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="budget-actions"><button className="secondary-button" type="button" onClick={resetAll}>เริ่มกิจกรรมใหม่</button><button className="primary-button" type="button" disabled>ส่งให้ผู้รับผิดชอบตรวจสอบ</button></div>
          </section>
          <ConfidencePanel confidence={confidence} dimensions={dimensions} ready={ready} pending={["ตรวจทรัพย์สินกับแต่ละฝ่าย", "แนบใบเสนอราคา", "ตรวจหมวดงบและระเบียบ"]} />
        </div>
      )}
    </main>
  );
}

function ConfidencePanel({
  confidence,
  dimensions,
  ready,
  pending,
}: {
  confidence: number;
  dimensions: { coverage: number; people: number; prices: number; assets: number };
  ready: boolean;
  pending: string[];
}) {
  const rows = [
    ["รายการครอบคลุม", dimensions.coverage],
    ["จำนวนผู้เข้าร่วม", dimensions.people],
    ["ราคาอ้างอิง", dimensions.prices],
    ["ของที่โรงเรียนมี", dimensions.assets],
  ] as const;
  return (
    <aside className="confidence-panel" aria-label="ระดับความมั่นใจของ AI">
      <div className="confidence-title"><span>ความมั่นใจของ AI</span><span className={ready ? "confidence-ready" : "confidence-wait"}>{ready ? "พร้อมสร้างร่าง" : "กำลังเก็บข้อมูล"}</span></div>
      <strong className="confidence-score">{confidence}%</strong>
      <div className="confidence-track"><span style={{ width: `${confidence}%` }} /></div>
      <p className="confidence-caption">วัดจากความครบถ้วนและความชัดเจนของข้อมูล ไม่ใช่การอนุมัติราคา</p>
      <div className="dimension-list">
        {rows.map(([label, value]) => (
          <div className="dimension" key={label}>
            <div><span>{label}</span><strong>{Math.round(value)}%</strong></div>
            <div className="dimension-track"><span style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="pending-list">
        <h2>{pending.length ? "สิ่งที่ยังต้องยืนยัน" : "ข้อมูลสำหรับสร้างร่างครบแล้ว"}</h2>
        {pending.length > 0 && <ul>{pending.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>}
      </div>
      <div className="human-note"><span aria-hidden="true">◉</span><p><strong>คนเป็นผู้ตัดสินใจสุดท้าย</strong>สินค้า ราคา และระเบียบทุกข้อจะยังไม่ผ่านจนกว่าผู้รับผิดชอบจะยืนยัน</p></div>
    </aside>
  );
}
