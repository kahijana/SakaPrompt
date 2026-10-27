import { Prompt } from '../types/prompt';

/**
 * Complete, battle-tested Google Apps Script code to paste in Extensions > Apps Script
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script Backend for Saka Prompt
 * Spreadsheet: "Saka Prompt DB"
 * Sheet: "Prompts"
 * 
 * Instructions:
 * 1. In your Google Sheet, go to Extensions > Apps Script.
 * 2. Delete any code in Code.gs and paste this complete script.
 * 3. Click "Deploy" > "New deployment".
 * 4. Select type: "Web app".
 * 5. Set Description: "Saka Prompt API".
 * 6. Execute as: "Me" (your Google account).
 * 7. Who has access: "Anyone" (allows web app to fetch without auth friction).
 * 8. Click "Deploy", authorize access, and copy the Web App URL.
 */

const SHEET_NAME = "Prompts";
const HEADERS = ["id", "title", "content", "category", "tags", "favorite", "createdAt", "updatedAt", "imageUrl"];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f4f4f5");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (action === 'ping') {
      const rowCount = Math.max(0, data.length - 1);
      return jsonResponse({
        success: true,
        message: "Google Apps Script connection active",
        count: rowCount,
        sheetName: sheet.getName(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'list') {
      const prompts = [];
      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue; // skip blank ID
          
          let tags = [];
          if (typeof row[4] === 'string') {
            tags = row[4].split(',').map(t => t.trim()).filter(Boolean);
          } else if (Array.isArray(row[4])) {
            tags = row[4];
          }

          prompts.push({
            id: String(row[0]),
            title: String(row[1] || ''),
            content: String(row[2] || ''),
            category: String(row[3] || 'General'),
            tags: tags,
            favorite: Boolean(row[5] === true || String(row[5]).toLowerCase() === 'true'),
            createdAt: row[6] ? new Date(row[6]).toISOString() : new Date().toISOString(),
            updatedAt: row[7] ? new Date(row[7]).toISOString() : new Date().toISOString(),
            imageUrl: row[8] ? String(row[8]) : undefined
          });
        }
      }
      return jsonResponse({ success: true, prompts: prompts });
    }

    return jsonResponse({ success: false, error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests
  const hasLock = lock.tryLock(10000);
  if (!hasLock) {
    return jsonResponse({ success: false, error: "Server busy, could not acquire lock" });
  }

  try {
    const sheet = getOrCreateSheet();
    let body = {};

    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || (e && e.parameter && e.parameter.action) || 'create';
    const now = new Date().toISOString();

    if (action === 'create') {
      const prompt = body.prompt || body;
      const id = prompt.id || ('p_' + Utilities.getUuid().substring(0, 8));
      const tagsStr = Array.isArray(prompt.tags) ? prompt.tags.join(', ') : (prompt.tags || '');
      
      const newRow = [
        id,
        prompt.title || 'Untitled Prompt',
        prompt.content || '',
        prompt.category || 'General',
        tagsStr,
        prompt.favorite ? true : false,
        prompt.createdAt || now,
        prompt.updatedAt || now,
        prompt.imageUrl || ''
      ];

      sheet.appendRow(newRow);

      return jsonResponse({
        success: true,
        action: 'create',
        prompt: {
          id: id,
          title: prompt.title || 'Untitled Prompt',
          content: prompt.content || '',
          category: prompt.category || 'General',
          tags: Array.isArray(prompt.tags) ? prompt.tags : tagsStr.split(',').map(t => t.trim()).filter(Boolean),
          favorite: Boolean(prompt.favorite),
          createdAt: prompt.createdAt || now,
          updatedAt: prompt.updatedAt || now,
          imageUrl: prompt.imageUrl || undefined
        }
      });
    }

    if (action === 'update') {
      const prompt = body.prompt || body;
      if (!prompt.id) return jsonResponse({ success: false, error: "Prompt ID required" });

      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(prompt.id)) {
          rowIndex = i + 1; // 1-based index in Google Sheets
          break;
        }
      }

      if (rowIndex === -1) {
        return jsonResponse({ success: false, error: "Prompt not found: " + prompt.id });
      }

      const tagsStr = Array.isArray(prompt.tags) ? prompt.tags.join(', ') : (prompt.tags || '');
      const createdAt = data[rowIndex - 1][6] || now;

      sheet.getRange(rowIndex, 1, 1, 9).setValues([[
        prompt.id,
        prompt.title || '',
        prompt.content || '',
        prompt.category || 'General',
        tagsStr,
        prompt.favorite ? true : false,
        createdAt,
        now,
        prompt.imageUrl || ''
      ]]);

      return jsonResponse({
        success: true,
        action: 'update',
        prompt: {
          ...prompt,
          updatedAt: now
        }
      });
    }

    if (action === 'delete') {
      const id = body.id || (body.prompt && body.prompt.id);
      if (!id) return jsonResponse({ success: false, error: "ID required for deletion" });

      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return jsonResponse({ success: false, error: "Prompt not found for deletion" });
      }

      sheet.deleteRow(rowIndex);
      return jsonResponse({ success: true, action: 'delete', id: id });
    }

    if (action === 'bulkSync') {
      // Replace or populate all rows
      const prompts = body.prompts || [];
      sheet.clearContents();
      sheet.appendRow(HEADERS);

      if (prompts.length > 0) {
        const rows = prompts.map(p => [
          p.id || ('p_' + Utilities.getUuid().substring(0, 8)),
          p.title || '',
          p.content || '',
          p.category || 'General',
          Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
          p.favorite ? true : false,
          p.createdAt || now,
          p.updatedAt || now,
          p.imageUrl || ''
        ]);
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }

      return jsonResponse({ success: true, action: 'bulkSync', count: prompts.length });
    }

    return jsonResponse({ success: false, error: "Invalid action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}
`;

/**
 * Make a safe request to Google Apps Script Web App.
 * Uses text/plain payload to avoid browser CORS preflight blocks.
 */
async function callGAS(url: string, payload: { action: string; [key: string]: unknown }): Promise<any> {
  const cleanUrl = url.trim();
  if (!cleanUrl) throw new Error("No Google Apps Script URL provided");

  const response = await fetch(cleanUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from Google Apps Script: ${text.slice(0, 120)}`);
  }
}

