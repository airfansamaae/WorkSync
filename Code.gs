/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * ระบบบริหารจัดการงานวิชาการ (Academic Management System)
 * เชื่อมโยงข้อมูลระหว่างเว็บไซต์, Google Drive (Folder ID: 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-),
 * และ Google Sheets สำหรับบันทึกข้อมูลทุกประเภทแบบเรียลไทม์และซิงค์อัตโนมัติ (Auto-Sync)
 * =========================================================================================
 * 
 * วิธีการติดตั้งและนำไปใช้งาน:
 * 1. เปิด Google Sheets (หรือไปที่ https://sheets.new เพื่อสร้างสเปรดชีตใหม่)
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดในไฟล์ Code.gs แล้วคัดลอกโค้ดนี้ทั้งหมดไปวางแทนที่
 * 4. ตรวจสอบโฟลเดอร์ Google Drive ID: 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-
 * 5. คลิกปุ่ม "การทำให้ใช้งานได้" (Deploy) มุมขวาบน > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภทเป็น "เว็บแอป" (Web app)
 * 7. ตั้งค่าการเข้าถึง:
 *    - ดำเนินการในฐานะ (Execute as): "ฉัน" (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone) *** สำคัญมาก เพื่อให้เว็บไซต์ส่งข้อมูลได้โดยไม่ติดสิทธิ์ ***
 * 8. คลิก "ทำให้ใช้งานได้" (Deploy) แล้วให้สิทธิ์การเข้าถึง (Authorize Access)
 * 9. คัดลอก "URL เว็บแอป" (Web app URL ที่ลงท้ายด้วย /exec) มาวางในช่อง Google Apps Script ในหน้าตั้งค่าของเว็บไซต์
 */

// โฟลเดอร์เป้าหมายใน Google Drive สำหรับจัดเก็บไฟล์ทุกประเภท
var DEFAULT_DRIVE_FOLDER_ID = '1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-';

/**
 * จัดการ HTTP GET Requests (สำหรับทดสอบการเชื่อมต่อ และดึงข้อมูลจาก Sheets สู่หน้าเว็บ)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'health';
  
  if (action === 'health' || action === 'test') {
    return createJsonResponse({
      status: 'ok',
      message: 'Google Apps Script Web App is connected and active.',
      driveFolderId: DEFAULT_DRIVE_FOLDER_ID,
      timestamp: new Date().toISOString()
    });
  }
  
  if (action === 'get_all') {
    return createJsonResponse(getAllDataFromSheets());
  }
  
  return createJsonResponse({ status: 'unknown_action', action: action });
}

/**
 * จัดการ HTTP POST Requests (อัปโหลดไฟล์ทุกชนิดเข้า Drive และซิงค์ข้อมูลข้อความเข้า Sheets อัตโนมัติ)
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action;

    // 1. อัปโหลดไฟล์ทุกประเภทไปยัง Google Drive Folder ID: 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-
    if (action === 'upload_file') {
      var folderId = data.folderId || DEFAULT_DRIVE_FOLDER_ID;
      var fileName = data.fileName || ('upload_' + new Date().getTime());
      var mimeType = data.mimeType || 'application/octet-stream';
      var base64Data = data.base64Data;
      var uploadedBy = data.uploadedBy || 'Academic Member';
      var category = data.category || 'General';

      if (!base64Data) {
        return createJsonResponse({ success: false, error: 'Missing base64Data' });
      }

      // ทำความสะอาด base64 header (เช่น data:application/pdf;base64,...)
      var cleanBase64 = base64Data.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
      var decoded = Utilities.base64Decode(cleanBase64);
      var blob = Utilities.newBlob(decoded, mimeType, fileName);

      // เข้าถึงโฟลเดอร์ Google Drive
      var folder = DriveApp.getFolderById(folderId);
      var driveFile = folder.createFile(blob);
      
      // กำหนดสิทธิ์ให้ผู้ที่มีลิงก์สามารถเปิดดูและดาวน์โหลดได้
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var fileId = driveFile.getId();
      var webViewLink = driveFile.getUrl();
      var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
      var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

      // บันทึก Log ข้อมูลไฟล์ลงในชีต "Upload_Logs"
      logFileUploadToSheet({
        fileId: fileId,
        fileName: fileName,
        fileSize: driveFile.getSize(),
        mimeType: mimeType,
        folderId: folderId,
        webViewLink: webViewLink,
        downloadUrl: downloadUrl,
        uploadedBy: uploadedBy,
        category: category,
        uploadedAt: new Date().toISOString()
      });

      return createJsonResponse({
        success: true,
        fileId: fileId,
        fileName: fileName,
        fileSize: driveFile.getSize(),
        mimeType: mimeType,
        webViewLink: webViewLink,
        downloadUrl: downloadUrl,
        previewUrl: previewUrl,
        folderId: folderId,
        timestamp: new Date().toISOString()
      });
    }

    // 2. ซิงค์ข้อมูลทั้งหมดของเว็บไซต์เข้า Google Sheets อัตโนมัติ (Tasks, Submissions, Documents, etc.)
    if (action === 'sync_all') {
      syncAllDataToSheets(data);
      return createJsonResponse({
        success: true,
        message: 'ซิงค์ข้อมูลเว็บไซต์ทั้งหมดเข้า Google Sheets อัตโนมัติสำเร็จ',
        timestamp: new Date().toISOString()
      });
    }

    // 3. บันทึก / อัปเดตข้อมูลการส่งงานของครู (Submission)
    if (action === 'save_submission') {
      saveSubmissionToSheet(data.submission);
      return createJsonResponse({ success: true, message: 'บันทึกการส่งงานลง Google Sheets สำเร็จ' });
    }

    // 4. บันทึก / อัปเดตเอกสารวิชาการ หรือหนังสือคำสั่ง (Academic Document)
    if (action === 'save_document') {
      saveDocumentToSheet(data.document);
      return createJsonResponse({ success: true, message: 'บันทึกเอกสารวิชาการลง Google Sheets สำเร็จ' });
    }

    // 5. บันทึก / อัปเดตภาระงานวิชาการ (Task)
    if (action === 'save_task') {
      saveTaskToSheet(data.task);
      return createJsonResponse({ success: true, message: 'บันทึกภาระงานลง Google Sheets สำเร็จ' });
    }

    // 6. บันทึก / อัปเดตข่าวสาร/ประกาศ (Notice)
    if (action === 'save_notice') {
      saveNoticeToSheet(data.notice);
      return createJsonResponse({ success: true, message: 'บันทึกประกาศลง Google Sheets สำเร็จ' });
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * ฟังก์ชันช่วยสร้าง JSON Output สำหรับ Web App
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ดึง Spreadsheet ที่เชื่อมต่ออยู่ หรือสร้างใหม่หากยังไม่มี
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('ฐานข้อมูลระบบงานวิชาการ (Academic Database)');
  } catch (e) {
    return SpreadsheetApp.create('ฐานข้อมูลระบบงานวิชาการ (Academic Database)');
  }
}

/**
 * ดึงหรือสร้างแท็บแผ่นงาน (Sheet) พร้อมจัดรูปแบบแถวหัวตาราง (Header)
 */
function getOrCreateSheet(sheetName, headers) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#7C3AED'); // สีม่วงวิชาการ
      headerRange.setFontColor('#FFFFFF');
    }
  }
  return sheet;
}

