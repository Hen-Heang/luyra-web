import "server-only";
import webPush, { type WebPushError } from "web-push";
import {
  deletePushSubscriptionByEndpoint,
  type StoredPushSubscription,
} from "@/lib/repositories/push-subscription-repository";

export interface LuyraPushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: {
    url?: string;
  };
}

let configured = false;

function configureWebPush(): void {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Browser push is not configured. Set the VAPID environment variables.");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushNotificationConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

export async function sendPushNotification(
  subscription: StoredPushSubscription,
  payload: LuyraPushPayload
): Promise<{ sent: boolean; staleRemoved: boolean }> {
  configureWebPush();

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6, urgency: "normal" }
    );

    return { sent: true, staleRemoved: false };
  } catch (error) {
    const pushError = error as WebPushError;
    if (pushError.statusCode === 404 || pushError.statusCode === 410) {
      await deletePushSubscriptionByEndpoint(subscription.endpoint);
      return { sent: false, staleRemoved: true };
    }

    throw error;
  }
}
