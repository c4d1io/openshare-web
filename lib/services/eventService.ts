import { apiClient } from "@/lib/apiClient";
import type {
  EventCategoriesResponse,
  EventsResponse,
  CreateEventPayload,
  CreateEventResponse,
  EventMediaResponse,
  EventQRCodeResponse,
  UploadInitPayload,
  UploadInitResponse,
  UploadCompletePayload,
  UploadCompleteResponse,
  ApiUrlsResponse,
  GenerateApiPayload,
  GenerateApiResponse,
  RevokeApiPayload,
  RevokeApiResponse,
} from "@/lib/types/event";

export const eventService = {
  // Fetch event categories with pagination
  async getEventCategories(
    limit: number = 10,
    offset: number = 0
  ): Promise<EventCategoriesResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/event-categories?limit=${limit}&offset=${offset}
    const mockApiUrl = "https://mocki.io/v1/1e409515-cd4d-49d1-9876-163730fa2c24";

    const response = await fetch(mockApiUrl);
    return response.json();
  },

  // Fetch all events with pagination
  async getAllEvents(
    limit: number = 12,
    offset: number = 0
  ): Promise<EventsResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/all-events?limit=${limit}&offset=${offset}
    const mockApiUrl = "https://mocki.io/v1/cc326f61-e376-4dcd-b50d-59476aa23d31";

    const response = await fetch(mockApiUrl);
    return response.json();
  },

  // Create a new event
  async createEvent(payload: CreateEventPayload): Promise<CreateEventResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/create-event
    const mockApiUrl = "https://mocki.io/v1/6cc6e980-6690-4d08-89f5-dc31c35513aa";

    // Console log payload for testing
    console.log("Create Event Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(mockApiUrl);

    // const response = await fetch(mockApiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });

    const result = await response.json();
    console.log("Create Event Response:", result);

    return result;
  },

  // Get event media (photos and videos) with pagination
  async getEventMedia(
    eventId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EventMediaResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/event/${eventId}?limit=${limit}&offset=${offset}
    const mockApiUrl = "https://mocki.io/v1/6dd0c70e-dd2e-42f1-815c-d9ba511706ab";

    const response = await fetch(mockApiUrl);
    return response.json();
  },

  // Get event QR code
  async getEventQRCode(eventId: string): Promise<EventQRCodeResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/event/${eventId}/qr-code
    const mockApiUrl = "https://mocki.io/v1/271fb6af-abbf-4756-8024-0206a1e27b7a";

    const response = await fetch(mockApiUrl);
    return response.json();
  },

  // Upload event image and return the URL
  async uploadEventImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.upload<{ url: string }>("/api/upload-image", formData);
  },

  async getApiUrls(): Promise<ApiUrlsResponse> {
    // TODO: Remove mock response and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/api_urls
    
    // Mock response for testing
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    return {
      message: "Fetch Successful",
      Data: [
        {
          Api_id: "SDYE87",
          Status: "active",
          Expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          Api_url: "https://moibook-url/api/webhook/upload/SDYE87",
        },
        {
          Api_id: "ABCD87",
          Status: "revoked",
          Expires_at: "2026-02-26T12:00:00Z",
          Api_url: "https://moibook-url/api/webhook/upload/ABCD87",
        },
      ],
    };

    // const response = await fetch(apiUrl);
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch API URLs: ${response.statusText}`);
    // }
    // return response.json();
  },

  async generateApiUrl(payload: GenerateApiPayload): Promise<GenerateApiResponse> {
    // TODO: Remove mock response and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/generate-apiurl
    
    console.log("Generate API URL Payload:", payload);
    
    // Mock response for testing
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const mockApiId = `API${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const mockResponse: GenerateApiResponse = {
      api_id: mockApiId,
      api_url: `https://moibook-url/api/webhook/upload/${mockApiId}`,
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };
    
    console.log("Generate API URL Response (mock):", mockResponse);
    return mockResponse;

    // const response = await fetch(apiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });
    // if (!response.ok) {
    //   throw new Error(`Failed to generate API URL: ${response.statusText}`);
    // }
    // return response.json();
  },

  // Revoke an API URL
  async revokeApiUrl(payload: RevokeApiPayload): Promise<RevokeApiResponse> {
    // TODO: Remove mock response and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/urls/revoke
    
    console.log("Revoke API URL Payload:", payload);
    
    // Mock response for testing
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
    
    const mockResponse: RevokeApiResponse = {
      Status: "success",
      Message: "API Revoked Successfully",
    };
    
    console.log("Revoke API URL Response (mock):", mockResponse);
    return mockResponse;

    // const response = await fetch(apiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });
    // if (!response.ok) {
    //   throw new Error(`Failed to revoke API URL: ${response.statusText}`);
    // }
    // return response.json();
  },

  // Initialize upload - get pre-signed S3 URLs
  async initUpload(payload: UploadInitPayload): Promise<UploadInitResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/uploads/init
    const apiUrl = "https://mocki.io/v1/f308b612-5746-44d1-ae89-4fd723e26c55";

    console.log("Upload Init Payload:", JSON.stringify(payload, null, 2));

    // For testing, generate mock response with fake upload URLs
    // const response = await fetch(apiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Upload init failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Upload Init Response:", result);
    return result;
  },

  // Upload file to S3 with progress tracking
  async uploadToS3(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("S3 upload failed"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(file);
    });
  },

  // Complete upload - confirm all files uploaded
  async completeUpload(payload: UploadCompletePayload): Promise<UploadCompleteResponse> {
    // TODO: Remove mock API and uncomment production API after deployment
    // Production API: https://moments-api.moibook.in/api/uploads/complete

    const apiUrl = "https://mocki.io/v1/c76dbf8b-2949-40f3-92e7-1df327ca6174";

    console.log("Upload Complete Payload:", JSON.stringify(payload, null, 2));

    // For testing, generate mock response
    // TODO: Replace with actual API call
    // const mockResponse: UploadCompleteResponse = {
    //   status: "success",
    //   files: payload.files.map(file => ({
    //     file_id: file.file_id,
    //     file_url: `https://credentials-credissuer-stage-bucket.s3.ap-south-1.amazonaws.com/media/${file.s3_key}`,
    //   })),
    // };

    // const response = await fetch(mockApiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Upload complete failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Upload Complete Response:", result);
    return result;
  },
};