/**
 * บันทึกข้อมูลประวัติการอัปโหลดไฟล์ทุกชนิด
 */
function logFileUploadToSheet(info) {
  var sheet = getOrCreateSheet('Upload_Logs', [
    'File ID', 'File Name', 'File Size (Bytes)', 'MIME Type', 
    'Drive Folder ID', 'Google Drive URL', 'Direct Download URL', 'Uploaded By', 'Category', 'Uploaded At'
  ]);
  sheet.appendRow([
    info.fileId,
    info.fileName,
    info.fileSize,
    info.mimeType,
    info.folderId,
    info.webViewLink,
    info.downloadUrl,
    info.uploadedBy,
    info.category,
    info.uploadedAt
  ]);
}

/**
 * ซิงค์ข้อมูลทั้งหมดจากเว็บไซต์เข้าสู่ชีตต่างๆ แบบครบวงจร
 */
function syncAllDataToSheets(data) {
  // 1. ภาระงาน (Tasks)
  if (data.tasks && Array.isArray(data.tasks)) {
    var taskSheet = getOrCreateSheet('Tasks', [
      'ID', 'Title', 'Description', 'Category', 'Start Date', 'Due Date', 'Created By', 'Status', 'Assigned Count', 'Created At'
    ]);
    if (taskSheet.getLastRow() > 1) {
      taskSheet.getRange(2, 1, taskSheet.getLastRow() - 1, taskSheet.getLastColumn()).clearContent();
    }
    data.tasks.forEach(function(t) {
      taskSheet.appendRow([
        t.id, t.title, t.description, t.category, t.startDate, t.dueDate, t.createdBy, t.status, (t.assignedTo || []).length, t.createdAt
      ]);
    });
  }

  // 2. ข้อมูลการส่งงานของครูและไฟล์ใน Drive (Submissions)
  if (data.submissions && Array.isArray(data.submissions)) {
    var subSheet = getOrCreateSheet('Submissions', [
      'Submission ID', 'Task ID', 'User ID', 'Teacher Name', 'Title', 'Description', 'Files Count', 'Google Drive Files Links', 'Status', 'Submitted At'
    ]);
    if (subSheet.getLastRow() > 1) {
      subSheet.getRange(2, 1, subSheet.getLastRow() - 1, subSheet.getLastColumn()).clearContent();
    }
    data.submissions.forEach(function(s) {
      var filesText = (s.files || []).map(function(f) {
        return f.name + ' (' + (f.url || 'Drive') + ')';
      }).join('\n');
      subSheet.appendRow([
        s.id, s.taskId, s.userId, s.userName, s.title, s.description || '', (s.files || []).length, filesText, s.status, s.submittedAt
      ]);
    });
  }

  // 3. เอกสารวิชาการและหนังสือคำสั่ง (Academic Documents)
  if (data.documents && Array.isArray(data.documents)) {
    var docSheet = getOrCreateSheet('Academic_Documents', [
      'ID', 'Title', 'Category', 'Order Number', 'Description', 'File Name', 'Google Drive Link', 'Uploaded By', 'Created At'
    ]);
    if (docSheet.getLastRow() > 1) {
      docSheet.getRange(2, 1, docSheet.getLastRow() - 1, docSheet.getLastColumn()).clearContent();
    }
    data.documents.forEach(function(d) {
      var file = d.file;
      var fileName = file ? file.name : '';
      var fileUrl = file ? file.url : '';
      docSheet.appendRow([
        d.id, d.title, d.category, d.orderNumber || '', d.description || '', fileName, fileUrl, d.uploadedBy, d.createdAt
      ]);
    });
  }

  // 4. ข่าวประชาสัมพันธ์ / ประกาศวิชาการ (Notices)
  if (data.notices && Array.isArray(data.notices)) {
    var noticeSheet = getOrCreateSheet('Notices', [
      'ID', 'Title', 'Content', 'Category', 'Priority', 'Target Roles', 'Author', 'Created At'
    ]);
    if (noticeSheet.getLastRow() > 1) {
      noticeSheet.getRange(2, 1, noticeSheet.getLastRow() - 1, noticeSheet.getLastColumn()).clearContent();
    }
    data.notices.forEach(function(n) {
      noticeSheet.appendRow([
        n.id, n.title, n.content, n.category, n.priority, (n.targetRoles || []).join(', '), n.author, n.createdAt
      ]);
    });
  }

  // 5. ลิงก์เว็บไซต์แนะนำ (Websites)
  if (data.websites && Array.isArray(data.websites)) {
    var webSheet = getOrCreateSheet('Websites', [
      'ID', 'Title', 'URL', 'Description', 'Order', 'Category', 'Created At'
    ]);
    if (webSheet.getLastRow() > 1) {
      webSheet.getRange(2, 1, webSheet.getLastRow() - 1, webSheet.getLastColumn()).clearContent();
    }
    data.websites.forEach(function(w) {
      webSheet.appendRow([
        w.id, w.title, w.url, w.description, w.order, w.category || '', w.createdAt
      ]);
    });
  }

  // 6. รายชื่อผู้ใช้งาน / ครู (Users)
  if (data.users && Array.isArray(data.users)) {
    var userSheet = getOrCreateSheet('Users', [
      'ID', 'Username', 'Full Name', 'Role', 'Status', 'Department', 'Email', 'Created At'
    ]);
    if (userSheet.getLastRow() > 1) {
      userSheet.getRange(2, 1, userSheet.getLastRow() - 1, userSheet.getLastColumn()).clearContent();
    }
    data.users.forEach(function(u) {
      userSheet.appendRow([
        u.id, u.username, u.fullName, u.role, u.status, u.department || '', u.email || '', u.createdAt
      ]);
    });
  }

  // 7. การตั้งค่าระบบ (Settings)
  if (data.settings) {
    var settingSheet = getOrCreateSheet('Settings', ['Property', 'Value']);
    if (settingSheet.getLastRow() > 1) {
      settingSheet.getRange(2, 1, settingSheet.getLastRow() - 1, settingSheet.getLastColumn()).clearContent();
    }
    settingSheet.appendRow(['School Name', data.settings.schoolName]);
    settingSheet.appendRow(['Department Name', data.settings.departmentName]);
    settingSheet.appendRow(['Academic Year', data.settings.academicYear]);
    settingSheet.appendRow(['Semester', data.settings.semester]);
    settingSheet.appendRow(['Google Drive Target Folder ID', DEFAULT_DRIVE_FOLDER_ID]);
    settingSheet.appendRow(['Last Auto-Synced At', new Date().toISOString()]);
  }
}

