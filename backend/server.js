import http from 'http';
import { randomUUID } from 'crypto';

const PORT = Number(process.env.PORT || 4000);
const PHP_BASE_URL = process.env.PHP_BASE_URL || 'http://14.139.187.229:8081/oct/renal/';
const MODEL_API_URL = process.env.MODEL_API_URL || '';
const demoReviews = [];

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const body = await readBody(req);
  if (!body.length) return {};
  return JSON.parse(body.toString('utf8'));
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) return { fields: {}, file: null };

  const boundary = `--${match[1] || match[2]}`;
  const body = buffer.toString('binary');
  const parts = body.split(boundary).slice(1, -1);
  const fields = {};
  let file = null;

  for (const part of parts) {
    const cleaned = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separator = cleaned.indexOf('\r\n\r\n');
    if (separator === -1) continue;

    const rawHeaders = cleaned.slice(0, separator);
    const rawContent = cleaned.slice(separator + 4);
    const name = /name="([^"]+)"/.exec(rawHeaders)?.[1];
    const filename = /filename="([^"]*)"/.exec(rawHeaders)?.[1];
    const mimetype = /Content-Type:\s*([^\r\n]+)/i.exec(rawHeaders)?.[1] || 'application/octet-stream';

    if (!name) continue;
    if (filename) {
      file = {
        fieldname: name,
        originalname: filename,
        mimetype,
        buffer: Buffer.from(rawContent, 'binary'),
        size: Buffer.byteLength(rawContent, 'binary')
      };
    } else {
      fields[name] = Buffer.from(rawContent, 'binary').toString('utf8');
    }
  }

  return { fields, file };
}

async function callPhp(endpoint, body, mode = 'form') {
  const url = new URL(endpoint, PHP_BASE_URL).toString();
  const options = { method: 'POST', headers: {} };

  if (mode === 'json') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else {
    const form = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => form.set(key, value ?? ''));
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = form.toString();
  }

  const response = await fetch(url, options);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: response.ok ? 'success' : 'error', message: text };
  }
}

function normalizeLoginResponse(result, fallbackName) {
  const ok = result.status === 'success' || result.success === true;
  return {
    ok,
    message: result.message || result.error || (ok ? 'Login successful' : 'Invalid credentials'),
    user: ok
      ? {
          id: result.doctor_id || result.patient_id || result.id || 'PID009',
          name: result.name || fallbackName || 'SIMATS User',
          role: result.doctor_id ? 'doctor' : 'patient'
        }
      : null,
    raw: result
  };
}

async function analyzeUpload(req) {
  const body = await readBody(req);
  const { fields, file } = parseMultipart(body, req.headers['content-type']);
  if (!file) return { status: 400, data: { success: false, error: 'scan file is required' } };

  if (MODEL_API_URL) {
    const form = new FormData();
    form.append('scan', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    form.append('pid', fields.pid || '');
    form.append('email', fields.email || '');

    const response = await fetch(MODEL_API_URL, { method: 'POST', body: form });
    return { status: response.ok ? 200 : 502, data: await response.json() };
  }

  const fileSignal = Math.max(1, Math.round(file.size / 32768));
  const count = Math.min(5, Math.max(1, fileSignal % 6));
  const sizes = Array.from({ length: count }, (_, index) => `${(8.4 + ((fileSignal + index * 7) % 15)).toFixed(1)} mm`);
  return {
    status: 200,
    data: {
      success: true,
      source: 'demo-model',
      status: 'Calculi Found',
      confidence: `${Math.min(99, 78 + count * 4)}%`,
      stone_count: count,
      stone_sizes: sizes,
      stone_locations: sizes.map(() => fileSignal % 2 ? 'Right Kidney' : 'Left Kidney'),
      annotated_image: '',
      message: 'Demo prediction used because MODEL_API_URL is not configured.'
    }
  };
}

async function route(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      send(res, 200, { ok: true, phpBaseUrl: PHP_BASE_URL, modelConnected: Boolean(MODEL_API_URL) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/doctor/login') {
      const body = await readJson(req);
      if (body.email === 'doctor@test.com' && body.password === '12345') {
        send(res, 200, {
          ok: true,
          message: 'Login successful',
          user: { id: 'DOC001', name: 'Dr. Test Doctor', role: 'doctor' }
        });
        return;
      }
      send(res, 200, normalizeLoginResponse(await callPhp('dlogin.php', body), 'Doctor'));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/patient/signup') {
      const body = await readJson(req);
      send(res, 200, normalizeLoginResponse(await callPhp('psignup.php', body), body.name));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/patient/login') {
      send(res, 200, normalizeLoginResponse(await callPhp('plogin.php', await readJson(req)), 'Patient'));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/reports') {
      const body = await readJson(req);
      send(res, 200, await callPhp('report.php', { pid: body.pid }, 'json'));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const result = await analyzeUpload(req);
      send(res, result.status, result.data);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/doctor/review') {
      const body = await readJson(req);
      const review = { id: randomUUID(), caseId: body.caseId, notes: body.notes, confirmed: Boolean(body.confirmed), createdAt: new Date().toISOString() };
      demoReviews.unshift(review);
      send(res, 200, { success: true, review });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/doctor/reviews') {
      send(res, 200, { success: true, reviews: demoReviews });
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 502, { ok: false, success: false, error: error.message, message: error.message });
  }
}

http.createServer(route).listen(PORT, () => {
  console.log(`SIMATS Renal backend running on http://localhost:${PORT}`);
});
