import { apiClient } from "./apiClient";

export interface FaceMetadata {
  bbox: [number, number, number, number];
  face_uuid: string;
  image_url: string;
  embedding_url: string;
}

export interface MatchedPhoto {
  moment_uuid: string;
  event_uuid: string;
  raw_image_url: string;
  thumbnail_image_url: string;
  number_of_faces: number;
  flag: string;
  is_active: boolean;
  created_at: string;
  faces_metadata: FaceMetadata[];
}

export interface MatchPhotosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    success: boolean;
    message: string;
    data: MatchedPhoto[];
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

class PhotoService {
  async getMatchedPhotos(
    params?: PaginationParams
  ): Promise<MatchPhotosResponse> {
    try {
      const response = await apiClient.get<MatchPhotosResponse>(
        "/objects/matchs",
        { params }
      );

      if (!response.results?.success) {
        throw new Error(
          response.results?.message || "Failed to get matched photos"
        );
      }

      return response;
    } catch (error: any) {
      console.error("Get matched photos error:", error);
      throw this.handleMatchError(error);
    }
  }

  async getMatchedPhotosByUrl(url: string): Promise<MatchPhotosResponse> {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;

      const response = await apiClient.get<MatchPhotosResponse>(path);

      if (!response.results?.success) {
        throw new Error(
          response.results?.message || "Failed to get matched photos"
        );
      }

      return response;
    } catch (error: any) {
      console.error("Get matched photos by URL error:", error);
      throw this.handleMatchError(error);
    }
  }

  convertToAppPhoto(matchedPhoto: MatchedPhoto, index: number) {
    return {
      id: matchedPhoto.moment_uuid,
      url: matchedPhoto.raw_image_url,
      thumbnailUrl:
        matchedPhoto.thumbnail_image_url || matchedPhoto.raw_image_url,
      title: `Wedding Moment ${index + 1}`,
      description: `Captured on ${new Date(matchedPhoto.created_at).toLocaleDateString()}`,
      date: matchedPhoto.created_at,
      faces: matchedPhoto.number_of_faces,
      metadata: {
        moment_uuid: matchedPhoto.moment_uuid,
        event_uuid: matchedPhoto.event_uuid,
        flag: matchedPhoto.flag,
        is_active: matchedPhoto.is_active,
        faces_metadata: matchedPhoto.faces_metadata,
      },
    };
  }

  private handleMatchError(error: any): Error {
    if (error.message) {
      return error;
    }

    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.response?.data?.results?.message) {
      return new Error(error.response.data.results.message);
    }

    if (error.response?.status === 404) {
      return new Error(
        "No matching photos found. Please try with a different photo."
      );
    }

    if (error.response?.status === 401) {
      return new Error("Session expired. Please login again.");
    }

    if (error.response?.status === 403) {
      return new Error("Access denied. Please check your permissions.");
    }

    return new Error("Failed to find matching photos. Please try again.");
  }

  async downloadPhoto(url: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || `wedding_moment_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to download photo");
    }
  }

  getPhotoStats(photos: MatchedPhoto[]) {
    const totalPhotos = photos.length;
    const totalFaces = photos.reduce(
      (sum, photo) => sum + photo.number_of_faces,
      0
    );
    const dates = photos.map((photo) => new Date(photo.created_at));
    const earliestDate =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null;
    const latestDate =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null;

    return {
      totalPhotos,
      totalFaces,
      earliestDate,
      latestDate,
      dateRange:
        earliestDate && latestDate
          ? `${earliestDate.toLocaleDateString()} - ${latestDate.toLocaleDateString()}`
          : null,
    };
  }
}

export const photoService = new PhotoService();