/**
 * บันทึกการส่งงานเดี่ยว (Single Submission)
 */
function saveSubmissionToSheet(submission) {
  if (!submission) return;
  var subSheet = getOrCreateSheet('Submissions', [
    'Submission ID', 'Task ID', 'User ID', 'Teacher Name', 'Title', 'Description', 'Files Count', 'Google Drive Files Links', 'Status', 'Submitted At'
  ]);
  var filesText = (submission.files || []).map(function(f) {
    return f.name + ' (' + (f.url || 'Drive') + ')';
  }).join('\n');
  subSheet.appendRow([
    submission.id, submission.taskId, submission.userId, submission.userName, submission.title, submission.description || '', (submission.files || []).length, filesText, submission.status, submission.submittedAt
  ]);
}

/**
 * บันทึกเอกสารวิชาการเดี่ยว (Single Document)
 */
function saveDocumentToSheet(doc) {
  if (!doc) return;
  var docSheet = getOrCreateSheet('Academic_Documents', [
    'ID', 'Title', 'Category', 'Order Number', 'Description', 'File Name', 'Google Drive Link', 'Uploaded By', 'Created At'
  ]);
  var file = doc.file;
  var fileName = file ? file.name : '';
  var fileUrl = file ? file.url : '';
  docSheet.appendRow([
    doc.id, doc.title, doc.category, doc.orderNumber || '', doc.description || '', fileName, fileUrl, doc.uploadedBy, doc.createdAt
  ]);
}

