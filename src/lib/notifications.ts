// Best-effort in-app notifications.
//
// A failed notification must never break the user action that triggered it, so
// every helper here swallows errors (including the case where the notifications
// table has not been migrated yet). `organization_id` is filled automatically by
// the `set_notifications_organization_id` trigger from the acting user's profile,
// and the notifications RLS SELECT policy is keyed on `user_id`, so a recipient
// always sees their own rows even across organizations (e.g. an external doctor).

type NotificationType = 'task' | 'case' | 'document'

type InsertableClient = {
  from: (table: string) => {
    insert: (values: unknown) => PromiseLike<{ error: unknown }>
  }
}

type NotifyInput = {
  userId: string
  title: string
  message: string
  type?: NotificationType
  relatedId?: string | null
}

export async function notifyUser(
  supabase: InsertableClient,
  { userId, title, message, type = 'case', relatedId = null }: NotifyInput
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId,
    })
  } catch {
    // Notifications are non-critical; never surface failures to the caller.
  }
}
