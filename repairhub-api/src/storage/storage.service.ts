// storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';

@Injectable()
export class StorageService {
  constructor(
    @InjectSupabaseClient() private readonly supabase: SupabaseClient,
  ) {}

  async uploadFile(file: Express.Multer.File, bucket: string = 'images') {
    try {
      const { originalname, buffer, mimetype } = file;
      const fileName = `${Date.now()}-${originalname}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Error al subir archivo: ${error.message}`);
      }

      // Obtener URL pública del archivo
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        ...data,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        bucket: bucket
      };
    } catch (error) {
      throw new Error(`Error en uploadFile: ${error.message}`);
    }
  }

  async deleteFile(filePath: string, bucket: string = 'images') {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Error al eliminar archivo: ${error.message}`);
      }

      return {
        message: 'Archivo eliminado exitosamente',
        data
      };
    } catch (error) {
      throw new Error(`Error en deleteFile: ${error.message}`);
    }
  }

  async getFileUrl(filePath: string, bucket: string = 'images') {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  async listFiles(bucket: string = 'images') {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list();

      if (error) {
        throw new Error(`Error al listar archivos: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Error en listFiles: ${error.message}`);
    }
  }
}