import {
  apiRequest,
  API_URL,
  getAuthToken,
  getFetchErrorMessage,
  parseApiResponse,
} from "./client";
import type { ApiResponse } from "./client";

// ---- Types ----
export interface Pet {
  _id: string;
  userId: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  dateOfBirth: string | null;
  age: number | null;
  calculatedAge: number | null;
  photos: string[];
  medicalNotes: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetsResponse {
  pets: Pet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PetQueryParams {
  page?: number;
  limit?: number;
  species?: string;
  name?: string;
  breed?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
}

export interface PetStats {
  totalPets: number;
  averageAge: number;
  countBySpecies: { _id: string; count: number }[];
  countByGender: { _id: string; count: number }[];
}

// ---- Vaccination types ----
export interface Vaccination {
  _id: string;
  petId: string;
  vaccineName: string;
  dateGiven: string;
  nextDueDate: string | null;
  veterinarian: string | null;
  clinic: string | null;
  notes: string | null;
  status: string;
  calculatedStatus: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Medical Record types ----
export interface MedicalRecord {
  _id: string;
  petId: string;
  visitDate: string;
  reasonForVisit: string;
  vetName: string | null;
  clinic: string | null;
  weight: number | null;
  temperature: number | null;
  symptoms: string[];
  treatment: string | null;
  followUpDate: string | null;
  notes: string | null;
  isFollowUpDue: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Reminder types ----
export interface Reminder {
  _id: string;
  petId: string;
  title: string;
  description: string | null;
  reminderType: string;
  dueDate: string;
  dueTime: string | null;
  frequency: string;
  status: string;
  priority: string;
  isOverdue: boolean;
  isDueToday?: boolean;
  isSnoozed?: boolean;
  sendEmail?: boolean;
  completedAt?: string | null;
  dismissedAt?: string | null;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderQueryParams {
  page?: number;
  limit?: number;
  reminderType?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
  includeCompleted?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VaccinationListResponse {
  vaccinations: Vaccination[];
  pagination: PaginationMeta;
}

export interface MedicalRecordListResponse {
  medicalRecords: MedicalRecord[];
  pagination: PaginationMeta;
}

export interface ReminderListResponse {
  reminders: Reminder[];
  pagination: PaginationMeta;
}

// ---- Health Overview ----
export interface HealthOverview {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    age: number | null;
  };
  vaccinations: {
    total: number;
    overdue: number;
    upcoming: Vaccination[];
    upcomingCount: number;
  };
  medicalRecords: {
    total: number;
    lastVisit: {
      date: string;
      reason: string;
      vetName: string | null;
    } | null;
    upcomingFollowUps: MedicalRecord[];
  };
  careLogs: {
    total: number;
    lastWeek: number;
    byType: Record<string, number>;
    today: unknown[];
  };
  alerts: {
    overdueVaccinations: number;
    upcomingVaccinationsCount: number;
    pendingFollowUps: number;
  };
}

// ---- API helpers ----

/**
 * Upload form data (multipart) with auth — needed for pet creation/update with photos.
 */
async function apiFormData<T>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // Do NOT set Content-Type — browser will set correct multipart boundary.

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
      credentials: "include",
    });

    return parseApiResponse<T>(response);
  } catch (error) {
    return { error: getFetchErrorMessage(error) };
  }
}

// ---- Pet API ----
export const petApi = {
  // List pets
  getPets: (params?: PetQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return apiRequest<PetsResponse>(`/api/pets${qs ? `?${qs}` : ""}`, {}, true);
  },

  // Get single pet
  getPetById: (id: string) => apiRequest<Pet>(`/api/pets/${id}`, {}, true),

  // Create pet (multipart)
  createPet: (data: Record<string, string>, photos?: File[]) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (photos) {
      photos.forEach((file) => fd.append("photos", file));
    }
    return apiFormData<Pet>("/api/pets", fd, "POST");
  },

