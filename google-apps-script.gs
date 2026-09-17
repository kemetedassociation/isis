// ============================================================
//  ISIS — GOOGLE APPS SCRIPT v6
//  Proxy pour : Gmail + Google Agenda + Notion + CRM + Drive (écriture)
//
//  CONFIGURATION :
//  1. Collez votre clé Notion ci-dessous (ligne NOTION_KEY)
//  2. Partagez au moins une page Notion avec l'intégration ISIS
//     (la base CRM sera créée automatiquement dedans)
//  3. Déployez → Nouvelle version → Déployer
// ============================================================

// ──── METTEZ VOTRE CLÉ NOTION ICI ────────────────────────────
const NOTION_KEY = '';   // ex: 'secret_ntn_abc123...'
// ─────────────────────────────────────────────────────────────

function doGet(e) {
  const action   = (e.parameter.action || 'all').toLowerCase();
  const callback = e.parameter.callback || '';
  const query    = e.parameter.query    || '';

  let result = {};
  try {
    if      (action === 'emails')        result = { emails: getEmails(false) };
    else if (action === 'unread')        result = { emails: getEmails(true)  };
    else if (action === 'agenda')        result = { agenda: getAgenda()      };
    else if (action === 'brief')         result = { emails: getEmails(false), agenda: getAgenda(1) };
    else if (action === 'notion-search') result = notionSearch(query);
    else if (action === 'notion-create') result = notionCreate(e.parameter.titre || query, e.parameter.contenu || '');
    else if (action === 'drive-search')    result = getDriveFiles(query);
    else if (action === 'drive-recent')    result = getDriveFiles('');
    else if (action === 'drive-read')      result = getDriveDocContent(e.parameter.id || '');
    else if (action === 'crm-list')        result = crmListContacts(e.parameter.statut || '');
    else if (action === 'crm-add')         result = crmAddContact({
      nom             : e.parameter.nom || '',
      statut          : e.parameter.statut || 'Prospect',
      telephone       : e.parameter.telephone || '',
      email           : e.parameter.email || '',
      entreprise      : e.parameter.entreprise || '',
      notes           : e.parameter.notes || '',
      prochaineAction : e.parameter.prochaineAction || '',
    });
    else if (action === 'crm-update-statut') result = crmUpdateContactStatut(e.parameter.nom || '', e.parameter.statut || '');
    else if (action === 'crm-sync-sheet')  result = crmInitSheetSync();
    else if (action === 'news')            result = getNews();
    else if (action === 'send-email')      result = sendEmailISIS(e.parameter.to || '', e.parameter.subject || '', e.parameter.body || '');
    else if (action === 'create-event')    result = createCalendarEvent({
      titre : e.parameter.titre || '', debut: e.parameter.debut || '', fin: e.parameter.fin || '',
      desc  : e.parameter.desc  || '', rappel: e.parameter.rappel || 30,
    });
    else if (action === 'create-doc')      result = createGoogleDoc(e.parameter.titre || '', e.parameter.contenu || '');
    else if (action === 'create-folder')   result = createDriveFolder(e.parameter.nom || '');
    else if (action === 'edit-doc')        result = editGoogleDoc(e.parameter.nom || '', e.parameter.contenu || '', e.parameter.mode || 'append');
    else if (action === 'notion-update')   result = notionUpdatePage(e.parameter.id || '', e.parameter.contenu || '');
    else if (action === 'auto-brief-on')   result = activerBriefMatinal();
    else if (action === 'auto-urgences-on') result = activerAlertesUrgences();
    else if (action === 'auto-resume-on')  result = activerResumeHebdo();
    else if (action === 'auto-rappels-on') result = activerRappelsAgenda();
    else if (action === 'auto-off')        result = desactiverAuto();
    else if (action === 'auto-status')     result = statutAutomatisations();
    else                                   result = { emails: getEmails(false), agenda: getAgenda() };
  } catch(err) {
    result = { error: err.toString() };
  }

  const json = JSON.stringify(result);

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// POST utilisé uniquement pour l'upload de fichiers — le contenu base64
// dépasse largement la limite d'une URL GET/JSONP. Le front envoie en
// Content-Type: text/plain pour éviter le préflight CORS (Apps Script ne
// sait pas répondre à une requête OPTIONS).
function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'upload-file') {
      result = uploadFile(body.filename || '', body.mimeType || '', body.data || '');
    } else {
      result = { error: 'Action POST inconnue.' };
    }
  } catch(err) {
    result = { error: err.toString() };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  NOTION
// ============================================================
function notionSearch(query) {
  if (!NOTION_KEY) return { error: 'Clé Notion vide — remplis NOTION_KEY dans le script et redéploie.' };

  const options = {
    method          : 'post',
    contentType     : 'application/json',
    headers         : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload         : JSON.stringify({ query: query || '', page_size: 10, sort: { direction: 'descending', timestamp: 'last_edited_time' } }),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch('https://api.notion.com/v1/search', options);
  const data = JSON.parse(res.getContentText());

  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };

  const pages = (data.results || []).map(item => ({
    titre   : _notionTitle(item),
    type    : item.object,
    modifié : (item.last_edited_time || '').split('T')[0],
    url     : item.url || '',
    id      : item.id  || '',
  })).filter(p => p.titre && p.titre !== 'Sans titre');

  return { pages, total: pages.length };
}

function notionCreate(titre, contenu) {
  if (!NOTION_KEY) return { error: 'Clé Notion non configurée.' };

  // Cherche la première page partagée pour y créer la sous-page
  const searchRes = notionSearch('');
  if (searchRes.error || !searchRes.pages?.length) {
    return { error: 'Aucune page Notion partagée. Partage tes pages avec l\'intégration ISIS dans Notion.' };
  }
  const parentId = searchRes.pages[0].id.replace(/-/g, '');

  const options = {
    method          : 'post',
    contentType     : 'application/json',
    headers         : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload         : JSON.stringify({
      parent    : { page_id: parentId },
      properties: { title: { title: [{ text: { content: titre } }] } },
      children  : contenu ? [{ object:'block', type:'paragraph', paragraph:{ rich_text:[{ text:{ content: contenu } }] } }] : [],
    }),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch('https://api.notion.com/v1/pages', options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion create HTTP ${res.getResponseCode()}` };
  return { success: true, titre, url: data.url };
}

function _notionTitle(item) {
  if (!item.properties) return item.title || 'Sans titre';
  for (const prop of Object.values(item.properties)) {
    if (prop.type === 'title' && prop.title?.length)
      return prop.title.map(t => t.plain_text).join('');
  }
  return 'Sans titre';
}

// ============================================================
//  CRM — contacts stockés dans une base Notion (auto-créée)
// ============================================================
function crmGetDatabaseId() {
  return PropertiesService.getScriptProperties().getProperty('CRM_DB_ID') || '';
}

function crmEnsureDatabase() {
  if (!NOTION_KEY) return { error: 'Clé Notion non configurée.' };

  const existing = crmGetDatabaseId();
  if (existing) return { id: existing };

  const searchRes = notionSearch('');
  if (searchRes.error || !searchRes.pages?.length) {
    return { error: 'Aucune page Notion partagée. Partage une page avec l\'intégration ISIS dans Notion pour initialiser le CRM.' };
  }
  const parentId = searchRes.pages[0].id.replace(/-/g, '');

  const options = {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({
      parent    : { type: 'page_id', page_id: parentId },
      title     : [{ type: 'text', text: { content: 'ISIS — Contacts CRM' } }],
      properties: {
        'Name'             : { title: {} },
        'Statut'           : { select: { options: [
          { name: 'Prospect',             color: 'blue'   },
          { name: 'Contacté',             color: 'yellow' },
          { name: 'Proposition envoyée',  color: 'orange' },
          { name: 'Client',               color: 'green'  },
          { name: 'Perdu',                color: 'red'    },
        ]}},
        'Téléphone'        : { phone_number: {} },
        'Email'            : { email: {} },
        'Entreprise'       : { rich_text: {} },
        'Notes'            : { rich_text: {} },
        'Prochaine action' : { date: {} },
      },
    }),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch('https://api.notion.com/v1/databases', options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };

  PropertiesService.getScriptProperties().setProperty('CRM_DB_ID', data.id);
  return { id: data.id, created: true };
}

function crmListContacts(statutFilter) {
  const ensure = crmEnsureDatabase();
  if (ensure.error) return { error: ensure.error };

  const payload = { page_size: 30, sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] };
  if (statutFilter) payload.filter = { property: 'Statut', select: { equals: statutFilter } };

  const options = {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${ensure.id}/query`, options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };

  const contacts = (data.results || []).map(_crmPageToContact);
  return { contacts, total: contacts.length };
}

function crmAddContact(params) {
  const ensure = crmEnsureDatabase();
  if (ensure.error) return { error: ensure.error };
  if (!params.nom) return { error: 'Nom du contact manquant.' };

  const properties = { 'Name': { title: [{ text: { content: params.nom } }] } };
  if (params.statut)          properties['Statut']            = { select: { name: params.statut } };
  if (params.telephone)       properties['Téléphone']         = { phone_number: params.telephone };
  if (params.email)           properties['Email']             = { email: params.email };
  if (params.entreprise)      properties['Entreprise']        = { rich_text: [{ text: { content: params.entreprise } }] };
  if (params.notes)           properties['Notes']             = { rich_text: [{ text: { content: params.notes } }] };
  if (params.prochaineAction) properties['Prochaine action']  = { date: { start: params.prochaineAction } };

  const options = {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({ parent: { database_id: ensure.id }, properties }),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch('https://api.notion.com/v1/pages', options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };
  return { success: true, id: data.id, url: data.url, nom: params.nom };
}

function crmUpdateContactStatut(nom, statut) {
  const ensure = crmEnsureDatabase();
  if (ensure.error) return { error: ensure.error };
  if (!nom || !statut) return { error: 'Nom ou statut manquant.' };

  const searchOptions = {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({ filter: { property: 'Name', title: { contains: nom } }, page_size: 1 }),
    muteHttpExceptions: true,
  };
  const searchRes  = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${ensure.id}/query`, searchOptions);
  const searchData = JSON.parse(searchRes.getContentText());
  if (searchRes.getResponseCode() !== 200) return { error: searchData.message || 'Erreur recherche contact.' };
  if (!searchData.results?.length) return { error: `Aucun contact trouvé pour "${nom}".` };

  const pageId = searchData.results[0].id;
  const patchOptions = {
    method            : 'patch',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({ properties: { 'Statut': { select: { name: statut } } } }),
    muteHttpExceptions: true,
  };
  const patchRes  = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${pageId}`, patchOptions);
  const patchData = JSON.parse(patchRes.getContentText());
  if (patchRes.getResponseCode() !== 200) return { error: patchData.message || 'Erreur mise à jour.' };

  return { success: true, nom: _crmPageToContact(patchData).nom, statut };
}

function _crmPageToContact(page) {
  const p  = page.properties || {};
  const rt = prop => (prop?.rich_text || []).map(t => t.plain_text).join('');
  return {
    id             : page.id,
    nom            : (p['Name']?.title || []).map(t => t.plain_text).join('') || 'Sans nom',
    statut         : p['Statut']?.select?.name || '',
    telephone      : p['Téléphone']?.phone_number || '',
    email          : p['Email']?.email || '',
    entreprise     : rt(p['Entreprise']),
    notes          : rt(p['Notes']),
    prochaineAction: p['Prochaine action']?.date?.start || '',
    url            : page.url,
  };
}

// ============================================================
//  CRM — miroir Google Sheet, synchronisé dans les deux sens
//  Notion → Sheet : à la demande (action crm-sync-sheet)
//  Sheet → Notion : automatique via le trigger crmOnSheetEdit
// ============================================================
const CRM_SHEET_COLS = ['Nom','Statut','Téléphone','Email','Entreprise','Notes','Prochaine action','NotionPageID','Notion URL'];

function crmGetOrCreateSheet() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty('CRM_SHEET_ID');
  if (existingId) {
    try { return SpreadsheetApp.openById(existingId); } catch(e) { /* recréée ci-dessous */ }
  }

  const ss    = SpreadsheetApp.create('ISIS — CRM');
  const sheet = ss.getActiveSheet();
  sheet.setName('Contacts');
  sheet.getRange(1, 1, 1, CRM_SHEET_COLS.length).setValues([CRM_SHEET_COLS]);
  sheet.setFrozenRows(1);
  sheet.getRange(2, 3, 998, 1).setNumberFormat('@'); // Téléphone en texte — évite que Sheets avale le "+"
  props.setProperty('CRM_SHEET_ID', ss.getId());
  return ss;
}

function crmSyncToSheet() {
  const listRes = crmListContacts('');
  if (listRes.error) return { error: listRes.error };

  const ss      = crmGetOrCreateSheet();
  const sheet   = ss.getSheetByName('Contacts') || ss.getActiveSheet();
  sheet.getRange(2, 3, 998, 1).setNumberFormat('@'); // corrige aussi les sheets déjà créés avant ce fix
  const lastRow = sheet.getLastRow();

  const rowByPageId = {};
  if (lastRow > 1) {
    sheet.getRange(2, 8, lastRow - 1, 1).getValues().forEach((r, i) => { if (r[0]) rowByPageId[r[0]] = i + 2; });
  }

  listRes.contacts.forEach(c => {
    const row = [c.nom, c.statut, c.telephone, c.email, c.entreprise, c.notes, c.prochaineAction, c.id, c.url];
    if (rowByPageId[c.id]) sheet.getRange(rowByPageId[c.id], 1, 1, row.length).setValues([row]);
    else                   sheet.appendRow(row);
  });

  return { success: true, url: ss.getUrl(), total: listRes.contacts.length };
}

function crmInitSheetSync() {
  const ss = crmGetOrCreateSheet();
  const hasTrigger = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === 'crmOnSheetEdit' && t.getTriggerSourceId() === ss.getId());
  if (!hasTrigger) ScriptApp.newTrigger('crmOnSheetEdit').forSpreadsheet(ss).onEdit().create();
  return crmSyncToSheet();
}

