"use client";

export interface EventCategory {
  category_name: string;
  category_code: string;
}

export interface EventCategoriesResponse {
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: EventCategory[];
  };
}

export interface Event {
  event_id: string;
  event_image?: string;
  event_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_description: string;
  event_category_name: string;
  event_category_code: string;
  event_type: "public" | "private";
}

export interface EventsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Event[];
}

export interface CreateEventPayload {
  event_image?: string;
  event_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_description: string;
  event_category_code?: string;
  event_category_name?: string;
  event_type: "public" | "private";
}

export interface CreateEventResponse {
  event_id: string;
  message: string;
}

// Event Media Types
export interface MediaItem {
  name: string;
  created_at: string;
  media_file: string;
}

export interface EventMediaResponse {
  message: string;
  data: {
    count: number;
    results: MediaItem[];
  };
}

export interface EventQRCodeResponse {
  qr_code: string;
}

// Upload Types
export interface UploadFileInfo {
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface UploadInitPayload {
  files: UploadFileInfo[];
}

export interface UploadInitFileResponse {
  file_id: string;
  file_name: string;
  upload_url: string;
  content_type: string;
  s3_key: string;
}

export interface UploadInitResponse {
  upload_id: string;
  files: UploadInitFileResponse[];
}

export interface UploadCompleteFilePayload {
  file_id: string;
  s3_key: string;
}

export interface UploadCompletePayload {
  upload_id: string;
  files: UploadCompleteFilePayload[];
}

export interface UploadCompleteFileResponse {
  file_id: string;
  file_url: string;
}

export interface UploadCompleteResponse {
  status: string;
  files: UploadCompleteFileResponse[];
}

// API URL Types
export interface ApiUrlItem {
  Api_id: string;
  Status: "active" | "revoked";
  Expires_at: string;
  Api_url: string;
}

export interface ApiUrlsResponse {
  message: string;
  Data: ApiUrlItem[];
}

export interface GenerateApiPayload {
  action: string;
}

export interface GenerateApiResponse {
  api_id: string;
  api_url: string;
  status: string;
  expires_at: string;
}

export interface RevokeApiPayload {
  api_id: string;
  status: string;
  revoke_at: string;
}

export interface RevokeApiResponse {
  Status: string;
  Message: string;
}
