import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../services/api";

// Helper: FormData check karne ke liye
const isFormDataCheck = (data) =>
  typeof FormData !== "undefined" && data instanceof FormData;

// 1. GET Hook
export const useGet = (url, queryKey, params = {}, options = {}) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey || url, params],
    queryFn: async () => {
      const response = await API.get(url, { params });
      return response.data;
    },
    ...options,
  });
};

// 2. POST Hook (JSON & FormData / Image support)
export const usePost = (url, options = {}) => {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, onError, ...mutationOptions } = options;

  return useMutation({
    mutationFn: async (payload) => {
      const isFormData = isFormDataCheck(payload);
      const config = isFormData
        ? { headers: { "Content-Type": undefined } }
        : {};

      const response = await API.post(url, payload, config);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      onSuccess?.(data, variables, context);
    },
    onError,
    ...mutationOptions,
  });
};

// 3. PUT Hook (JSON & FormData / Image support + ID routing)
export const usePut = (url, options = {}) => {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, onError, ...mutationOptions } = options;

  return useMutation({
    mutationFn: async (payload) => {
      let targetUrl = url;
      let data = payload;

      if (isFormDataCheck(payload)) {
        // Direct FormData pass kiya ho
        data = payload;
      } else if (payload && typeof payload === "object") {
        if (payload.id) {
          targetUrl = `${url}/${payload.id}`;
        }
        data = payload.data !== undefined ? payload.data : payload;
      }

      const isFormData = isFormDataCheck(data);
      const config = isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};

      const response = await API.put(targetUrl, data, config);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      onSuccess?.(data, variables, context);
    },
    onError,
    ...mutationOptions,
  });
};

// 4. DELETE Hook
export const useDelete = (url, options = {}) => {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, onError, ...mutationOptions } = options;

  return useMutation({
    mutationFn: async (idOrUrl) => {
      const targetUrl =
        typeof idOrUrl === "object" && idOrUrl?.id
          ? `${url}/${idOrUrl.id}`
          : idOrUrl
            ? `${url}/${idOrUrl}`
            : url;

      const response = await API.delete(targetUrl);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      onSuccess?.(data, variables, context);
    },
    onError,
    ...mutationOptions,
  });
};
