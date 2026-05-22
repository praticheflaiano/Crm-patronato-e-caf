-- 0008_notifications.sql
-- Notifications table with RLS policies

-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('task', 'case', 'document');

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    related_id UUID, -- Can reference tasks.id, cases.id, or documents.id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-set organization_id based on user's profile
CREATE OR REPLACE FUNCTION set_notifications_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notifications_organization_id
BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE PROCEDURE set_notifications_organization_id();

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies

-- SELECT: Users can view their own notifications
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT USING (
    user_id = auth.uid()
);

-- INSERT: Users in the organization can create notifications
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
);

-- UPDATE: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

-- DELETE: Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
    )
);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type notification_type,
    p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = auth.uid() AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;