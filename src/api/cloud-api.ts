
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
  thumbnail_path?: string;
}

// Helper to upload a file to Supabase Storage
async function uploadFileToStorage(bucket: string, path: string, blob: Blob): Promise<string> {
  // @ts-ignore
  const supabase = window.supabase;
  if (!supabase) throw new Error("Supabase client not found");

  const {data, error} = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  return data.path;
}

export const CloudApi = {
  async saveProject(appName: string, name: string, data: any, thumbnailBlob?: Blob, userId?: string): Promise<any> {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");

    // Generate a UUID for the project if we were creating a new one really, but here we just post to API.
    // The API handles ID creation. However, to save the image with a deterministic path *before* we have the ID from the API might be tricky
    // if the API is the one generating the ID.
    // BUT, usually we want to upload the image first or in parallel?
    // If the API generates the ID, we can't key the image by ID before calling the API.
    // So we might need to generate a UUID here, OR let the API return the ID and then we upload (but then we need a second update call to save the path?),
    // OR we just use a random ID for the image and send that path to the API.

    // Strategy: Generate a random UUID for the image filename, upload it, then send the path to the API.
    let thumbnail_path = null;
    if (thumbnailBlob && token) {
      try {
        // @ts-ignore
        // @ts-ignore
        const supabase = window.supabase;

        let uid = userId;
        if (!uid) {
          const {data: {user}} = await supabase.auth.getUser();
          if (user) uid = user.id;
        }

        if (uid) {
          const timestamp = Date.now();
          // simple random string for filename
          const filename = `${uid}/${timestamp}_${Math.random().toString(36).substring(7)}.png`;
          await uploadFileToStorage('user_projects', filename, thumbnailBlob);
          thumbnail_path = filename;
        } else {
          console.error("User not found during thumbnail save");
          alert("サムネイル保存エラー: ユーザー情報が見つかりませんでした。");
        }
      } catch (e) {
        console.error("Failed to upload thumbnail", e);
        alert("サムネイル画像のアップロードに失敗しました: " + e.message);
        // We continue saving the project even if thumbnail fails
      }
    }



    console.log("Saving project to API. Thumbnail path:", thumbnail_path);
    const payload = {
      name,
      app_name: appName,
      data,
      thumbnail_path
    };
    // console.log("Payload:", payload); // Data might be huge, be careful

    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
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
  },

  async getThumbnailUrl(path: string): Promise<string | null> {
    const token = await getAuthToken();
    if (!token) return null;

    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) return null;

    // Create a signed URL valid for 1 hour
    const {data, error} = await supabase.storage
      .from('user_projects')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("Error creating signed url", error);
      return null;
    }

    return data.signedUrl;
  }
};
