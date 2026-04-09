export type UserIntent = "pet_owner" | "looking_to_adopt" | "exploring" | null;
export type UserRole = "USER" | "PET_OWNER" | "ADMIN" | "SUPER_ADMIN";

export function normalizeUserIntent(
  intent: string | null | undefined,
): UserIntent {
  switch (intent) {
    case "pet_owner":
    case "looking_to_adopt":
    case "exploring":
      return intent;
    default:
      return null;
  }
}

export function getOnboardingRedirectPath(intent: UserIntent): string {
  switch (intent) {
    case "pet_owner":
      return "/pets";
    case "looking_to_adopt":
      return "/adopt";
    case "exploring":
    default:
      return "/dashboard";
  }
}

export function getPostLoginRedirectPath(role?: UserRole): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/admin";
  }

  return "/dashboard";
}
