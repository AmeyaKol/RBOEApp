export type ApplicationStatus =
  | "APPLYING"
  | "APPLIED"
  | "ACCEPTED"
  | "REJECTED"
  | "WAITLISTED"
  | "RESEARCHING";

export interface ApplicationViewModel {
  id: string;
  universityName: string;
  programName: string;
  status: ApplicationStatus;
  deadline: string;
  applicationFee: number;
  createdAt: string;
}

/** Row from GET /api/student/applications */
export interface ApiStudentApplicationRow {
  id: string;
  university_name: string;
  program_name: string;
  status: string;
  deadline: string;
  application_fee: number;
  created_at: string;
}

const VALID: ApplicationStatus[] = [
  "APPLYING",
  "APPLIED",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
  "RESEARCHING",
];

function normalizeStatus(s: string): ApplicationStatus {
  return VALID.includes(s as ApplicationStatus) ? (s as ApplicationStatus) : "RESEARCHING";
}

export function mapApiApplicationToViewModel(app: ApiStudentApplicationRow): ApplicationViewModel {
  return {
    id: app.id,
    universityName: app.university_name,
    programName: app.program_name,
    status: normalizeStatus(app.status),
    deadline: app.deadline,
    applicationFee: app.application_fee,
    createdAt: app.created_at,
  };
}