export async function testConnectionGAS(url: string): Promise<{ success: boolean; message: string; count?: number }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, message: 'Apps Script URL is empty' };
  }

  try {
    const testUrl = new URL(cleanUrl);
    testUrl.searchParams.set('action', 'ping');

    const res = await fetch(testUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} response from server`);
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Connected successfully to Google Sheet',
        count: data.count,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Server reported an error',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect. Check URL and Web App permissions.',
    };
  }
}

export async function fetchPromptsFromGAS(url: string): Promise<Prompt[]> {
  const cleanUrl = url.trim();
  const fetchUrl = new URL(cleanUrl);
  fetchUrl.searchParams.set('action', 'list');

  const res = await fetch(fetchUrl.toString(), {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Error fetching prompts: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch prompts from Google Sheet');
  }

  return (data.prompts || []).map((p: any) => ({
    id: String(p.id),
    title: String(p.title || 'Untitled'),
    content: String(p.content || ''),
    category: String(p.category || 'General'),
    tags: Array.isArray(p.tags) ? p.tags : [],
    favorite: Boolean(p.favorite),
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
    imageUrl: p.imageUrl ? String(p.imageUrl) : undefined,
  }));
}

export async function createPromptGAS(url: string, prompt: Prompt): Promise<Prompt> {
  const res = await callGAS(url, {
    action: 'create',
    prompt,
  });

  if (!res.success) {
    throw new Error(res.error || 'Failed to create prompt in Google Sheet');
  }

  return res.prompt || prompt;
}

export async function updatePromptGAS(url: string, prompt: Prompt): Promise<Prompt> {
  const res = await callGAS(url, {
    action: 'update',
    prompt,
  });

  if (!res.success) {
    throw new Error(res.error || 'Failed to update prompt in Google Sheet');
  }

  return res.prompt || prompt;
}

export async function deletePromptGAS(url: string, id: string): Promise<boolean> {
  const res = await callGAS(url, {
    action: 'delete',
    id,
  });

  if (!res.success) {
    throw new Error(res.error || 'Failed to delete prompt from Google Sheet');
  }

  return true;
}

export async function bulkSyncPromptsGAS(url: string, prompts: Prompt[]): Promise<boolean> {
  const res = await callGAS(url, {
    action: 'bulkSync',
    prompts,
  });

  if (!res.success) {
    throw new Error(res.error || 'Failed to bulk sync prompts to Google Sheet');
  }

  return true;
}
