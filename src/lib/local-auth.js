import bcrypt from "bcryptjs";

const USERS_KEY = "job-prep-users";
const BCRYPT_ROUNDS = 10;

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function createToken() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postAuth(path, data) {
  const urls = [path];
  if (typeof window !== "undefined" && window.location.port !== "3001") {
    urls.push(`http://127.0.0.1:3001${path}`);
  }

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message ?? "Authentication failed.");
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (!isBackendUnavailable(error)) throw error;
    }
  }

  throw lastError ?? new Error("Authentication server is unavailable.");
}

function isBackendUnavailable(error) {
  return /Failed to fetch|NetworkError|Load failed|Backend|Not found|Server error/i.test(error?.message ?? "");
}

export async function registerLocalUser({ name, email, password }) {
  try {
    return await postAuth("/api/auth/register", { name, email, password });
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
  }

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account already exists with this email.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
  };

  users.push({ ...user, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) });
  writeUsers(users);

  return {
    token: createToken(),
    user,
  };
}

export async function loginLocalUser({ email, password }) {
  try {
    return await postAuth("/api/auth/login", { email, password });
  } catch (error) {
    if (!isBackendUnavailable(error) && !/Invalid email or password/i.test(error?.message ?? "")) throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const account = users.find((user) => user.email === normalizedEmail);

  const passwordMatches = account?.passwordHash
    ? await bcrypt.compare(password, account.passwordHash)
    : account?.password === password;

  if (!account || !passwordMatches) {
    throw new Error("Invalid email or password. To use the same account in Chrome, Edge, or another browser, keep the SkillOra API server running on port 3001.");
  }

  if (!account.passwordHash) {
    account.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    delete account.password;
    writeUsers(users);
  }

  const { password: _password, passwordHash: _passwordHash, ...user } = account;

  return {
    token: createToken(),
    user,
  };
}