// Trigger installable — se déclenche sur toute édition manuelle du Sheet CRM
function crmOnSheetEdit(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== 'Contacts') return;
    const row = e.range.getRow();
    if (row === 1) return;
    const col = e.range.getColumn();
    if (col >= 8) return; // colonnes NotionPageID / Notion URL : lecture seule

    const values = sheet.getRange(row, 1, 1, CRM_SHEET_COLS.length).getValues()[0];
    const [nom, statut, telephone, email, entreprise, notes, prochaineAction, pageId] = values;
    if (!pageId) return; // ligne pas encore liée à une page Notion

    crmUpdateContactFields(pageId, { nom, statut, telephone, email, entreprise, notes, prochaineAction });
  } catch(err) {
    // Ne jamais bloquer l'édition du Sheet même si la synchro échoue
  }
}

function crmUpdateContactFields(pageId, params) {
  if (!NOTION_KEY || !pageId) return { error: 'Configuration manquante.' };

  const properties = {};
  if (params.nom)    properties['Name']   = { title: [{ text: { content: String(params.nom) } }] };
  if (params.statut) properties['Statut'] = { select: { name: String(params.statut) } };
  properties['Téléphone']  = { phone_number: params.telephone ? String(params.telephone) : null };
  properties['Email']      = { email: params.email ? String(params.email) : null };
  properties['Entreprise'] = { rich_text: params.entreprise ? [{ text: { content: String(params.entreprise) } }] : [] };
  properties['Notes']      = { rich_text: params.notes ? [{ text: { content: String(params.notes) } }] : [] };
  if (params.prochaineAction) properties['Prochaine action'] = { date: { start: _sheetDateToISO(params.prochaineAction) } };

  const options = {
    method            : 'patch',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({ properties }),
    muteHttpExceptions: true,
  };
  const res  = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${String(pageId).replace(/-/g,'')}`, options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };
  return { success: true };
}

function _sheetDateToISO(val) {
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(val);
}

// ============================================================
//  GOOGLE DRIVE
// ============================================================
function getDriveFiles(query) {
  const mimeLabels = {
    'application/vnd.google-apps.document'     : 'Google Doc',
    'application/vnd.google-apps.spreadsheet'  : 'Google Sheets',
    'application/vnd.google-apps.presentation' : 'Google Slides',
    'application/vnd.google-apps.folder'       : 'Dossier',
    'application/pdf'                          : 'PDF',
  };

  const searchQ = query
    ? `title contains '${query.replace(/'/g,"\\'")}' and trashed = false`
    : 'trashed = false';

  const iter  = DriveApp.searchFiles(searchQ);
  const files = [];

  while (iter.hasNext() && files.length < 12) {
    const f    = iter.next();
    const mime = f.getMimeType();
    files.push({
      nom     : f.getName(),
      type    : mimeLabels[mime] || mime.split('/').pop(),
      modifié : Utilities.formatDate(f.getLastUpdated(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
      id      : f.getId(),
      url     : f.getUrl(),
    });
  }

  return { files, total: files.length };
}

function getDriveDocContent(fileId) {
  if (!fileId) return { error: 'ID de fichier manquant.' };
  try {
    const file = DriveApp.getFileById(fileId);
    const mime = file.getMimeType();

    if (mime === MimeType.GOOGLE_DOCS) {
      const doc = DocumentApp.openById(fileId);
      return { titre: doc.getName(), contenu: doc.getBody().getText().substring(0, 3000) };
    }

    if (mime === MimeType.PDF) {
      // Nécessite le service avancé "Drive API" activé dans l'éditeur Apps
      // Script (Services → + → Drive API) — sert à convertir le PDF en
      // Google Doc via OCR pour en extraire le texte.
      if (typeof Drive === 'undefined') {
        return { error: 'Lecture PDF non disponible : active le service avancé "Drive API" dans l\'éditeur Apps Script (Services → + → Drive API), puis redéploie.' };
      }
      let ocrDoc;
      try {
        ocrDoc = Drive.Files.copy(
          { title: '_ISIS_OCR_TEMP_' + file.getName(), mimeType: MimeType.GOOGLE_DOCS },
          fileId,
          { ocr: true, ocrLanguage: 'fr' }
        );
        const doc     = DocumentApp.openById(ocrDoc.id);
        const contenu = doc.getBody().getText().substring(0, 3000);
        DriveApp.getFileById(ocrDoc.id).setTrashed(true);
        return { titre: file.getName(), contenu };
      } catch(e2) {
        if (ocrDoc?.id) try { DriveApp.getFileById(ocrDoc.id).setTrashed(true); } catch(_) {}
        return { error: 'OCR du PDF impossible : ' + e2.toString() };
      }
    }

    return { error: `Type de fichier non pris en charge pour la lecture (${mime}). Seuls Google Docs et PDF sont supportés.` };
  } catch(e) {
    return { error: 'Impossible de lire ce fichier : ' + e.toString() };
  }
}

function uploadFile(filename, mimeType, base64Data) {
  if (!filename || !base64Data) return { error: 'Nom de fichier ou contenu manquant.' };
  try {
    const bytes = Utilities.base64Decode(base64Data);
    const blob  = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', filename);
    const file  = DriveApp.createFile(blob);
    return { success: true, id: file.getId(), url: file.getUrl(), nom: filename };
  } catch(e) {
    return { error: e.toString() };
  }
}

// ============================================================
//  GMAIL
// ============================================================
function getEmails(unreadOnly) {
  const query   = unreadOnly ? 'in:inbox is:unread' : 'in:inbox';
  const threads = GmailApp.search(query, 0, 20);
  const urgentKw = /urgent|important|asap|deadline|rappel|action requise|relance|priorité|critique|immédiat/i;
  const emails   = [];

  for (const thread of threads) {
    const msgs      = thread.getMessages();
    const last      = msgs[msgs.length - 1];
    const from      = last.getFrom();
    const fromEmail = from.match(/<(.+)>/)?.[1] || from;
    const fromName  = from.replace(/<.+>/, '').replace(/"/g, '').trim() || fromEmail;
    const subject   = thread.getFirstMessageSubject();
    const body      = last.getPlainBody().substring(0, 300).replace(/\s+/g, ' ').trim();

    let urgency = 0;
    if (thread.isUnread())         urgency += 2;
    if (urgentKw.test(subject))    urgency += 4;
    if (urgentKw.test(body))       urgency += 2;
    if (last.isStarred())          urgency += 2;
    if (thread.isImportant())      urgency += 1;
    urgency = Math.min(urgency, 10);

    emails.push({
      subject, fromName, fromEmail, urgency,
      date   : Utilities.formatDate(last.getDate(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
      unread : thread.isUnread(),
      niveau : urgency >= 7 ? 'CRITIQUE' : urgency >= 4 ? 'IMPORTANT' : 'NORMAL',
      preview: body,
    });
  }

  emails.sort((a, b) => b.urgency - a.urgency);
  return { nonLus: GmailApp.getInboxUnreadCount(), urgents: emails.filter(e => e.urgency >= 7).length, emails };
}

// ============================================================
//  AGENDA
// ============================================================
function getAgenda(joursSuivants) {
  const jours  = joursSuivants || 7;
  const now    = new Date();
  const end    = new Date(now.getTime() + jours * 86400000);
  const events = [];

  for (const cal of CalendarApp.getAllCalendars()) {
    for (const ev of cal.getEvents(now, end)) {
      const start = ev.getStartTime();
      events.push({
        titre      : ev.getTitle(),
        debut      : Utilities.formatDate(start, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
        fin        : Utilities.formatDate(ev.getEndTime(), Session.getScriptTimeZone(), 'HH:mm'),
        lieu       : ev.getLocation() || '',
        aujoudhui  : start.toDateString() === now.toDateString(),
        demain     : new Date(now.getTime()+86400000).toDateString() === start.toDateString(),
        dansMinutes: Math.round((start-now)/60000),
      });
    }
  }
  events.sort((a,b) => new Date(a.debut)-new Date(b.debut));
  return { aujoudhui: events.filter(e=>e.aujoudhui).length, total: events.length, events };
}

// ============================================================
//  ACTIONS D'ÉCRITURE — Email / Agenda / Docs / Drive / Notion
// ============================================================
function sendEmailISIS(to, subject, body) {
  if (!to || !subject) return { error: 'Destinataire ou sujet manquant.' };
  try {
    GmailApp.sendEmail(to, subject, body || '');
    return { success: true };
  } catch(e) {
    return { error: e.toString() };
  }
}

function createCalendarEvent(params) {
  if (!params.titre || !params.debut) return { error: 'Titre ou date de début manquant.' };
  try {
    const start = new Date(params.debut);
    const end   = params.fin ? new Date(params.fin) : new Date(start.getTime() + 3600000);
    const rappel = parseInt(params.rappel, 10) || 30;

    const event = CalendarApp.getDefaultCalendar().createEvent(params.titre, start, end, {
      description: params.desc || '',
    });
    event.removeAllReminders();
    event.addPopupReminder(rappel);

    return { success: true, rappel, id: event.getId() };
  } catch(e) {
    return { error: e.toString() };
  }
}

function createGoogleDoc(titre, contenu) {
  if (!titre) return { error: 'Titre manquant.' };
  try {
    const doc = DocumentApp.create(titre);
    if (contenu) doc.getBody().setText(contenu);
    doc.saveAndClose();
    const file = DriveApp.getFileById(doc.getId());
    return { success: true, url: file.getUrl(), id: doc.getId(), titre };
  } catch(e) {
    return { error: e.toString() };
  }
}

function createDriveFolder(nom) {
  if (!nom) return { error: 'Nom manquant.' };
  try {
    const folder = DriveApp.createFolder(nom);
    return { success: true, nom, url: folder.getUrl() };
  } catch(e) {
    return { error: e.toString() };
  }
}

function editGoogleDoc(nom, contenu, mode) {
  if (!nom) return { error: 'Nom du document manquant.' };
  try {
    const iter = DriveApp.searchFiles(
      `title contains '${nom.replace(/'/g,"\\'")}' and mimeType = '${MimeType.GOOGLE_DOCS}' and trashed = false`
    );
    if (!iter.hasNext()) return { error: `Aucun document nommé "${nom}" trouvé.` };
    const file = iter.next();
    const doc  = DocumentApp.openById(file.getId());
    const body = doc.getBody();

    if (mode === 'replace') body.setText(contenu);
    else                    body.appendParagraph(contenu);
    doc.saveAndClose();

    return { success: true, titre: doc.getName(), url: file.getUrl(), id: doc.getId() };
  } catch(e) {
    return { error: e.toString() };
  }
}

function notionUpdatePage(pageId, contenu) {
  if (!NOTION_KEY) return { error: 'Clé Notion non configurée.' };
  if (!pageId)      return { error: 'ID de page Notion manquant.' };

  const options = {
    method            : 'patch',
    contentType       : 'application/json',
    headers           : { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28' },
    payload           : JSON.stringify({
      children: [{ object:'block', type:'paragraph', paragraph:{ rich_text:[{ text:{ content: contenu || '' } }] } }],
    }),
    muteHttpExceptions: true,
  };

  const res  = UrlFetchApp.fetch(`https://api.notion.com/v1/blocks/${pageId.replace(/-/g,'')}/children`, options);
  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) return { error: data.message || `Notion HTTP ${res.getResponseCode()}` };
  return { success: true };
}

// ============================================================
//  ACTUALITÉS — flux RSS Google News, gratuit, sans clé
// ============================================================
function getNews() {
  const feeds = [
    { key: 'geopolitique', label: 'Géopolitique',       url: 'https://news.google.com/rss/search?q=g%C3%A9opolitique%20when:1d&hl=fr&gl=FR&ceid=FR:fr' },
    { key: 'finance',      label: 'Économie & Finance',  url: 'https://news.google.com/rss/search?q=%C3%A9conomie%20OR%20bourse%20OR%20finance%20when:1d&hl=fr&gl=FR&ceid=FR:fr' },
    { key: 'politique',    label: 'Politique (France)',  url: 'https://news.google.com/rss/search?q=politique%20France%20when:1d&hl=fr&gl=FR&ceid=FR:fr' },
    { key: 'monde',        label: 'À la une',            url: 'https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr' },
  ];

  const news = {};
  feeds.forEach(f => {
    try {
      const res = UrlFetchApp.fetch(f.url, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) { news[f.key] = { label: f.label, items: [] }; return; }
      const doc     = XmlService.parse(res.getContentText());
      const channel = doc.getRootElement().getChild('channel');
      const items   = (channel ? channel.getChildren('item') : []).slice(0, 4);
      news[f.key] = {
        label: f.label,
        items: items.map(it => ({
          titre: (it.getChild('title')?.getText() || '').replace(/\s*-\s*[^-]+$/, ''),
          url  : it.getChild('link')?.getText() || '',
        })),
      };
    } catch(e) {
      news[f.key] = { label: f.label, items: [] };
    }
  });

  return { news };
}

// ============================================================
//  AUTOMATISATIONS
// ============================================================
function activerBriefMatinal() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'envoyerBriefMatinal')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('envoyerBriefMatinal').timeBased().everyDays(1).atHour(8).create();
  return { success: true, message: 'Brief matinal activé à 8h chaque matin.' };
}

function activerAlertesUrgences() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'verifierUrgences')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('verifierUrgences').timeBased().everyHours(1).create();
  return { success: true, message: 'Alertes urgences activées — vérification toutes les heures.' };
}

function activerResumeHebdo() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'envoyerResumeHebdo')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('envoyerResumeHebdo').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  return { success: true, message: 'Résumé hebdomadaire activé — chaque lundi à 8h.' };
}

