
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

// Helper to get configuration purely from the global client
function getDbConfig() {
  // @ts-ignore
  const globalClient = window.supabase;
  if (!globalClient) throw new Error("Supabase client not initialized");
  return {
    supabaseUrl: "https://vebhoeiltxspsurqoxvl.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4"
  };
}

// Helper to check session
async function getSession() {
  // @ts-ignore
  const globalAuthClient = window.supabase;
  if (!globalAuthClient) return null;
  const {data} = await globalAuthClient.auth.getSession();
  return data.session;
}

export const CloudApi = {
  async saveProject(appName: string, name: string, data: any, thumbnailBlob?: Blob, userId?: string): Promise<any> {
    const session = await getSession();
    if (!session || !session.user) throw new Error("Not authenticated");

    // Use the explicit userId if provided, otherwise session user
    const uid = userId || session.user.id;
    const token = session.access_token;

    // @ts-ignore
    const supabase = window.supabase;
    const {supabaseUrl, supabaseKey} = getDbConfig();

    // Generate IDs
    const timestamp = Date.now();
    // Using random string for ID
    const projectId = `${timestamp}_${Math.random().toString(36).substring(7)}`;

    const jsonPath = `${uid}/${projectId}.json`;
    const thumbPath = `${uid}/${projectId}.png`;

    // 1. Upload JSON to Storage (Using Client)
    const {error: uploadError} = await supabase.storage
      .from('user_projects')
      .upload(jsonPath, JSON.stringify(data), {
        upsert: true,
        contentType: 'application/json'
      });

    if (uploadError) throw new Error(`Failed to upload project data: ${uploadError.message}`);

    // 2. Upload Thumbnail if exists (Using Client)
    let savedThumbnailPath = null;
    if (thumbnailBlob) {
      const {error: thumbError} = await supabase.storage
        .from('user_projects')
        .upload(thumbPath, thumbnailBlob, {
          upsert: true,
          contentType: 'image/png'
        });

      if (thumbError) {
        console.warn("Failed to upload thumbnail:", thumbError);
      } else {
        savedThumbnailPath = thumbPath;
      }
    }

    // 3. Save Metadata to DB (Using Raw Fetch to match SankeyMATIC reference)
    console.log("Saving Metadata to DB...");
    const payload = {
      id: projectId, // SankeyMATIC generates ID client-side and sends it
      user_id: uid,
      name: name,
      storage_path: jsonPath,
      thumbnail_path: savedThumbnailPath,
      app_name: appName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbEndpoint = `${supabaseUrl}/rest/v1/projects`;

    const dbRes = await fetch(dbEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!dbRes.ok) {
      throw new Error(`DB save failed: ${await dbRes.text()}`);
    }

    const resData = await dbRes.json();
    return resData && resData.length > 0 ? resData[0] : null;
  },

  async getProjects(appName: string): Promise<CloudProject[]> {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");
    const token = session.access_token;

    const {supabaseUrl, supabaseKey} = getDbConfig();

    // Using Raw Fetch to DB (SankeyMATIC style - no auth header)
    const endpoint = `${supabaseUrl}/rest/v1/projects?select=*&app_name=eq.${appName}&order=updated_at.desc`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list projects: ${await res.text()}`);
    }

    return await res.json();
  },

  async getProjectContent(id: string): Promise<any> {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");
    const token = session.access_token;

    // @ts-ignore
    const supabase = window.supabase;
    const {supabaseUrl, supabaseKey} = getDbConfig();

    // 1. Get storage_path from DB
    const dbEndpoint = `${supabaseUrl}/rest/v1/projects?select=storage_path&id=eq.${id}`;
    const dbRes = await fetch(dbEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!dbRes.ok) throw new Error(`DB load failed: ${await dbRes.text()}`);

    const rows = await dbRes.json();
    if (!rows.length) throw new Error("Project not found");

    const storagePath = rows[0].storage_path;

    // 2. Download JSON from Storage (Using Client)
    const {data: blob, error: downloadError} = await supabase.storage
      .from('user_projects')
      .download(storagePath);

    if (downloadError) throw new Error(`Failed to download project content: ${downloadError.message}`);

    return await blob.text().then(JSON.parse);
  },

  async deleteProject(id: string): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");
    const token = session.access_token;

    // @ts-ignore
    const supabase = window.supabase;
    const {supabaseUrl, supabaseKey} = getDbConfig();

    // 1. Get paths
    const fetchEndpoint = `${supabaseUrl}/rest/v1/projects?select=storage_path,thumbnail_path&id=eq.${id}`;
    const fetchRes = await fetch(fetchEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    let pathsToDelete: string[] = [];
    if (fetchRes.ok) {
      const rows = await fetchRes.json();
      if (rows.length > 0) {
        if (rows[0].storage_path) pathsToDelete.push(rows[0].storage_path);
        if (rows[0].thumbnail_path) pathsToDelete.push(rows[0].thumbnail_path);
      }
    }

    // 2. Delete from DB
    const dbEndpoint = `${supabaseUrl}/rest/v1/projects?id=eq.${id}`;
    const dbRes = await fetch(dbEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!dbRes.ok) throw new Error(`DB delete failed: ${await dbRes.text()}`);

    // 3. Delete from Storage
    if (pathsToDelete.length > 0) {
      await supabase.storage
        .from('user_projects')
        .remove(pathsToDelete);
    }
  },

  async getThumbnailUrl(path: string): Promise<string | null> {
    if (!path) return null;

    // @ts-ignore
    const supabase = window.supabase;
    if (supabase) {
      const {data} = await supabase.storage
        .from('user_projects')
        .createSignedUrl(path, 3600);
      return data ? data.signedUrl : null;
    }

    return null;
  }
};
