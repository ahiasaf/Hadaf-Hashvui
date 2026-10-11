let pending;
window.DF_LOAD_PDF = () => {
  pending ||= import("./vendor/pdfjs/pdf.min.mjs").then((pdfjsLib) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdfjs/pdf.worker.min.mjs";
    window.pdfjsLib = pdfjsLib;
  }).catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
};
window.dispatchEvent(new Event("pdf-loader-ready"));
