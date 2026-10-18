import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ExtractedQuestion, PDFImportSession, Question } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

// Generate authentic sample RRB JE CBT-1 PDF with answer key and difficult formatting
export async function generateSampleRRBJEPdf(): Promise<{ bytes: Uint8Array; base64: string; blob: Blob }> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // --- PAGE 1: Exam Header & Mathematics / Reasoning Questions ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 30,
    y: height - 80,
    width: width - 60,
    height: 50,
    color: rgb(0.04, 0.1, 0.17), // #0B192C
  });

  page1.drawText('GOVERNMENT OF INDIA - MINISTRY OF RAILWAYS', {
    x: 45,
    y: height - 50,
    size: 11,
    font: fontBold,
    color: rgb(1, 0.8, 0.2), // Amber
  });

  page1.drawText('RAILWAY RECRUITMENT BOARDS (RRB) - CEN 03/2018 (JUNIOR ENGINEER)', {
    x: 45,
    y: height - 68,
    size: 9,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  let y = height - 105;

  const drawQuestion = (
    page: any,
    qNum: string,
    subject: string,
    text: string,
    options: string[],
    source: string
  ) => {
    page.drawText(`Question ${qNum} [${subject}]`, {
      x: 35,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.07, 0.24, 0.38),
    });
    page.drawText(source, {
      x: width - 200,
      y,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 16;

    // Wrap question text
    page.drawText(text, {
      x: 35,
      y,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 70,
      lineHeight: 13,
    });
    y -= 30;

    // 4 Options
    const optLabels = ['(A)', '(B)', '(C)', '(D)'];
    options.forEach((opt, idx) => {
      page.drawText(`${optLabels[idx]} ${opt}`, {
        x: 45 + (idx % 2) * 250,
        y: y - Math.floor(idx / 2) * 16,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
    y -= 42;
  };

  // Q1
  drawQuestion(
    page1,
    '1',
    'Mathematics - Time and Work',
    'A can complete a piece of railway maintenance work in 12 days, and B can complete the same work in 15 days. If they work together, in how many days will the work be finished?',
    ['6.67 days', '7 days', '8 days', '9.5 days'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  // Q2
  drawQuestion(
    page1,
    '2',
    'Mathematics - Compound Interest',
    'A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times of itself at the same rate of interest?',
    ['8 years', '12 years', '16 years', '24 years'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  // Q3
  drawQuestion(
    page1,
    '3',
    'Mathematics - Speed & Distance',
    'A train 180 m long is running at a speed of 54 km/h. How much time will it take to cross an electric pole standing beside the railway track?',
    ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  // Q4
  drawQuestion(
    page1,
    '4',
    'General Intelligence & Reasoning - Syllogism',
    'Statements: 1. All engines are vehicles. 2. Some vehicles are electric. Conclusions: I. Some engines are electric. II. Some vehicles are engines.',
    ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  page1.drawText('Page 1 of 3 | RRB JE CBT-1 Question Paper', {
    x: width / 2 - 80,
    y: 25,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- PAGE 2: Difficult Formatting, Tables, & General Science ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  y = height - 50;

  page2.drawText('SECTION B: GENERAL SCIENCE & TECHNICAL CONCEPTS', {
    x: 35,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.04, 0.1, 0.17),
  });
  y -= 30;

  // Q5 with Technical Electrical Table & Diagram Reference
  page2.drawText('Question 5 [General Science - Physics & Ohm\'s Law]', {
    x: 35,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.07, 0.24, 0.38),
  });
  y -= 16;

  page2.drawText(
    'An electric locomotive circuit shown in Fig 5.1 has voltage V = 220 V and draws current I = 5 A. Refer to the electrical observation table below and determine resistance R:',
    {
      x: 35,
      y,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 70,
      lineHeight: 13,
    }
  );
  y -= 30;

  // Draw table box
  page2.drawRectangle({
    x: 45,
    y: y - 35,
    width: 480,
    height: 40,
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
    color: rgb(0.96, 0.96, 0.96),
  });

  page2.drawText('Parameter: Potential Difference (V) = 220 Volts | Current (I) = 5.0 Amperes | Circuit: DC Traction Motor', {
    x: 55,
    y: y - 18,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page2.drawText('Formula to apply: Ohm\'s Law V = I * R  =>  R = V / I [Schematic reference: Circuit Fig 5.1]', {
    x: 55,
    y: y - 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 52;

  // Options for Q5
  page2.drawText('(A) 22 Ohms    (B) 35 Ohms    (C) 44 Ohms    (D) 55 Ohms', {
    x: 45,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 35;

  // Q6: Chemistry with Formulas
  drawQuestion(
    page2,
    '6',
    'General Science - Chemistry',
    'What is the chemical formula of Plaster of Paris (POP) obtained by heating Gypsum (CaSO4 . 2H2O) to 373 K?',
    ['CaSO4 . 2H2O', 'CaSO4 . 1/2 H2O', 'CaCO3 . H2O', 'CaO . 1/2 H2O'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  // Q7: General Awareness
  drawQuestion(
    page2,
    '7',
    'General Awareness - Railways Heritage',
    'In which year was the first passenger train operated in India between Bori Bunder (Bombay) and Thane?',
    ['1848', '1853', '1857', '1869'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  // Q8: Biology
  drawQuestion(
    page2,
    '8',
    'General Science - Biology',
    'Which chamber of the human heart pumps oxygenated blood into the aorta for systemic circulation?',
    ['Right Atrium', 'Right Ventricle', 'Left Atrium', 'Left Ventricle'],
    'Source: RRB JE 27-05-2019 Shift 1'
  );

  page2.drawText('Page 2 of 3 | RRB JE CBT-1 Question Paper', {
    x: width / 2 - 80,
    y: 25,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- PAGE 3: Official Answer Key & Solutions ---
  const page3 = pdfDoc.addPage([595.28, 841.89]);
  y = height - 50;

  page3.drawText('OFFICIAL ANSWER KEY & STEP-BY-STEP EXPLANATIONS', {
    x: 35,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.04, 0.1, 0.17),
  });
  y -= 25;

  page3.drawText('Railway Recruitment Board (RRB) CEN 03/2018 CBT-1 Official Key', {
    x: 35,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  // Answer Key Table
  page3.drawRectangle({
    x: 35,
    y: y - 55,
    width: 520,
    height: 60,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
    color: rgb(0.93, 0.95, 0.98),
  });

  page3.drawText('MASTER ANSWER KEY TABLE:', {
    x: 45,
    y: y - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page3.drawText('Q1: Option B (6.67 days)   | Q2: Option B (12 years)    | Q3: Option B (12 seconds)  | Q4: Option B (Only II follows)', {
    x: 45,
    y: y - 32,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.05, 0.2, 0.4),
  });

  page3.drawText('Q5: Option C (44 Ohms)      | Q6: Option B (CaSO4.1/2H2O)| Q7: Option B (1853)        | Q8: Option D (Left Ventricle)', {
    x: 45,
    y: y - 48,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.05, 0.2, 0.4),
  });
  y -= 80;

  page3.drawText('DETAILED VERIFIED SOLUTIONS & RATIONALE:', {
    x: 35,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.07, 0.24, 0.38),
  });
  y -= 20;

  const solutions = [
    'Sol 1: Combined rate = 1/12 + 1/15 = 9/60 = 3/20. Days = 20/3 = 6.67 days. Confirmed verified.',
    'Sol 2: Sum doubles in 4 years. 8 times = 2^3 times. Time = 4 * 3 = 12 years. Confirmed verified.',
    'Sol 3: Speed = 54 * (5/18) = 15 m/s. Time = 180 / 15 = 12 seconds. Confirmed verified.',
    'Sol 4: All engines are vehicles => Some vehicles are engines (Conversion valid). Only conclusion II follows.',
    'Sol 5: R = V / I = 220 V / 5 A = 44 Ohms. Note: Circuit diagram reference Fig 5.1 flags diagram presence.',
    'Sol 6: POP is calcium sulphate hemihydrate CaSO4 . 1/2 H2O. Confirmed verified.',
    'Sol 7: First train ran on 16 April 1853 between Bori Bunder and Thane (34 km). Confirmed verified.',
    'Sol 8: Left ventricle has thick myocardium to pump oxygenated blood into aorta. Confirmed verified.',
  ];

  solutions.forEach(sol => {
    page3.drawText(sol, {
      x: 35,
      y,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: width - 70,
      lineHeight: 12,
    });
    y -= 26;
  });

  page3.drawText('Page 3 of 3 | RRB JE CBT-1 Answer Key & Solutions', {
    x: width / 2 - 80,
    y: 25,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  let binary = '';
  for (let i = 0; i < pdfBytes.length; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  const base64 = btoa(binary);
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

  return { bytes: pdfBytes, base64, blob };
}

// Split PDF into manageable batches of pages
export async function splitPdfIntoPageBatches(
  pdfBuffer: ArrayBuffer | ArrayBufferLike | Uint8Array,
  pagesPerBatch: number = 2
): Promise<{ batchBase64: string; startPage: number; endPage: number }[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer as any, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const batches: { batchBase64: string; startPage: number; endPage: number }[] = [];

  for (let i = 0; i < totalPages; i += pagesPerBatch) {
    const subDoc = await PDFDocument.create();
    const pageIndices = [];
    for (let j = i; j < Math.min(i + pagesPerBatch, totalPages); j++) {
      pageIndices.push(j);
    }

    const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(p => subDoc.addPage(p));

    const subBytes = await subDoc.save();
    let binary = '';
    for (let k = 0; k < subBytes.length; k++) {
      binary += String.fromCharCode(subBytes[k]);
    }
    const batchBase64 = btoa(binary);

    batches.push({
      batchBase64,
      startPage: i + 1,
      endPage: Math.min(i + pagesPerBatch, totalPages),
    });
  }

  return batches;
}

// Call backend API for extracting a PDF batch
export async function extractBatchViaApi(params: {
  pdfBase64: string;
  pageRange: { startPage: number; endPage: number; totalPages: number };
  filename: string;
  adminEmail?: string;
  isAdminSimulated?: boolean;
}): Promise<{ success: boolean; questions: ExtractedQuestion[]; error?: string }> {
  try {
    const response = await fetch('/api/extract-pdf-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': params.adminEmail || 'admin@railwayjeprep.internal',
        'x-admin-role': 'admin',
      },
      body: JSON.stringify({
        pdfBase64: params.pdfBase64,
        pageRange: params.pageRange,
        filename: params.filename,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        questions: [],
        error: data.error || `Server responded with HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      questions: data.questions || [],
    };
  } catch (err: any) {
    return {
      success: false,
      questions: [],
      error: err.message || 'Network error calling PDF extraction endpoint.',
    };
  }
}

// Check for duplicates against existing question bank
export function detectDuplicates(
  extractedList: ExtractedQuestion[],
  existingQuestions: Question[]
): ExtractedQuestion[] {
  return extractedList.map(item => {
    const normalizedItem = item.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');

    const found = existingQuestions.find(existing => {
      const normalizedExisting = existing.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedItem.length > 20 && normalizedExisting.includes(normalizedItem.substring(0, 30))) {
        return true;
      }
      return false;
    });

    if (found) {
      return {
        ...item,
        isDuplicate: true,
        duplicateOfId: found.id,
        verificationNotes: `${item.verificationNotes ? item.verificationNotes + ' • ' : ''}Potential duplicate of Question Q${found.questionNumber} in existing test "${found.testId}".`,
      };
    }
    return item;
  });
}

// Export Extracted Questions to JSON
export function exportExtractedToJson(questions: ExtractedQuestion[], filename = 'rrb_je_extracted_questions.json') {
  const exportData = questions.map(q => ({
    questionText: q.questionText,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    examPriority: q.examPriority,
    verificationStatus: q.verificationStatus,
    verificationNotes: q.verificationNotes,
    isPYQ: q.isPYQ,
    sourceTag: q.shift ? `${q.examYear || ''} ${q.shift}` : q.sourceFilename || 'Extracted PDF',
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// Export Extracted Questions to CSV
export function exportExtractedToCsv(questions: ExtractedQuestion[], filename = 'rrb_je_extracted_questions.csv') {
  const headers = [
    'Subject',
    'Topic',
    'Difficulty',
    'QuestionText',
    'OptionA',
    'OptionB',
    'OptionC',
    'OptionD',
    'CorrectOptionIndex',
    'Explanation',
    'VerificationStatus',
    'ExamPriority',
    'IsPYQ',
    'SourceTag',
  ];

  const escapeCsv = (str: any) => {
    const s = String(str ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = questions.map(q => [
    escapeCsv(q.subject),
    escapeCsv(q.topic),
    escapeCsv(q.difficulty),
    escapeCsv(q.questionText),
    escapeCsv(q.options[0] || ''),
    escapeCsv(q.options[1] || ''),
    escapeCsv(q.options[2] || ''),
    escapeCsv(q.options[3] || ''),
    q.correctOptionIndex,
    escapeCsv(q.explanation),
    escapeCsv(q.verificationStatus),
    escapeCsv(q.examPriority),
    q.isPYQ,
    escapeCsv(q.shift ? `${q.examYear || ''} ${q.shift}` : q.sourceFilename || 'Extracted PDF'),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// Save Session to Firestore (for resuming interrupted processing)
export async function savePDFSessionToFirestore(session: PDFImportSession, userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'pdfImportSessions', session.id);
    await setDoc(docRef, {
      id: session.id,
      filename: session.filename,
      fileSize: session.fileSize,
      totalPages: session.totalPages,
      processedPages: session.processedPages,
      failedPages: session.failedPages,
      status: session.status,
      createdBy: userId,
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not persist session to Firestore, using local cache:', error);
  }

  // Also persist in localStorage for instant offline access
  localStorage.setItem(`pdf_session_${session.id}`, JSON.stringify(session));
}

// Load Sessions
export async function getSavedPDFSessions(): Promise<PDFImportSession[]> {
  try {
    const snap = await getDocs(collection(db, 'pdfImportSessions'));
    const list: PDFImportSession[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      const cached = localStorage.getItem(`pdf_session_${data.id}`);
      if (cached) {
        list.push(JSON.parse(cached));
      } else {
        list.push({
          ...data,
          extractedQuestions: [],
        });
      }
    });
    return list;
  } catch (err) {
    // Fallback to local storage
    const list: PDFImportSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pdf_session_')) {
        const val = localStorage.getItem(key);
        if (val) list.push(JSON.parse(val));
      }
    }
    return list;
  }
}
