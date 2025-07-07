-- migrations/001_add_notification_trigger.sql

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION notify_on_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSON;
  assigner_name TEXT;
  task_title TEXT;
  notification_message TEXT;
  new_notification RECORD;
BEGIN
  -- Get the name of the user who assigned the task
  SELECT full_name INTO assigner_name FROM users WHERE user_id = NEW.assigned_by;

  -- Get the title of the task
  SELECT title INTO task_title FROM tasks WHERE task_id = NEW.task_id;

  -- Create the notification message
  notification_message := assigner_name || ' assigned you a new task: "' || task_title || '"';

  -- Insert the new notification into the notifications table
  INSERT INTO notifications (user_id, message, is_read)
  VALUES (NEW.assignee_id, notification_message, FALSE)
  RETURNING notification_id, user_id, message, created_at, is_read INTO new_notification;

  -- Create the JSON payload to send via pg_notify
  notification_payload := json_build_object(
      'notification_id', new_notification.notification_id,
      'user_id', new_notification.user_id,
      'message', new_notification.message,
      'created_at', new_notification.created_at,
      'is_read', new_notification.is_read
  );

  -- Notify the 'new_notification_channel' with the payload
  PERFORM pg_notify('new_notification_channel', notification_payload::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists to ensure a clean setup
DROP TRIGGER IF EXISTS task_assignment_notify_trigger ON task_assignments;

-- Create the trigger that fires the function after a new row is inserted
CREATE TRIGGER task_assignment_notify_trigger
AFTER INSERT ON task_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_on_task_assignment();
