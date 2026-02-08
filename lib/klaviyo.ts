/**
 * Klaviyo integration – server-side (Private API) and client-side (Push API) helpers.
 *
 * Server-side uses the Klaviyo v2024-10-15 revision.
 * Client-side uses the Klaviyo Push API loaded via their JS snippet.
 */

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_API_KEY ?? '';
const KLAVIYO_API_REVISION = '2024-10-15';
const KLAVIYO_BASE = 'https://a.klaviyo.com';

/* ------------------------------------------------------------------ */
/*  Server-side: subscribe a profile to a Klaviyo list                */
/* ------------------------------------------------------------------ */

interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Klaviyo List ID – defaults to env KLAVIYO_LIST_ID */
  listId?: string;
  source?: string;
}

export async function subscribeToList({
  email,
  firstName,
  lastName,
  listId,
  source = 'website-footer',
}: SubscribeOptions) {
  const targetList = listId || process.env.KLAVIYO_LIST_ID;

  if (!KLAVIYO_PRIVATE_KEY) {
    throw new Error('KLAVIYO_PRIVATE_API_KEY is not set');
  }

  // Create/update profile via the Profiles API
  const profileRes = await fetch(`${KLAVIYO_BASE}/api/profiles/`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
      revision: KLAVIYO_API_REVISION,
    },
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          properties: {
            source,
          },
        },
      },
    }),
  });

  // 201 = created, 409 = already exists (both are fine)
  if (!profileRes.ok && profileRes.status !== 409) {
    const text = await profileRes.text();
    throw new Error(`Klaviyo profile creation failed: ${profileRes.status} – ${text}`);
  }

  // If a list ID is provided, subscribe to it
  if (targetList) {
    const subRes = await fetch(
      `${KLAVIYO_BASE}/api/lists/${targetList}/relationships/profiles/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
          revision: KLAVIYO_API_REVISION,
        },
        body: JSON.stringify({
          data: [
            {
              type: 'profile',
              id: profileRes.status === 409
                ? undefined // Will be resolved by email
                : (await profileRes.json()).data?.id,
            },
          ],
        }),
      }
    );

    // If the profile already existed (409), use the Subscribe API instead
    if (profileRes.status === 409 || !subRes.ok) {
      await fetch(`${KLAVIYO_BASE}/api/profile-subscription-bulk-create-jobs/`, {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
          revision: KLAVIYO_API_REVISION,
        },
        body: JSON.stringify({
          data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {
              profiles: {
                data: [
                  {
                    type: 'profile',
                    attributes: {
                      email,
                      subscriptions: {
                        email: { marketing: { consent: 'SUBSCRIBED' } },
                      },
                    },
                  },
                ],
              },
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: targetList,
                },
              },
            },
          },
        }),
      });
    }
  }

  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Server-side: track an event (for server-to-server tracking)       */
/* ------------------------------------------------------------------ */

interface TrackEventOptions {
  email: string;
  eventName: string;
  properties: Record<string, unknown>;
  value?: number;
}

export async function trackServerEvent({
  email,
  eventName,
  properties,
  value,
}: TrackEventOptions) {
  if (!KLAVIYO_PRIVATE_KEY) return;

  await fetch(`${KLAVIYO_BASE}/api/events/`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
      revision: KLAVIYO_API_REVISION,
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: {
            data: {
              type: 'metric',
              attributes: { name: eventName },
            },
          },
          profile: {
            data: {
              type: 'profile',
              attributes: { email },
            },
          },
          properties,
          ...(value !== undefined && { value }),
        },
      },
    }),
  });
}
