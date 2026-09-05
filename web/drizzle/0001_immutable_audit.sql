-- Custom SQL migration file, put your code below! --
CREATE TRIGGER pilot_events_no_update BEFORE UPDATE ON pilot_events
BEGIN SELECT RAISE(ABORT, 'Pilot audit events are append-only'); END;
--> statement-breakpoint
CREATE TRIGGER pilot_events_no_delete BEFORE DELETE ON pilot_events
BEGIN SELECT RAISE(ABORT, 'Pilot audit events are append-only'); END;
