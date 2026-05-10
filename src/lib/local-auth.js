const USERS_KEY = "job-prep-users";

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

async function postAuth(path, data) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Authentication failed.");
  }

  return response.json();
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

  users.push({ ...user, password });
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
  const account = readUsers().find(
    (user) => user.email === normalizedEmail && user.password === password,
  );

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  const { password: _password, ...user } = account;

  return {
    token: createToken(),
    user,
  };
}
