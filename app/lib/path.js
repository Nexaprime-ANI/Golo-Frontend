export function normalizeAppPath(pathname = "") {
  if (typeof pathname !== "string") return "";

  return pathname || "/";
}

export function getFrontendBasePath() {
  const basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH?.trim() || "";
  if (!basePath) return "";
  return basePath.startsWith("/") ? basePath.replace(/\/+$/, "") : `/${basePath.replace(/\/+$/, "")}`;
}

export function withFrontendBasePath(pathname = "") {
  const basePath = getFrontendBasePath();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${normalizedPath}`;
}