import fs from 'fs';
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

  // 4. Save file locally inside Next.js public directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate unique clean filename
  const sanitizedTitle = file.name
    .replace(/[^a-zA-Z0-9.]/g, '_')
    .replace(/_{2,}/g, '_');
  const uniqueFilename = `${Date.now()}_${userId.slice(0, 5)}_${sanitizedTitle}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/${uniqueFilename}`;

  // 5. Save to database
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
