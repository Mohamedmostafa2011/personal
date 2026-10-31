import Busboy from 'busboy';
import {uploadFile} from '@huggingface/hub';
import {authenticated,validOrigin,init,method} from '../lib/security.js';
export const config = { api: { bodyParser: false } };
const MAX_FILE = 4 * 1024 * 1024;
const REPO = 'MidoSTM11/Mido';
function parse(req) {
  return new Promise((resolve,reject) => {
    let bus, result, error;
    try { bus = Busboy({headers:req.headers, defParamCharset:'utf8', limits:{fileSize:MAX_FILE + 1,files:1,fields:0}}); } catch { reject(new Error('Invalid multipart request.')); return; }
    bus.on('file',(field, stream, info) => {
      const filename = info.filename;
      if (field !== 'file' || !filename || filename === '.' || filename === '..' || /[\\/\x00-\x1f\x7f]/.test(filename) || Buffer.byteLength(filename) > 240) error = 'Invalid filename.';
      const chunks=[]; let size=0;
      stream.on('data', chunk => { size += chunk.length; chunks.push(chunk); });
      stream.on('limit', () => { error = 'File exceeds the 4 MiB limit.'; });
      stream.on('end', () => { result = {filename, content:Buffer.concat(chunks), size}; });
    });
    bus.on('filesLimit',()=>{error='Only one file is allowed.'});
    bus.on('fieldsLimit',()=>{error='Unexpected form field.'});
    bus.on('error',()=>reject(new Error('Invalid multipart request.')));
    bus.on('close',()=> error ? reject(new Error(error)) : result ? resolve(result) : reject(new Error('Choose a file.')));
    req.pipe(bus);
  });
}
export function createUploadHandler(sendToHub = uploadFile) {
return async function handler(req,res) {
  init(res); if (!method(req,res,'POST')) return;
  if (!validOrigin(req)) return res.status(403).json({error:'Request not allowed.'});
  if (!authenticated(req)) return res.status(401).json({error:'Please sign in again.'});
  if (!process.env.HF_TOKEN || process.env.HF_REPO_ID !== REPO) return res.status(503).json({error:'Upload service is not configured.'});
  const length = Number(req.headers['content-length']);
  if (Number.isFinite(length) && length > MAX_FILE + 64 * 1024) return res.status(413).json({error:'File exceeds the 4 MiB limit.'});
  let file;
  try { file = await parse(req); } catch (e) { return res.status(400).json({error:e.message}); }
  try {
    const result = await sendToHub({repo:{type:'dataset',name:process.env.HF_REPO_ID}, accessToken:process.env.HF_TOKEN, branch:'main', file:{path:file.filename,content:new Blob([file.content])}, commitTitle:`Upload ${file.filename}`});
    if (!result) throw new Error('No commit confirmation');
    const encodedRepo = REPO.split('/').map(encodeURIComponent).join('/');
    const url = `https://huggingface.co/datasets/${encodedRepo}/resolve/main/${encodeURIComponent(file.filename)}`;
    return res.status(200).json({filename:file.filename,url});
  } catch { return res.status(502).json({error:'Upload failed. Please try again or check the repository configuration.'}); }
}

}
export default createUploadHandler();
