export type UserIntent = "pet_owner" | "looking_to_adopt" | "exploring" | null;

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
