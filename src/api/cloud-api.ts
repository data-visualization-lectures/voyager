
const API_BASE_URL = "https://api.dataviz.jp";

// Helper to get the current session token
async function getAuthToken(): Promise<string | null> {
  // @ts-ignore
  const supabase = window.datavizSupabase;
  if (!supabase) return null;
  const result = await supabase.auth.getSession();
  if (result.data && result.data.session) {
    return result.data.session.access_token;
  }
  return null;
}

export interface CloudProject {
  id: string;
  name: string;
  app_name: string;
  created_at: string;
  updated_at: string;
  thumbnail_path?: string;
}

// Helper to convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const CloudApi = {
  async saveProject(appName: string, name: string, data: any, thumbnailBlob?: Blob, userId?: string): Promise<any> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    let thumbnail: string | undefined;
    if (thumbnailBlob) {
      thumbnail = await blobToBase64(thumbnailBlob);
    }

    const payload = {
      name,
      app_name: appName,
      data,
      thumbnail
    };

    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMessage = `Error ${res.status}: ${res.statusText}`;
      try {
        const errorBody = await res.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
          if (errorBody.detail) errorMessage += `: ${errorBody.detail}`;
        }
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const responseData = await res.json();
    return responseData.project;
  },

  async getProjects(appName: string): Promise<CloudProject[]> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects?app=${appName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list projects: ${await res.text()}`);
    }

    const data = await res.json();
    return data.projects;
  },

  async getProjectContent(id: string): Promise<any> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download project content: ${await res.text()}`);
    }

    return await res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete project: ${await res.text()}`);
    }
  },

  async getThumbnailUrl(id: string): Promise<string | null> {
    const token = await getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}/thumbnail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        // If 404 or other error, return null so a placeholder is used
        return null;
      }

      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Failed to fetch thumbnail", e);
      return null;
    }
  }
};
