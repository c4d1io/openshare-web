import { apiClient } from "./apiClient";

export interface UploadProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile_uuid: string;
    photo_url: string;
    face_image_url: string;
    face_embedding_url: string;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class UploadService {
  async uploadSelfie(
    photo: File | Blob,
    filename?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadProfileResponse> {
    let fileToUpload: File;

    if (photo instanceof File && photo.name && this.hasExtension(photo.name)) {
      fileToUpload = photo;
    } else {
      const timestamp = new Date().getTime();
      const finalFilename = filename || `selfie_${timestamp}.jpg`;
      const filenameWithExt = this.ensureJpgExtension(finalFilename);

      fileToUpload = new File([photo], filenameWithExt, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }

    const formData = new FormData();
    formData.append("photo", fileToUpload);

    try {
      const response = await apiClient.upload<UploadProfileResponse>(
        "/consumers/add-face",
        formData
      );

      if (!response.success) {
        throw new Error(response.message || "Upload failed");
      }

      return response;
    } catch (error: any) {
      console.error("Upload selfie error:", error);
      throw this.handleUploadError(error);
    }
  }

  async dataUrlToFile(dataUrl: string, filename?: string): Promise<File> {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const mimeType = this.getMimeTypeFromDataUrl(dataUrl);

      const timestamp = new Date().getTime();
      const finalFilename = filename || `selfie_${timestamp}`;

      const extension = this.getExtensionFromMimeType(mimeType);
      const filenameWithExt = `${finalFilename}.${extension}`;

      return new File([blob], filenameWithExt, {
        type: mimeType,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error("Error converting data URL to file:", error);
      throw new Error("Failed to process image from camera");
    }
  }

  private getMimeTypeFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);/);
    return match ? match[1] : "image/jpeg";
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/bmp": "bmp",
      "image/tiff": "tiff",
      "image/svg+xml": "svg",
    };

    return mimeToExt[mimeType] || "jpg";
  }

  private hasExtension(filename: string): boolean {
    return /\.[a-zA-Z0-9]+$/.test(filename);
  }

  private ensureJpgExtension(filename: string): string {
    if (this.hasExtension(filename)) {
      return filename.replace(/\.[^/.]+$/, ".jpg");
    }
    return `${filename}.jpg`;
  }

  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  validateFile(
    file: File,
    maxSizeMB: number
  ): {
    isValid: boolean;
    error?: string;
  } {
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`,
      };
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "File type not supported. Please upload JPG, PNG, WEBP, GIF, BMP, or TIFF image.",
      };
    }

    return { isValid: true };
  }

  private handleUploadError(error: any): Error {
    if (error.message) {
      return error;
    }

    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.response?.data?.photo && Array.isArray(error.response.data.photo)) {
      const photoErrors = error.response.data.photo;
      const extensionError = photoErrors.find((err: string) =>
        err.includes("extension")
      );
      if (extensionError) {
        return new Error(
          "Invalid file format. Please upload an image file with proper extension (.jpg, .png, etc.)"
        );
      }
    }

    if (error.response?.status === 413) {
      return new Error("File too large. Please choose a smaller image.");
    }

    if (error.response?.status === 415) {
      return new Error(
        "Unsupported file type. Please upload JPG, PNG, or WEBP image."
      );
    }

    if (error.response?.status === 401) {
      return new Error("Session expired. Please login again.");
    }

    return new Error("Failed to upload photo. Please try again.");
  }
}

export const uploadService = new UploadService();
