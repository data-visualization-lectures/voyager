
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
const SUPABASE_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
// Specific Anon Key provided by user
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTY4MjMsImV4cCI6MjA4MDYzMjgyM30.5uf-D07Hb0JxL39X9yQ20P-5gFc1CRMdKWhDySrNZ0E";

export interface CloudProject {
  id: string;
  name: string;
  app_name: string;
  created_at: string;
  updated_at: string;
  thumbnail_path?: string;
}

// Helper to check session
async function getSession() {
  // @ts-ignore
  const globalAuthClient = window.supabase;
  if (!globalAuthClient) return null;
  const {data} = await globalAuthClient.auth.getSession();
  return data.session;
}

// Helper for UUID generation
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const CloudApi = {
  async saveProject(appName: string, name: string, data: any, thumbnailBlob?: Blob, userId?: string): Promise<any> {
    const session = await getSession();
    if (!session || !session.user) throw new Error("Not authenticated");

    // Explicit userId or session user
    const uid = userId || session.user.id;
    const token = session.access_token; // Token is NOT used for DB operations in RawGraphs pattern

    // @ts-ignore
    const supabase = window.supabase;

    // Generate IDs
    const projectId = uuidv4();

    const jsonPath = `${uid}/${projectId}.json`;
    const thumbPath = `${uid}/${projectId}.png`;

    // 1. Upload JSON to Storage
    const {error: uploadError} = await supabase.storage
      .from('user_projects')
      .upload(jsonPath, JSON.stringify(data), {
        upsert: true,
        contentType: 'application/json'
      });

    if (uploadError) throw new Error(`Failed to upload project data: ${uploadError.message}`);

    // 2. Upload Thumbnail if exists
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

    // 3. Save Metadata to DB (RawGraphs Pattern: Query Param API Key, NO Auth Header)
    console.log("Saving Metadata to DB...");
    const payload = {
      id: projectId,
      user_id: uid,
      name: name, // Ensure this matches DB column
      storage_path: jsonPath,
      thumbnail_path: savedThumbnailPath,
      app_name: appName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbEndpoint = `${SUPABASE_URL}/rest/v1/projects?apikey=${SUPABASE_KEY}`;

    const dbRes = await fetch(dbEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
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
    // RawGraphs Pattern: Query Param API Key, NO Auth Header
    const endpoint = `${SUPABASE_URL}/rest/v1/projects?select=*&app_name=eq.${appName}&order=updated_at.desc&apikey=${SUPABASE_KEY}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list projects: ${await res.text()}`);
    }

    return await res.json();
  },

  async getProjectContent(id: string): Promise<any> {
    const session = await getSession();
    if (!session || !session.user) throw new Error("Not authenticated");
    const token = session.access_token;

    // 1. Get storage_path from DB (RawGraphs Pattern: Query Param API Key, NO Auth Header)
    const dbEndpoint = `${SUPABASE_URL}/rest/v1/projects?select=storage_path&id=eq.${id}&apikey=${SUPABASE_KEY}`;
    const dbRes = await fetch(dbEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!dbRes.ok) throw new Error(`DB load failed: ${await dbRes.text()}`);

    const rows = await dbRes.json();
    if (!rows.length) throw new Error("Project not found");

    const storagePath = rows[0].storage_path;

    // 2. Download JSON from Storage (RawGraphs Pattern: Fetch with Auth Header)
    // Note: Assuming 'user_projects' bucket name as per previous code
    const storageEndpoint = `${SUPABASE_URL}/storage/v1/object/user_projects/${storagePath}?apikey=${SUPABASE_KEY}`;

    const storageRes = await fetch(storageEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!storageRes.ok) throw new Error(`Failed to download project content: ${await storageRes.text()}`);

    return await storageRes.json();
  },

  async deleteProject(id: string): Promise<void> {
    // @ts-ignore
    const supabase = window.supabase;

    // 1. Get paths (RawGraphs Pattern: Query Param API Key, NO Auth Header)
    const fetchEndpoint = `${SUPABASE_URL}/rest/v1/projects?select=storage_path,thumbnail_path&id=eq.${id}&apikey=${SUPABASE_KEY}`;
    const fetchRes = await fetch(fetchEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

    // 2. Delete from DB (RawGraphs Pattern: Query Param API Key, NO Auth Header)
    const dbEndpoint = `${SUPABASE_URL}/rest/v1/projects?id=eq.${id}&apikey=${SUPABASE_KEY}`;
    const dbRes = await fetch(dbEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
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
