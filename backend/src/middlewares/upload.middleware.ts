import multer from 'multer';
import { AppError } from '../utils/AppError';

// Railway tem disco efêmero — usar memória para uploads de currículo
const memoryStorage = multer.memoryStorage();

function fileFilter(allowedMimes: string[]) {
  return (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Tipo de arquivo não permitido: ${file.mimetype}`, 400));
    }
  };
}

export const uploadResume = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
});

export const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

export const uploadAny = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