  // Update pet (multipart)
  updatePet: (
    id: string,
    data: Record<string, string>,
    photos?: File[],
    replacePhotos?: boolean,
  ) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (replacePhotos) fd.append("replacePhotos", "true");
    if (photos) {
      photos.forEach((file) => fd.append("photos", file));
    }
    return apiFormData<Pet>(`/api/pets/${id}`, fd, "PUT");
  },

  // Add pet photos (append)
  addPetPhotos: (id: string, photos: File[]) => {
    const fd = new FormData();
    photos.forEach((file) => fd.append("photos", file));
    return apiFormData<{ message: string; pet: Pet }>(
      `/api/pets/${id}/photos`,
      fd,
      "POST",
    );
  },

  // Delete a specific photo
  deletePetPhoto: (id: string, photoUrl: string) =>
    apiRequest<{ message: string; pet: Pet }>(
      `/api/pets/${id}/photos`,
      {
        method: "DELETE",
        body: JSON.stringify({ photoUrl }),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  // Delete pet (soft)
  deletePet: (id: string) =>
    apiRequest<{ message: string }>(
      `/api/pets/${id}`,
      { method: "DELETE" },
      true,
    ),

  // Pet statistics
  getStats: () => apiRequest<PetStats>("/api/pets/stats", {}, true),

  // ---- Health ----
  getHealthOverview: (petId: string) =>
    apiRequest<HealthOverview>(`/api/pets/${petId}/health`, {}, true),

  // ---- Vaccinations ----
  getVaccinations: (
    petId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      includeDeleted?: boolean;
    },
  ) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }

    const qs = query.toString();
    return apiRequest<VaccinationListResponse>(
      `/api/pets/${petId}/health/vaccinations${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  createVaccination: (
    petId: string,
    data: {
      vaccineName: string;
      dateGiven: string;
      nextDueDate?: string;
      veterinarian?: string;
      clinic?: string;
      notes?: string;
    },
  ) =>
    apiRequest<{ message: string; vaccination: Vaccination }>(
      `/api/pets/${petId}/health/vaccinations`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  updateVaccination: (
    petId: string,
    vaccinationId: string,
    data: Partial<{
      vaccineName: string;
      dateGiven: string;
      nextDueDate: string | null;
      veterinarian: string | null;
      clinic: string | null;
      notes: string | null;
    }>,
  ) =>
    apiRequest<{ message: string; vaccination: Vaccination }>(
      `/api/pets/${petId}/health/vaccinations/${vaccinationId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  deleteVaccination: (petId: string, vaccinationId: string) =>
    apiRequest<{ message: string }>(
      `/api/pets/${petId}/health/vaccinations/${vaccinationId}`,
      {
        method: "DELETE",
      },
      true,
    ),

  // ---- Medical Records ----
  getMedicalRecords: (
    petId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      includeDeleted?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }

    const qs = query.toString();
    return apiRequest<MedicalRecordListResponse>(
      `/api/pets/${petId}/health/medical-records${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  createMedicalRecord: (
    petId: string,
    data: {
      visitDate: string;
      reasonForVisit: string;
      vetName?: string;
      clinic?: string;
      weight?: number;
      temperature?: number;
      symptoms?: string[];
      treatment?: string;
      followUpDate?: string;
      notes?: string;
    },
  ) =>
    apiRequest<{ message: string; medicalRecord: MedicalRecord }>(
      `/api/pets/${petId}/health/medical-records`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  updateMedicalRecord: (
    petId: string,
    recordId: string,
    data: Partial<{
      visitDate: string;
      reasonForVisit: string;
      vetName: string | null;
      clinic: string | null;
      weight: number | null;
      temperature: number | null;
      symptoms: string[];
      treatment: string | null;
      followUpDate: string | null;
      notes: string | null;
    }>,
  ) =>
    apiRequest<{ message: string; medicalRecord: MedicalRecord }>(
      `/api/pets/${petId}/health/medical-records/${recordId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  deleteMedicalRecord: (petId: string, recordId: string) =>
    apiRequest<{ message: string }>(
      `/api/pets/${petId}/health/medical-records/${recordId}`,
      {
        method: "DELETE",
      },
      true,
    ),

  // ---- Reminders ----
  getReminders: (petId: string, params?: ReminderQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }

    const qs = query.toString();
    return apiRequest<ReminderListResponse>(
      `/api/pets/${petId}/health/reminders${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  // Reminders for all pets (user-level)
  getAllReminders: () =>
    apiRequest<ReminderListResponse>("/api/reminders", {}, true),

  // Create reminder for pet
  createReminder: (
    petId: string,
    data: {
      title: string;
      description?: string;
      reminderType: string;
      dueDate: string;
      dueTime?: string;
      frequency: string;
      priority: string;
    },
  ) =>
    apiRequest<{ message: string; reminder: Reminder }>(
      `/api/pets/${petId}/health/reminders`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  // Update reminder
  updateReminder: (
    petId: string,
    reminderId: string,
    data: Partial<Reminder>,
  ) =>
    apiRequest<{ message: string; reminder: Reminder }>(
      `/api/pets/${petId}/health/reminders/${reminderId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
      true,
    ),

  // Delete reminder
  deleteReminder: (petId: string, reminderId: string) =>
    apiRequest<{ message: string }>(
      `/api/pets/${petId}/health/reminders/${reminderId}`,
      { method: "DELETE" },
      true,
    ),

  // Complete reminder
  completeReminder: (petId: string, reminderId: string) =>
    apiRequest<{ message: string; reminder: Reminder }>(
      `/api/pets/${petId}/health/reminders/${reminderId}/complete`,
      { method: "PATCH" },
      true,
    ),

  // Snooze reminder
  snoozeReminder: (petId: string, reminderId: string, snoozeMinutes?: number) =>
    apiRequest<{ message: string; reminder: Reminder }>(
      `/api/pets/${petId}/health/reminders/${reminderId}/snooze`,
      {
        method: "PATCH",
        body:
          typeof snoozeMinutes === "number"
            ? JSON.stringify({ minutes: snoozeMinutes })
            : undefined,
        headers:
          typeof snoozeMinutes === "number"
            ? { "Content-Type": "application/json" }
            : {},
      },
      true,
    ),

  // Dismiss reminder
  dismissReminder: (petId: string, reminderId: string) =>
    apiRequest<{ message: string; reminder: Reminder }>(
      `/api/pets/${petId}/health/reminders/${reminderId}/dismiss`,
      { method: "PATCH" },
      true,
    ),
};
