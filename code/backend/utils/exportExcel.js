// Utility function to export all statistics data to Excel using ExcelJS
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportAllStatsToExcel = async (allData) => {
  const workbook = new ExcelJS.Workbook();
  const theme = {
    headerBg: 'FF1A4D2E',
    headerText: 'FFFFFFFF',
    titleColor: 'FF880000'
  };
  const initSheet = (name, title) => {
    const sheet = workbook.addWorksheet(name);
    const titleRow = sheet.addRow([title]);
    titleRow.font = { size: 16, bold: true, color: { argb: theme.titleColor } };
    sheet.addRow([]);
    return sheet;
  };
  const styleHeader = (row) => {
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
      cell.font = { bold: true, color: { argb: theme.headerText } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
  };

  // CROPS 
  const cropsSheet = initSheet('Crops', 'CROPS ANALYTICS');
  styleHeader(cropsSheet.addRow(['Metric', 'Value']));
  cropsSheet.addRow(['Total Crops', allData.crops.totalCrops]);
  cropsSheet.addRow(['Total Pests & Diseases', allData.crops.totalLabels]);
  cropsSheet.addRow([]);
  const cropSummaryHead = cropsSheet.addRow(['CROP', 'TOTAL LABELS']);
  styleHeader(cropSummaryHead);
  Object.entries(allData.crops.cropDetailedMap).forEach(([crop, labels]) => {
    const totalCount = labels.reduce((sum, l) => sum + l.count, 0);
    cropsSheet.addRow([crop.toUpperCase(), totalCount]);
  });
  cropsSheet.addRow([]);
  const cropTableHead = cropsSheet.addRow(['CROP', 'LABEL', 'COUNT']);
  styleHeader(cropTableHead);
  Object.entries(allData.crops.cropDetailedMap).forEach(([crop, labels]) => {
    labels.forEach(l => cropsSheet.addRow([crop.toUpperCase(), l.name, l.count]));
  });

  // ANNOTATIONS 
  const annSheet = initSheet('Annotations', 'ANNOTATION DATA');
  styleHeader(annSheet.addRow(['Metric', 'Value']));
  annSheet.addRows([
    ['Total Annotations', allData.annotations.totalAnnotations],
    ['Valid', allData.annotations.valid],
    ['Invalid', allData.annotations.invalid],
    ['Requires Evaluation', allData.annotations.reqEvaluation],
    ['Deleted', allData.annotations.deletedCount],
    ['Available', allData.annotations.notDeleted]
  ]);
  annSheet.addRow([]);
  const annDistHead = annSheet.addRow(['CROP', 'TOTAL', 'VALID', 'INVALID', 'REQ EVAL', 'DELETED']);
  styleHeader(annDistHead);
  [...allData.annotations.perCropStats]
    .sort((a, b) => b.all - a.all)
    .forEach(s => annSheet.addRow([s.crop, s.all, s.valid, s.invalid, s.reqEvaluation, s.deleted]));
  annSheet.addRow([]);
  const annTrendHead = annSheet.addRow(['UPLOAD DATE', 'COUNT']);
  styleHeader(annTrendHead);
  allData.annotations.trendsTime.forEach(t => annSheet.addRow([t.date, t.count]));
  annSheet.addRow([]);
  const locHead = annSheet.addRow(['LOCATION', 'COUNT']);
  styleHeader(locHead);
  allData.annotations.topLocations.forEach(l => annSheet.addRow([l.location_name, l.count]));
  annSheet.addRow([]);
  const annUserHead = annSheet.addRow(['TOP ANNOTATOR', 'COUNT']);
  styleHeader(annUserHead);
  allData.annotations.topAnnotators.forEach(u => annSheet.addRow([u.name, u.count]));

  // IMAGES
  const imgSheet = initSheet('Images', 'IMAGE REPOSITORY');
  styleHeader(imgSheet.addRow(['Metric', 'Value']));
  imgSheet.addRows([
    ['Total Images', allData.images.total],
    ['Validated', allData.images.validated],
    ['Invalid', allData.images.invalid],
    ['Pending', allData.images.pending],
    ['Total Datasets', allData.images.totalDatasets]
  ]);
  imgSheet.addRow([]);
  const imgCropHead = imgSheet.addRow(['CROP', 'TOTAL', 'VALID', 'INVALID', 'PENDING']);
  styleHeader(imgCropHead);
  allData.images.cropStats.forEach(s => imgSheet.addRow([s.crop, s.total, s.valid, s.invalid, s.pending]));
  imgSheet.addRow([]);
  const imgTrendHead = imgSheet.addRow(['UPLOAD DATE', 'TOTAL UPLOADS']);
  styleHeader(imgTrendHead);
  allData.images.trendsTime.forEach(t => imgSheet.addRow([t.date, t.count]));
  imgSheet.addRow([]);
  const dsHead = imgSheet.addRow(['CROP', 'LABELS', 'IMAGES', 'CREATOR']);
  styleHeader(dsHead);
  allData.images.datasetDetails.forEach(d => 
    imgSheet.addRow([d.crop, d.labels, d.num_images, d.creator.display_name]));
  imgSheet.addRow([]);
  const upHead = imgSheet.addRow(['TOP UPLOADER', 'COUNT']);
  styleHeader(upHead);
  allData.images.topUploaders.forEach(u => imgSheet.addRow([u.name, u.count]));

  // AI MODELS
  const aiSheet = initSheet('AI Models', 'MODEL INSIGHTS');
  styleHeader(aiSheet.addRow(['Metric', 'Value']));
  aiSheet.addRows([
    ['Total Models', allData.models.totalModels],
    ['Detection Models', allData.models.objectDetection],
    ['Classification Models', allData.models.imageClassification],
    ['Available Models', allData.models.activeModels],
    ['Deleted Models', allData.models.deletedModels],
    ['Total Downloads', allData.models.totalDownloads]
  ]);
  aiSheet.addRow([]);
  const aiCropHead = aiSheet.addRow(['CROP', 'MODEL COUNT']);
  styleHeader(aiCropHead);
  allData.models.cropBreakdown.forEach(m => aiSheet.addRow([m.crop, m.count]));
  aiSheet.addRow([]);
  const mostDownloadedHead = aiSheet.addRow(['MOST DOWNLOADED MODELS']);
  styleHeader(mostDownloadedHead);
  allData.models.modelDownloads.forEach(m => aiSheet.addRow([m.name, m.downloads]));
  aiSheet.addRow([]);
  const devHead = aiSheet.addRow(['TOP AI DEVELOPER', 'MODELS CREATED']);
  styleHeader(devHead);
  allData.models.topDevelopers.forEach(d => aiSheet.addRow([d.name, d.count]));
  aiSheet.addRow([]);
  const aiTrendHead = aiSheet.addRow(['UPLOAD DATE', 'MODELS UPLOADED']);
  styleHeader(aiTrendHead);
  allData.models.trendsTime.forEach(t => aiSheet.addRow([t.date, t.count]));

  // USERS
  const userSheet = initSheet('Users', 'USER DEMOGRAPHICS');
  styleHeader(userSheet.addRow(['Metric', 'Value']));
  userSheet.addRows([
    ['Total Users', allData.users.totalUsers],
    ['Total Contributors', allData.users.byRole.find(r => r.name === "Contributors")?.count || 0],
    ['Total Developers', allData.users.byRole.find(r => r.name === "AI Developers")?.count || 0]
  ]);
  const assocHead = userSheet.addRow(['ORGANIZATION/ASSOCIATION', 'USER COUNT']);
  styleHeader(assocHead);
  allData.users.byAssociation.forEach(a => userSheet.addRow([a.name, a.count]));

  workbook.worksheets.forEach(ws => {
    ws.columns.forEach(col => { col.width = 22; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `SPIDHIVE_Report_${new Date().toLocaleDateString()}.xlsx`);
};