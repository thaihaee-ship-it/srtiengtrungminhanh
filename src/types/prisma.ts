// Temporary types while waiting for database connection
// These will be replaced by Prisma generated types

export type Role = "ADMIN" | "MANAGER" | "TEACHER" | "STUDENT";

export type AssignmentType = 
  | "MCQ" 
  | "ESSAY" 
  | "PRONUNCIATION" 
  | "TRANSLATION_SPEAKING" 
  | "TF_ON_DOCUMENT";

export type AssignmentStatus = "DRAFT" | "OPEN" | "CLOSED";

export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  code: string;
  isActive: boolean;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: AssignmentType;
  status: AssignmentStatus;
  deadline?: Date;
  classroomId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
