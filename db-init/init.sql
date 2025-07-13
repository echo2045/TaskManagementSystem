-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS public.work_sessions;
DROP TABLE IF EXISTS public.task_assignments;
DROP TABLE IF EXISTS public.task_requests;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.user_supervisors;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.areas;
DROP TABLE IF EXISTS public.users;

-- Table: public.users
CREATE TABLE public.users
(
    user_id SERIAL PRIMARY KEY,
    username character varying(50) NOT NULL UNIQUE,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL UNIQUE,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.areas
CREATE TABLE public.areas
(
    area_id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL,
    created_by integer REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_completed boolean DEFAULT false
);

-- Table: public.projects
CREATE TABLE public.projects
(
    project_id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL,
    created_by integer REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_completed boolean DEFAULT false
);

-- Table: public.tasks
CREATE TABLE public.tasks
(
    task_id SERIAL PRIMARY KEY,
    title character varying(255) NOT NULL,
    description text,
    deadline timestamp with time zone,
    importance integer CHECK (importance >= 1 AND importance <= 10),
    urgency integer CHECK (urgency >= 1 AND urgency <= 10),
    status character varying(20) DEFAULT 'pending',
    owner_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now(),
    project_id integer REFERENCES public.projects(project_id) ON DELETE CASCADE,
    area_id integer REFERENCES public.areas(area_id) ON DELETE CASCADE,
    start_date timestamp without time zone DEFAULT now(),
    time_estimate numeric(10,2),
    CONSTRAINT task_project_or_area_check CHECK (project_id IS NOT NULL AND area_id IS NULL OR project_id IS NULL AND area_id IS NOT NULL OR project_id IS NULL AND area_id IS NULL),
    CONSTRAINT tasks_start_date_check CHECK (deadline IS NULL OR start_date <= deadline)
);

-- Table: public.user_supervisors
CREATE TABLE public.user_supervisors
(
    supervisor_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    supervisee_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (supervisor_id, supervisee_id)
);

-- Table: public.notifications
CREATE TABLE public.notifications
(
    notification_id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read boolean NOT NULL DEFAULT false,
    type character varying(50) NOT NULL DEFAULT 'standard',
    metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications (type);

-- Table: public.task_requests
CREATE TABLE public.task_requests
(
    request_id SERIAL PRIMARY KEY,
    requester_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    supervisor_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    title character varying(255) NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: public.task_assignments
CREATE TABLE public.task_assignments
(
    assignment_id SERIAL PRIMARY KEY,
    task_id integer NOT NULL REFERENCES public.tasks(task_id) ON DELETE CASCADE,
    assignee_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    assigned_by integer REFERENCES public.users(user_id) ON DELETE NO ACTION,
    delegated_by integer REFERENCES public.users(user_id) ON DELETE NO ACTION,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_completed boolean DEFAULT false,
    assigned_importance integer CHECK (assigned_importance >= 1 AND assigned_importance <= 10),
    assigned_urgency integer CHECK (assigned_urgency >= 1 AND assigned_urgency <= 10),
    importance integer DEFAULT 0,
    urgency integer DEFAULT 0,
    start_date timestamp without time zone,
    assigned_time_estimate numeric(10,2),
    total_hours_spent numeric(10,2),
    time_difference numeric(10,2)
);

-- Table: public.work_sessions
CREATE TABLE public.work_sessions
(
    session_id SERIAL PRIMARY KEY,
    task_id integer NOT NULL REFERENCES public.tasks(task_id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_user ON public.work_sessions (user_id) WHERE end_time IS NULL;

-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.users (user_id, username, full_name, email, password, role, created_at) VALUES
(4, 'Person 2', 'Person 2', 'person2@example.com', '$2a$06$Qff5fC60Sggr0sl5nYvSYua9uAGBie5QUVHungAnHxs8pF48/AOs6', 'member', '2025-05-15 14:51:14.193125'),
(5, 'Person 3', 'Person 3', 'person3@example.com', '$2a$06$F0rNtr/EFok0S30wwhJlgegWIdBAxkeaivPUI.R3gaf2Eyera79zq', 'member', '2025-05-15 14:51:47.440923'),
(6, 'Team Lead 1', 'Team Lead 1', 'teamlead1@example.com', '$2a$06$e.g.a.valid.bcrypt.hash.for.password123.that.is.long.enough.and.not.truncated', 'team_lead', '2025-05-15 14:52:44.446649'),
(7, 'Team Lead 2', 'Team Lead 2', 'teamlead2@example.com', '$2a$06$ixB5f0nsXLR8qcFHPsnq9OmQIJNxYT7MD9F5LZAxzgdidv4kCZePK', 'team_lead', '2025-05-15 14:53:41.627404'),
(8, 'Manager 1', 'Manager 1', 'manager1@example.com', '$2a$06$O.OPfxE0L8XsMUGIvpTsqek69j3ZPpXrA7iJEZImLDVOEPdZaJMx6', 'manager', '2025-05-15 14:54:22.449706'),
(9, 'HR1', 'HR1', 'hr1@example.com', '$2a$06$88pBhtxG0jotKfTRhUMqY.CNtdMZG6weYrLE9ckQx8cmnoeh7Cp4C', 'hr', '2025-05-15 14:54:44.143066'),
(11, 'Manager2', 'Manager2', 'manager2@example.com', '$2a$06$xzfeWtpQeI0GzGTI2o9sIeWkgj8v42bBj64Otd1N16eQOtMPW06g2', 'manager', '2025-05-18 11:36:46.574601'),
(2, 'demo_user', 'Demo User', 'demo@example.com', '$2a$06$WQHR2hvrWC4WNnqad/05v.vRnvQdO030.BogEicJDsdbsIe2dHox.', 'member', '2025-05-14 11:16:06.2434'),
(12, 'hr2', 'HR2', 'hr2@example.com', '$2a$06$DXc7q8Bs.g/4oZLZR9llDussozc60U2P1r8K55wwwLAOKsM55ySKW', 'hr', '2025-05-18 16:06:24.949971'),
(13, 'Person 4', 'Person 4', 'person4@example.com', '$2a$06$taum9mfgWF.cnQH9KbjP/uzrS/xeMnhrJNJ08MdYV66eE1UK93HaG', 'member', '2025-05-20 11:56:42.255331'),
(3, 'Person 1', 'Person 1', 'person1@example.com', '$2a$06$LHfQSu1gEKicNiXBrIdpeuu1VhSGf/0ST6AngQ8TwLhyHNMYZpqr.', 'member', '2025-05-15 14:50:24.977781');

-- Reset the sequence to the max user_id from the inserted data
SELECT setval('public.users_user_id_seq', (SELECT MAX(user_id) FROM public.users));