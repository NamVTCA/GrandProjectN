import API_URL from "../config/api";

export async function getInterests(token: string) {
  const res = await fetch(`${API_URL}/interests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUserInterests(userId: string, interestIds: string[], token: string) {
  const res = await fetch(`${API_URL}/users/${userId}/interests`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ interests: interestIds }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
