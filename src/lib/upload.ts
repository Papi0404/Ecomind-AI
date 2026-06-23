import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { prisma } from './prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx'];
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Magic bytes checks for security (anti-malware validation)
const MAGIC_BYTES: Record<string, string> = {
  '89504e47': 'image/png',
  'ffd8ffe0': 'image/jpeg',
  'ffd8ffe1': 'image/jpeg',
  'ffd8ffe2': 'image/jpeg',
  'ffd8ffdb': 'image/jpeg',
  '47494638': 'image/gif',
  '25504446': 'application/pdf',
  '504b0304': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // ZIP header used by docx
};

// Initialize Supabase client for storage
function getSupabaseClient() {
  // Extract project ref from DATABASE_URL for Supabase Storage
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/postgres\.([a-z0-9]+):/);
  const projectRef = match ? match[1] : '';

  if (!projectRef) {
    throw new Error('Could not extract Supabase project ref from DATABASE_URL. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  }

  const supabaseUrl = process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY is required in .env for file uploads.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export async function uploadFile(
  file: File,
  userId: string
): Promise<UploadResult> {
  // 1. File Size Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  // 2. File Extension and MIME Validation
  const fileExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    throw new Error(`File extension ${fileExt} is not allowed.`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`MIME type ${file.type} is not allowed.`);
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Security validation: Check Magic Bytes (headers)
  const hexHeader = buffer.toString('hex', 0, 4);
  let magicMime = null;
  for (const [sig, mime] of Object.entries(MAGIC_BYTES)) {
    if (hexHeader.startsWith(sig)) {
      magicMime = mime;
      break;
    }
  }

  // Special check for jpeg/jpg since they can start slightly differently
  const hexHeader3 = buffer.toString('hex', 0, 3);
  if (!magicMime && hexHeader3 === 'ffd8ff') {
    magicMime = 'image/jpeg';
  }

  if (!magicMime) {
    throw new Error('File header validation failed. Possible malicious file format.');
  }

  // 4. Upload to Supabase Storage (works on Vercel serverless — no read-only filesystem issues)
  const supabase = getSupabaseClient();

  // Generate unique clean filename
  const sanitizedTitle = file.name
    .replace(/[^a-zA-Z0-9.]/g, '_')
    .replace(/_{2,}/g, '_');
  const uniqueFilename = `${Date.now()}_${userId.slice(0, 5)}_${sanitizedTitle}`;
  const storagePath = `uploads/${uniqueFilename}`;

  const { data, error } = await supabase.storage
    .from('ecomind-uploads')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('ecomind-uploads')
    .getPublicUrl(storagePath);

  const fileUrl = publicUrlData.publicUrl;

  // 5. Save metadata to database
  await prisma.upload.create({
    data: {
      userId,
      url: fileUrl,
      filename: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    },
  });

  return {
    url: fileUrl,
    filename: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}
