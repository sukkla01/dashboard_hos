export const SESSION_COOKIE = "hosxp_session";

export type SessionUser = {
  loginname: string;
  name: string;
  department: string | null;
};

export function userInitials(user: SessionUser): string {
  const source = user.name.trim() || user.loginname.trim();
  if (!source) return "?";
  return source.slice(0, 2);
}
