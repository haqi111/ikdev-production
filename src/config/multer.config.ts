import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = './uploads';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      callback(null, uploadPath);
    },

    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname); 
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`; 
      callback(null, filename); 
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },

  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new BadRequestException('Only JPG, JPEG, and PNG files are allowed!'), false);
    }
    callback(null, true); 
  },
};
