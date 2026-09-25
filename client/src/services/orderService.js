import { apiRequest } from "./api";

export async function createOrder(orderPayload) {
  const payload = await apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });

  return payload?.data || payload;
}
