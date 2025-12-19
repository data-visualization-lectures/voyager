
const API_BASE_URL = "https://api.dataviz.jp";

// Helper to get the current session token
async function getAuthToken(): Promise<string | null> {
  // @ts-ignore
  const supabase = window.supabase;
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
}

export const CloudApi = {
  async saveProject(appName: string, name: string, data: any): Promise<any> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        app_name: appName,
        data
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to save project: ${res.statusText}`);
    }
    return res.json();
  },

  async getProjects(appName: string): Promise<CloudProject[]> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects?app=${appName}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list projects: ${res.statusText}`);
    }

    // API returns the list directly
    return res.json();
  },

  async getProjectContent(id: string): Promise<any> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to load project content: ${res.statusText}`);
    }

    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete project: ${res.statusText}`);
    }
  }
};