function activerRappelsAgenda() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'verifierRappelsAgenda')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('verifierRappelsAgenda').timeBased().everyMinutes(15).create();
  return { success: true, message: 'Rappels agenda activés — vérification toutes les 15 minutes.' };
}

function desactiverAuto() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  return { success: true, message: 'Toutes les automatisations désactivées.' };
}

function statutAutomatisations() {
  const triggers = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  return {
    briefMatinal      : triggers.includes('envoyerBriefMatinal'),
    alertesUrgences   : triggers.includes('verifierUrgences'),
    resumeHebdomadaire: triggers.includes('envoyerResumeHebdo'),
    rappelsAgenda     : triggers.includes('verifierRappelsAgenda'),
    total: triggers.length,
  };
}

function envoyerBriefMatinal() {
  const emailData  = getEmails(true);
  const agendaData = getAgenda(1);
  const user = Session.getActiveUser().getEmail();
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEEE dd MMMM yyyy');

  let corps = 'Bonjour,\n\nVoici votre brief ISIS du ' + date + '\n\n';

  const evJour = agendaData.events.filter(e => e.aujoudhui);
  corps += '── AGENDA DU JOUR ──────────────────\n';
  if (evJour.length === 0) {
    corps += 'Aucun événement aujourd\'hui.\n';
  } else {
    evJour.forEach(ev => {
      corps += ev.debut.split(' ')[1] + ' — ' + ev.titre + (ev.lieu ? ' (' + ev.lieu + ')' : '') + '\n';
    });
  }

  const urgents = emailData.emails.filter(e => e.urgency >= 4).slice(0, 5);
  corps += '\n── EMAILS IMPORTANTS ───────────────\n';
  if (urgents.length === 0) {
    corps += 'Aucun email urgent.\n';
  } else {
    urgents.forEach(e => {
      corps += '[' + e.niveau + '] ' + e.fromName + ' — ' + e.subject + '\n';
    });
  }
  corps += '\n' + emailData.nonLus + ' emails non lus au total.\n\nBonne journée,\nISIS';

  GmailApp.sendEmail(user, 'ISIS — Brief du ' + date, corps);
}

