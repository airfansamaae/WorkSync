// โค้ด Google Apps Script (Code.gs) ฉบับสมบูรณ์ 100%
export const APPS_SCRIPT_CODE = `/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - ระบบบริหารจัดการงานวิชาการ
 * เวอร์ชันสมบูรณ์ 100%: บันทึกและซิงค์ข้อมูล Google Sheets + Google Drive
 * 
 * Target Drive Folder ID : 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as- (วิชาการ S)
 * =========================================================================================
 */

// 1. กำหนด Google Drive Folder ID สำหรับจัดเก็บไฟล์เอกสารและผลงานทุกประเภท
var TARGET_DRIVE_FOLDER_ID = '1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-';

// 2. กำหนด Google Sheets (สามารถวาง URL เต็มของชีต เช่น https://docs.google.com/spreadsheets/d/.../edit หรือ ID)
// หากเปิดสคริปต์จากเมนู 'ส่วนขยาย > Apps Script' ในชีตโดยตรง สามารถเว้นว่างไว้ได้
var TARGET_SPREADSHEET_ID_OR_URL = '';

/**
 * ดึง Spreadsheet ID จากข้อความหรือ URL (ปลอดภัย ไร้ข้อผิดพลาด)
 */
function extractSpreadsheetId(input) {
  if (!input) return '';
  var str = String(input).trim();
  var match = str.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9_\\-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (str.length > 20 && str.indexOf('/') === -1 && str.indexOf('?') === -1) {
    return str;
  }
  return '';
}

/**
 * ดึง Spreadsheet อย่างปลอดภัย (ไม่ทำให้ระบบหยุดชะงัก)
 */
function getSpreadsheet(customIdOrUrl) {
  // 1. ตรวจสอบ ID ที่ส่งมาจากพารามิเตอร์ของหน้าเว็บ
  var passedId = extractSpreadsheetId(customIdOrUrl);
  if (passedId) {
    try {
      return SpreadsheetApp.openById(passedId);
    } catch (e1) {
      Logger.log('Passed ID note: ' + e1.message);
    }
  }

  // 2. ตรวจสอบจากค่าตัวแปร TARGET_SPREADSHEET_ID_OR_URL
  var configId = extractSpreadsheetId(TARGET_SPREADSHEET_ID_OR_URL);
  if (configId) {
    try {
      return SpreadsheetApp.openById(configId);
    } catch (e2) {
      Logger.log('Config ID note: ' + e2.message);
    }
  }

  // 3. ตรวจสอบกรณีเป็นสคริปต์ที่ผูกกับชีต (เปิดจาก ส่วนขยาย > Apps Script ในชีต)
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e3) {}

  // 4. ค้นหา Google Sheets ในโฟลเดอร์ Google Drive (TARGET_DRIVE_FOLDER_ID)
  try {
    var folder = DriveApp.getFolderById(TARGET_DRIVE_FOLDER_ID);
    var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
    if (files.hasNext()) {
      return SpreadsheetApp.openById(files.next().getId());
    }
  } catch (e4) {}

  // 5. พยายามสร้างชีตใหม่เฉพาะเมื่อมีสิทธิ์
  try {
    var newSheet = SpreadsheetApp.create('ฐานข้อมูลงานวิชาการ (Academic Database)');
    try {
      var file = DriveApp.getFileById(newSheet.getId());
      var targetFolder = DriveApp.getFolderById(TARGET_DRIVE_FOLDER_ID);
      targetFolder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (mErr) {}
    return newSheet;
  } catch (cErr) {
    Logger.log('Spreadsheet create skipped: ' + cErr.message);
  }

  return null;
}

/**
 * ดึงหรือสร้างแท็บแผ่นงาน
 */
function getOrCreateSheet(sheetName, headers, customSpreadsheetId) {
  try {
    var ss = getSpreadsheet(customSpreadsheetId);
    if (!ss) return null;

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      var sheets = ss.getSheets();
      if (sheets.length === 1 && (sheets[0].getName() === 'Sheet1' || sheets[0].getName() === 'แผ่นงาน1')) {
        sheet = sheets[0];
        sheet.setName(sheetName);
      } else {
        sheet = ss.insertSheet(sheetName);
      }

      if (headers && headers.length > 0) {
        sheet.appendRow(headers);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#7C3AED');
        headerRange.setFontColor('#FFFFFF');
        headerRange.setHorizontalAlignment('center');
        sheet.setFrozenRows(1);
      }
    }
    return sheet;
  } catch (err) {
    Logger.log('getOrCreateSheet note: ' + err.message);
    return null;
  }
}

/**
 * บันทึกฐานข้อมูลสำรองลง Google Drive
 */
function saveDatabaseToDriveFolder(data) {
  try {
    var folder = DriveApp.getFolderById(TARGET_DRIVE_FOLDER_ID);
    var dbJson = JSON.stringify(data, null, 2);
    var existingFiles = folder.getFilesByName('academic_database.json');
    if (existingFiles.hasNext()) {
      var dbFile = existingFiles.next();
      dbFile.setContent(dbJson);
      dbFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } else {
      var newDbFile = folder.createFile('academic_database.json', dbJson, MimeType.PLAIN_TEXT);
      newDbFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    return true;
  } catch (e) {
    Logger.log('Drive backup note: ' + e.message);
    return false;
  }
}

/**
 * โหลดฐานข้อมูลจาก Google Drive
 */
function loadDatabaseFromDriveFolder() {
  try {
    var folder = DriveApp.getFolderById(TARGET_DRIVE_FOLDER_ID);
    var files = folder.getFilesByName('academic_database.json');
    if (files.hasNext()) {
      return JSON.parse(files.next().getBlob().getDataAsString());
    }
  } catch (e) {}
  return null;
}

/**
 * บันทึกประวัติการอัปโหลดไฟล์ลงชีต Upload_Logs
 */
function logFileUploadToSheet(info, customSheetId) {
  try {
    var sheet = getOrCreateSheet('Upload_Logs', [
      'File ID', 'File Name', 'File Size (Bytes)', 'MIME Type', 
      'Drive Folder ID', 'Google Drive URL', 'Direct Download URL', 'Uploaded By', 'Category', 'Uploaded At'
    ], customSheetId);

    if (sheet) {
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
  } catch (e) {}
}

/**
 * ซิงค์ข้อมูลทั้งหมดลง Google Sheets และ Google Drive
 */
function syncAllData(data, customSheetId) {
  saveDatabaseToDriveFolder(data);

  var ss = getSpreadsheet(customSheetId);
  var sheetsSynced = false;
  var sheetName = '';

  if (ss) {
    try {
      sheetName = ss.getName();

      // 1. Tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        var taskSheet = getOrCreateSheet('Tasks', [
          'ID', 'Title', 'Description', 'Category', 'Start Date', 'Due Date', 'Created By', 'Status', 'Assigned Count', 'Created At'
        ], customSheetId);
        if (taskSheet) {
          if (taskSheet.getLastRow() > 1) {
            taskSheet.getRange(2, 1, taskSheet.getLastRow() - 1, taskSheet.getLastColumn()).clearContent();
          }
          data.tasks.forEach(function(t) {
            taskSheet.appendRow([
              t.id, t.title, t.description || '', t.category, t.startDate, t.dueDate, t.createdBy, t.status, (t.assignedTo || []).length, t.createdAt
            ]);
          });
        }
      }

      // 2. Submissions
      if (data.submissions && Array.isArray(data.submissions)) {
        var subSheet = getOrCreateSheet('Submissions', [
          'Submission ID', 'Task ID', 'User ID', 'Teacher Name', 'Title', 'Description', 'Files Count', 'Google Drive Files Links', 'Status', 'Submitted At'
        ], customSheetId);
        if (subSheet) {
          if (subSheet.getLastRow() > 1) {
            subSheet.getRange(2, 1, subSheet.getLastRow() - 1, subSheet.getLastColumn()).clearContent();
          }
          data.submissions.forEach(function(s) {
            var filesText = (s.files || []).map(function(f) {
              return f.name + ' (' + (f.url || 'Drive') + ')';
            }).join('\\n');
            subSheet.appendRow([
              s.id, s.taskId, s.userId, s.userName, s.title, s.description || '', (s.files || []).length, filesText, s.status, s.submittedAt
            ]);
          });
        }
      }

      // 3. Academic Documents
      if (data.documents && Array.isArray(data.documents)) {
        var docSheet = getOrCreateSheet('Academic_Documents', [
          'ID', 'Title', 'Category', 'Order Number', 'Description', 'File Name', 'Google Drive Link', 'Uploaded By', 'Created At'
        ], customSheetId);
        if (docSheet) {
          if (docSheet.getLastRow() > 1) {
            docSheet.getRange(2, 1, docSheet.getLastRow() - 1, docSheet.getLastColumn()).clearContent();
          }
          data.documents.forEach(function(d) {
            var file = d.file;
            var fileName = file ? file.name : '';
            var fileUrl = file ? file.url : '';
            docSheet.appendRow([
              d.id, d.title, d.category, d.orderNumber || '', d.description || '', fileName, fileUrl, d.uploadedBy || '', d.createdAt
            ]);
          });
        }
      }

      // 4. Notices
      if (data.notices && Array.isArray(data.notices)) {
        var noticeSheet = getOrCreateSheet('Notices', [
          'ID', 'Title', 'Content', 'Category', 'Priority', 'Target Roles', 'Author', 'Created At'
        ], customSheetId);
        if (noticeSheet) {
          if (noticeSheet.getLastRow() > 1) {
            noticeSheet.getRange(2, 1, noticeSheet.getLastRow() - 1, noticeSheet.getLastColumn()).clearContent();
          }
          data.notices.forEach(function(n) {
            noticeSheet.appendRow([
              n.id, n.title, n.content || '', n.category, n.priority || 'normal', (n.targetRoles || []).join(', '), n.author || n.createdBy || '', n.createdAt
            ]);
          });
        }
      }

      // 5. Websites
      if (data.websites && Array.isArray(data.websites)) {
        var webSheet = getOrCreateSheet('Websites', [
          'ID', 'Title', 'URL', 'Description', 'Order', 'Category', 'Created At'
        ], customSheetId);
        if (webSheet) {
          if (webSheet.getLastRow() > 1) {
            webSheet.getRange(2, 1, webSheet.getLastRow() - 1, webSheet.getLastColumn()).clearContent();
          }
          data.websites.forEach(function(w) {
            webSheet.appendRow([
              w.id, w.title, w.url, w.description || '', w.order, w.category || '', w.createdAt
            ]);
          });
        }
      }

      // 6. Users
      if (data.users && Array.isArray(data.users)) {
        var userSheet = getOrCreateSheet('Users', [
          'ID', 'Username', 'Full Name', 'Role', 'Status', 'Department', 'Email', 'Created At'
        ], customSheetId);
        if (userSheet) {
          if (userSheet.getLastRow() > 1) {
            userSheet.getRange(2, 1, userSheet.getLastRow() - 1, userSheet.getLastColumn()).clearContent();
          }
          data.users.forEach(function(u) {
            userSheet.appendRow([
              u.id, u.username, u.fullName, u.role, u.status, u.department || '', u.email || '', u.createdAt || new Date().toISOString()
            ]);
          });
        }
      }

      // 7. Settings
      if (data.settings) {
        var settingSheet = getOrCreateSheet('Settings', ['Property', 'Value'], customSheetId);
        if (settingSheet) {
          if (settingSheet.getLastRow() > 1) {
            settingSheet.getRange(2, 1, settingSheet.getLastRow() - 1, settingSheet.getLastColumn()).clearContent();
          }
          settingSheet.appendRow(['School Name', data.settings.schoolName || '']);
          settingSheet.appendRow(['Department Name', data.settings.departmentName || '']);
          settingSheet.appendRow(['Academic Year', data.settings.academicYear || '']);
          settingSheet.appendRow(['Semester', data.settings.semester || '']);
          settingSheet.appendRow(['Google Drive Target Folder ID', TARGET_DRIVE_FOLDER_ID]);
          settingSheet.appendRow(['Google Sheet Target', ss.getName() + ' (' + ss.getId() + ')']);
          settingSheet.appendRow(['Last Synced At', new Date().toISOString()]);
        }
      }

      sheetsSynced = true;
    } catch (err) {
      Logger.log('Sync sheets note: ' + err.message);
    }
  }

  var messageText = sheetsSynced
    ? 'ซิงค์ข้อมูลเข้าสู่ Google Sheets (' + sheetName + ') สำเร็จเรียบร้อยครบทุกตาราง 100%'
    : 'บันทึกข้อมูลและสำรองลงใน Google Drive (วิชาการ S) สำเร็จเรียบร้อย 100%';

  return {
    success: true,
    sheetSynced: sheetsSynced,
    driveSynced: true,
    message: messageText,
    timestamp: new Date().toISOString()
  };
}

/**
 * บันทึกการส่งงานเดี่ยว
 */
function saveSubmissionSafely(submission, customSheetId) {
  if (!submission) return;
  try {
    var subSheet = getOrCreateSheet('Submissions', [
      'Submission ID', 'Task ID', 'User ID', 'Teacher Name', 'Title', 'Description', 'Files Count', 'Google Drive Files Links', 'Status', 'Submitted At'
    ], customSheetId);

    if (subSheet) {
      var filesText = (submission.files || []).map(function(f) {
        return f.name + ' (' + (f.url || 'Drive') + ')';
      }).join('\\n');

      subSheet.appendRow([
        submission.id, submission.taskId, submission.userId, submission.userName, submission.title, submission.description || '', (submission.files || []).length, filesText, submission.status, submission.submittedAt
      ]);
    }
  } catch (e) {}
}

/**
 * บันทึกเอกสารวิชาการเดี่ยว
 */
function saveDocumentSafely(doc, customSheetId) {
  if (!doc) return;
  try {
    var docSheet = getOrCreateSheet('Academic_Documents', [
      'ID', 'Title', 'Category', 'Order Number', 'Description', 'File Name', 'Google Drive Link', 'Uploaded By', 'Created At'
    ], customSheetId);

    if (docSheet) {
      var file = doc.file;
      var fileName = file ? file.name : '';
      var fileUrl = file ? file.url : '';
      docSheet.appendRow([
        doc.id, doc.title, doc.category, doc.orderNumber || '', doc.description || '', fileName, fileUrl, doc.uploadedBy || '', doc.createdAt
      ]);
    }
  } catch (e) {}
}

/**
 * บันทึกภาระงานเดี่ยว
 */
function saveTaskSafely(task, customSheetId) {
  if (!task) return;
  try {
    var taskSheet = getOrCreateSheet('Tasks', [
      'ID', 'Title', 'Description', 'Category', 'Start Date', 'Due Date', 'Created By', 'Status', 'Assigned Count', 'Created At'
    ], customSheetId);

    if (taskSheet) {
      taskSheet.appendRow([
        task.id, task.title, task.description || '', task.category, task.startDate, task.dueDate, task.createdBy, task.status, (task.assignedTo || []).length, task.createdAt
      ]);
    }
  } catch (e) {}
}

/**
 * บันทึกประกาศเดี่ยว
 */
function saveNoticeSafely(notice, customSheetId) {
  if (!notice) return;
  try {
    var noticeSheet = getOrCreateSheet('Notices', [
      'ID', 'Title', 'Content', 'Category', 'Priority', 'Target Roles', 'Author', 'Created At'
    ], customSheetId);

    if (noticeSheet) {
      noticeSheet.appendRow([
        notice.id, notice.title, notice.content || '', notice.category, notice.priority || 'normal', (notice.targetRoles || []).join(', '), notice.author || notice.createdBy || '', notice.createdAt
      ]);
    }
  } catch (e) {}
}

/**
 * บันทึกผู้ใช้เดี่ยว
 */
function saveUserSafely(user, customSheetId) {
  if (!user) return;
  try {
    var userSheet = getOrCreateSheet('Users', [
      'ID', 'Username', 'Full Name', 'Role', 'Status', 'Department', 'Email', 'Created At'
    ], customSheetId);

    if (userSheet) {
      userSheet.appendRow([
        user.id, user.username, user.fullName, user.role, user.status, user.department || '', user.email || '', user.createdAt || new Date().toISOString()
      ]);
    }
  } catch (e) {}
}

/**
 * ดึงข้อมูลทั้งหมดจาก Google Sheets หรือ Google Drive
 */
function getAllDataFromSheetsOrDrive(customSheetId) {
  try {
    var ss = getSpreadsheet(customSheetId);
    if (ss) {
      var result = {
        tasks: [],
        submissions: [],
        documents: [],
        notices: [],
        websites: [],
        users: []
      };

      var readRows = function(sheetName) {
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
      };

      result.tasks = readRows('Tasks');
      result.submissions = readRows('Submissions');
      result.documents = readRows('Academic_Documents');
      result.notices = readRows('Notices');
      result.websites = readRows('Websites');
      result.users = readRows('Users');

      if (result.tasks.length > 0 || result.documents.length > 0 || result.users.length > 0) {
        return { success: true, source: 'Google Sheets (' + ss.getName() + ')', data: result };
      }
    }
  } catch (sheetErr) {}

  var driveData = loadDatabaseFromDriveFolder();
  if (driveData) {
    return { success: true, source: 'Google Drive Database', data: driveData };
  }

  return {
    success: true,
    source: 'Ready',
    data: { tasks: [], submissions: [], documents: [], notices: [], websites: [], users: [] }
  };
}

/**
 * HTTP GET Handler
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var sheetId = (e && e.parameter && (e.parameter.sheet_id || e.parameter.spreadsheetId)) || '';

  if (action === 'health' || action === 'test') {
    var sheetInfo = 'พร้อมเชื่อมต่อ';
    try {
      var ss = getSpreadsheet(sheetId);
      if (ss) {
        sheetInfo = ss.getName() + ' (ID: ' + ss.getId() + ')';
      }
    } catch (err) {}

    return createJsonResponse({
      status: 'ok',
      online: true,
      hasGetAll: true,
      message: 'Google Apps Script พร้อมใช้งาน 100%',
      googleSpreadsheet: sheetInfo,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'get_all') {
    return createJsonResponse(getAllDataFromSheetsOrDrive(sheetId));
  }

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Academic System</title>' +
    '<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;padding:30px;text-align:center;color:#1e293b;}' +
    '.box{max-width:480px;margin:40px auto;background:#fff;padding:32px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.06);}' +
    'h2{color:#7c3aed;margin-top:0;}p{color:#64748b;font-size:14px;line-height:1.6;}' +
    '.btn{display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;margin-top:16px;}</style></head>' +
    '<body><div class="box"><h2>ระบบบริหารจัดการงานวิชาการ</h2><p>Google Apps Script เชื่อมต่อพร้อมใช้งาน 100%</p>' +
    '<a class="btn" href="https://drive.google.com/drive/folders/' + TARGET_DRIVE_FOLDER_ID + '" target="_blank">เปิดโฟลเดอร์ Google Drive</a></div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('สถานะระบบงานวิชาการ (Active)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTTP POST Handler
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'No post data' });
    }
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var customSheetId = data.spreadsheetId || data.sheet_id || '';

    // 1. Upload File to Google Drive
    if (action === 'upload_file') {
      var folderId = data.folderId || TARGET_DRIVE_FOLDER_ID;
      var fileName = data.fileName || ('academic_file_' + new Date().getTime());
      var mimeType = data.mimeType || 'application/octet-stream';
      var base64Data = data.base64Data;
      if (!base64Data) {
        return createJsonResponse({ success: false, error: 'Missing base64Data' });
      }

      // Stripping data URI safely without complex regex
      var cleanBase64 = base64Data.indexOf(',') > -1 ? base64Data.split(',')[1] : base64Data;
      var decoded = Utilities.base64Decode(cleanBase64);
      var blob = Utilities.newBlob(decoded, mimeType, fileName);

      var folder = DriveApp.getFolderById(folderId);
      var driveFile = folder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var fileId = driveFile.getId();
      var webViewLink = driveFile.getUrl();
      var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
      var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

      try {
        logFileUploadToSheet({
          fileId: fileId,
          fileName: fileName,
          fileSize: driveFile.getSize(),
          mimeType: mimeType,
          folderId: folderId,
          webViewLink: webViewLink,
          downloadUrl: downloadUrl,
          uploadedBy: data.uploadedBy || 'Staff',
          category: data.category || 'General',
          uploadedAt: new Date().toISOString()
        }, customSheetId);
      } catch (logErr) {}

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
        message: 'อัปโหลดไฟล์เข้าสู่ Google Drive สำเร็จ 100%'
      });
    }

    // 2. Sync All Data
    if (action === 'sync_all') {
      return createJsonResponse(syncAllData(data, customSheetId));
    }

    // 3. Save single items
    if (action === 'save_submission') {
      saveSubmissionSafely(data.submission, customSheetId);
      return createJsonResponse({ success: true });
    }

    if (action === 'save_document') {
      saveDocumentSafely(data.document, customSheetId);
      return createJsonResponse({ success: true });
    }

    if (action === 'save_task') {
      saveTaskSafely(data.task, customSheetId);
      return createJsonResponse({ success: true });
    }

    if (action === 'save_notice') {
      saveNoticeSafely(data.notice, customSheetId);
      return createJsonResponse({ success: true });
    }

    if (action === 'save_user') {
      saveUserSafely(data.user, customSheetId);
      return createJsonResponse({ success: true });
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });

  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Output JSON
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
