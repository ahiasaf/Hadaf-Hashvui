/* pdf.js מצורף ולא נטען מרשת חיצונית. נטען כמודול כי זו הצורה
     שבה הוא מפורסם, ומגושר ל-window כדי שהקוד הרגיל שלמטה ישתמש בו. */
  import * as pdfjsLib from './vendor/pdfjs/pdf.min.mjs';
  pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.min.mjs';
  window.pdfjsLib = pdfjsLib;
  window.dispatchEvent(new Event('pdfjs-ready'));
