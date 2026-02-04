class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      switch (response.status) {
        case 401:
          console.error("Unauthorized - Please login again");
          break;
        case 403:
          console.error("Forbidden - You do not have permission");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error - Please try again later");
          break;
        default:
          console.error(`Request failed with status ${response.status}`);
      }

      throw errorData;
    }

    return response.json();
  }

  async get<T = any>(url: string, config?: { params?: Record<string, any> }): Promise<T> {
    let finalUrl = url;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
    return this.request<T>(finalUrl, { method: "GET" });
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }

  async upload<T = any>(
    url: string,
    formData: FormData,
    config?: { onUploadProgress?: (event: ProgressEvent) => void }
  ): Promise<T> {
    const headers: HeadersInit = {};

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }

    return response.json();
  }
}

const BASE_URL = "https://moments-api.moibook.in";
export const apiClient = new ApiClient(BASE_URL);
