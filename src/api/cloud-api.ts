
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
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) throw new Error("Supabase client not found");

    let uid = userId;
    let token = null;
    if (!uid || !token) {
      const {data: {session}} = await supabase.auth.getSession();
      if (session && session.user) {
        uid = session.user.id;
      }
    }

    if (!uid) throw new Error("User not authenticated");

    const timestamp = Date.now();
    // We can use a deterministic ID or random. Let's use timestamp + random for uniqueness locally,
    // but typically we might want to update an existing project if we had an ID.
    // Since this signature doesn't take an ID, it implies "Save As New" or we generate a new ID.
    // For now, let's generate a new ID (UUID-like) for the file.
    const projectId = `${timestamp}_${Math.random().toString(36).substring(7)}`;

    const jsonPath = `${uid}/${projectId}.json`;
    const thumbPath = `${uid}/${projectId}.png`;

    // 1. Upload JSON
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

    // 3. Save to DB
    // We match the columns from rawgraphs-app-db: id, user_id, name, storage_path, thumbnail_path, app_name, created_at, updated_at
    // But since we don't have user_id in the arguments generally, relying on RLS might be better, but explicit is good too.
    // The `projects` table typically allows insert.

    const payload = {
      name: name,
      app_name: appName,
      storage_path: jsonPath,
      thumbnail_path: savedThumbnailPath,
      // created_at / updated_at handled by DB defaults usually, or we can send them.
      updated_at: new Date().toISOString()
    };

    const {data: dbData, error: dbError} = await supabase
      .from('projects')
      .insert([payload])
      .select()
      .single();

    if (dbError) throw new Error(`Failed to save project metadata: ${dbError.message}`);

    return dbData;
  },

  async getProjects(appName: string): Promise<CloudProject[]> {
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) throw new Error("Supabase client not found");

    const {data, error} = await supabase
      .from('projects')
      .select('*')
      .eq('app_name', appName)
      .order('updated_at', {ascending: false});

    if (error) throw new Error(`Failed to list projects: ${error.message}`);
    return data || [];
  },

  async getProjectContent(id: string): Promise<any> {
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) throw new Error("Supabase client not found");

    // 1. Get storage_path from DB (though we might already know it if we passed it, but ID is what we have)
    const {data: project, error: dbError} = await supabase
      .from('projects')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (dbError || !project) throw new Error(`Project not found: ${dbError ? dbError.message : 'No record'}`);

    // 2. Download JSON
    const {data: blob, error: downloadError} = await supabase.storage
      .from('user_projects')
      .download(project.storage_path);

    if (downloadError) throw new Error(`Failed to download project content: ${downloadError.message}`);

    return await blob.text().then(JSON.parse);
  },

  async deleteProject(id: string): Promise<void> {
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) throw new Error("Supabase client not found");

    // 1. Get paths to delete
    const {data: project, error: fetchError} = await supabase
      .from('projects')
      .select('storage_path, thumbnail_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.warn("Could not fetch project details for deletion, trying to delete DB record anyway.");
    }

    // 2. Delete DB record
    const {error: deleteError} = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(`Failed to delete project: ${deleteError.message}`);

    // 3. Delete files from storage
    if (project) {
      const paths = [];
      if (project.storage_path) paths.push(project.storage_path);
      if (project.thumbnail_path) paths.push(project.thumbnail_path);

      if (paths.length > 0) {
        await supabase.storage
          .from('user_projects')
          .remove(paths);
      }
    }
  },

  async getThumbnailUrl(path: string): Promise<string | null> {
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) return null;

    const {data} = await supabase.storage
      .from('user_projects')
      .createSignedUrl(path, 3600);

    return data ? data.signedUrl : null;
  }
};
