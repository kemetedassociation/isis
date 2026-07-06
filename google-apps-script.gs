// ============================================================
//  ISIS — GOOGLE APPS SCRIPT v4
//  Proxy pour : Gmail + Google Agenda + Notion
//
//  CONFIGURATION :
//  1. Collez votre clé Notion ci-dessous (ligne NOTION_KEY)
//  2. Déployez → Nouvelle version → Déployer
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
    else if (action === 'auto-brief-on')   result = activerBriefMatinal();
    else if (action === 'auto-urgences-on') result = activerAlertesUrgences();
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
    const doc     = DocumentApp.openById(fileId);
    const contenu = doc.getBody().getText().substring(0, 3000);
    return { titre: doc.getName(), contenu };
  } catch(e) {
    return { error: 'Impossible de lire ce fichier : ' + e.toString() };
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

function desactiverAuto() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  return { success: true, message: 'Toutes les automatisations désactivées.' };
}

function statutAutomatisations() {
  const triggers = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  return {
    briefMatinal : triggers.includes('envoyerBriefMatinal'),
    alertesUrgences: triggers.includes('verifierUrgences'),
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