function verifierUrgences() {
  const data  = getEmails(true);
  const crits = data.emails.filter(e => e.urgency >= 7 && e.unread);
  if (crits.length === 0) return;
  const user  = Session.getActiveUser().getEmail();
  const lines = crits.map(e => e.fromName + ' — ' + e.subject).join('\n');
  GmailApp.sendEmail(user, 'ISIS ALERTE — ' + crits.length + ' email(s) critique(s)', lines);
}

function envoyerResumeHebdo() {
  const emailData  = getEmails(false);
  const agendaData = getAgenda(7);
  const user = Session.getActiveUser().getEmail();
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEEE dd MMMM yyyy');

  let corps = 'Bonjour,\n\nVoici votre résumé hebdomadaire ISIS du ' + date + '\n\n';
  corps += '── AGENDA DE LA SEMAINE ────────────\n';
  if (agendaData.events.length === 0) {
    corps += 'Aucun événement prévu.\n';
  } else {
    agendaData.events.forEach(ev => {
      corps += ev.debut + ' — ' + ev.titre + (ev.lieu ? ' (' + ev.lieu + ')' : '') + '\n';
    });
  }
  corps += '\n' + emailData.nonLus + ' emails non lus, ' + emailData.urgents + ' urgent(s).\n\nBonne semaine,\nISIS';

  GmailApp.sendEmail(user, 'ISIS — Résumé hebdomadaire du ' + date, corps);
}

function verifierRappelsAgenda() {
  const data   = getAgenda(1);
  const proches = data.events.filter(e => e.dansMinutes >= 0 && e.dansMinutes <= 30);
  if (proches.length === 0) return;
  const user  = Session.getActiveUser().getEmail();
  const lines = proches.map(e => e.titre + ' — dans ' + e.dansMinutes + ' min' + (e.lieu ? ' (' + e.lieu + ')' : '')).join('\n');
  GmailApp.sendEmail(user, 'ISIS RAPPEL — événement(s) à venir', lines);
}
