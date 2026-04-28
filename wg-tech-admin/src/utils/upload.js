import { baseUrl } from "../api/index";

export const uploadImage = async (file, options = {}) => {
  const { endpoint = "v1/upload/image" } = options;
  const files = Array.isArray(file) ? file : [file];

  const results = await Promise.all(
    files.map(async (f) => {
      const formData = new FormData();
      formData.append("image", f);

      const token = localStorage.getItem("token");
      const response = await fetch(baseUrl + endpoint, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      return data.data?.url || data.url || data.secure_url;
    }),
  );

  return Array.isArray(file) ? results : results[0];
};

export const uploadVideo = async (file, options = {}) => {
  const { endpoint = "v1/upload/video" } = options;
  const files = Array.isArray(file) ? file : [file];

  const results = await Promise.all(
    files.map(async (f) => {
      const formData = new FormData();
      formData.append("video", f);

      const token = localStorage.getItem("token");
      const response = await fetch(baseUrl + endpoint, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      return data.data?.url || data.url || data.secure_url;
    }),
  );

  return Array.isArray(file) ? results : results[0];
};

export const uploadFile = async (file, options = {}) => {
  const { endpoint = "v1/upload/file" } = options;
  const files = Array.isArray(file) ? file : [file];

  const results = await Promise.all(
    files.map(async (f) => {
      const formData = new FormData();
      formData.append("file", f);

      const token = localStorage.getItem("token");
      const response = await fetch(baseUrl + endpoint, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      return data.data?.url || data.url || data.secure_url;
    }),
  );

  return Array.isArray(file) ? results : results[0];
};