/**
 * บันทึกภาระงานเดี่ยว (Single Task)
 */
function saveTaskToSheet(task) {
  if (!task) return;
  var taskSheet = getOrCreateSheet('Tasks', [
    'ID', 'Title', 'Description', 'Category', 'Start Date', 'Due Date', 'Created By', 'Status', 'Assigned Count', 'Created At'
  ]);
  taskSheet.appendRow([
    task.id, task.title, task.description, task.category, task.startDate, task.dueDate, task.createdBy, task.status, (task.assignedTo || []).length, task.createdAt
  ]);
}

/**
 * บันทึกประกาศเดี่ยว (Single Notice)
 */
function saveNoticeToSheet(notice) {
  if (!notice) return;
  var noticeSheet = getOrCreateSheet('Notices', [
    'ID', 'Title', 'Content', 'Category', 'Priority', 'Target Roles', 'Author', 'Created At'
  ]);
  noticeSheet.appendRow([
    notice.id, notice.title, notice.content, notice.category, notice.priority, (notice.targetRoles || []).join(', '), notice.author, notice.createdAt
  ]);
}

/**
 * อ่านข้อมูลทั้งหมดจาก Google Sheets
 */
function getAllDataFromSheets() {
  var ss = getSpreadsheet();
  var result = {
    tasks: [],
    submissions: [],
    documents: [],
    notices: [],
    websites: [],
    users: [],
    settings: null
  };

  function readRows(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var list = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j]] = row[j];
      }
      list.push(item);
    }
    return list;
  }

  result.tasks = readRows('Tasks');
  result.submissions = readRows('Submissions');
  result.documents = readRows('Academic_Documents');
  result.notices = readRows('Notices');
  result.websites = readRows('Websites');
  result.users = readRows('Users');

  return { success: true, data: result };
}
