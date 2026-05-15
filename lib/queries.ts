import { supabase } from "./supabase";
import type {
  UserData,
  Contribution,
  Resource,
  Course,
  Branch,
  ResourceType,
  UserRole,
  Assignment,
  Submission,
} from "@/types";

type Row<T> = T;

function mapUser(row: Record<string, unknown>): UserData {
  return {
    uid: row.uid as string,
    email: row.email as string,
    role: row.role as UserRole,
    createdAt: row.createdAt as number,
    approved: row.approved as boolean | undefined,
  };
}

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    name: row.name as string,
    code: row.code as string,
    hasBranches: row.hasBranches as boolean,
    semesters: row.semesters as number[],
  };
}

function mapBranch(row: Record<string, unknown>): Branch {
  return {
    id: row.id as string,
    courseId: row.courseId as string,
    name: row.name as string,
    code: row.code as string,
  };
}

function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: row.id as string,
    type: row.type as ResourceType,
    title: row.title as string,
    description: row.description as string,
    courseId: row.courseId as string,
    branchId: row.branchId as string | null,
    semesterId: row.semesterId as number,
    subjectId: row.subjectId as string,
    unit: row.unit as number | undefined,
    fileUrl: row.fileUrl as string,
    tags: row.tags as string[],
    contributedBy: row.contributedBy as string,
    contributorName: row.contributorName as string,
    status: row.status as "pending" | "approved" | "rejected",
    createdAt: row.createdAt as number,
    approvedBy: row.approvedBy as string | undefined,
    approvedAt: row.approvedAt as number | undefined,
    rejectReason: row.rejectReason as string | undefined,
  };
}

function mapResource(row: Record<string, unknown>): Resource {
  return {
    id: row.id as string,
    type: row.type as ResourceType,
    title: row.title as string,
    description: row.description as string,
    courseId: row.courseId as string,
    branchId: row.branchId as string | null,
    semesterId: row.semesterId as number,
    subjectId: row.subjectId as string,
    unit: row.unit as number | undefined,
    fileUrl: row.fileUrl as string,
    tags: row.tags as string[],
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
  };
}

function mapAssignment(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    courseId: row.courseId as string,
    branchId: row.branchId as string | null,
    semesterId: row.semesterId as number,
    subjectId: row.subjectId as string,
    fileUrl: row.fileUrl as string,
    dueDate: row.dueDate as number,
    maxMarks: row.maxMarks as number | null,
    allowLate: row.allowLate as boolean,
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
  };
}

function mapSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as string,
    assignmentId: row.assignmentId as string,
    studentId: row.studentId as string,
    studentEmail: row.studentEmail as string | undefined,
    fileUrl: row.fileUrl as string,
    status: row.status as "pending" | "submitted" | "late",
    submittedAt: row.submittedAt as number | null,
    grade: row.grade as string | null,
    feedback: row.feedback as string,
    gradedBy: row.gradedBy as string | null,
    gradedAt: row.gradedAt as number | null,
  };
}

// ─── Faculty ───────────────────────────────────────────

export async function getPendingFaculty(): Promise<UserData[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "faculty")
    .eq("approved", false);
  return (data || []).map((r) => mapUser(r as unknown as Record<string, unknown>));
}

export async function getAllFaculty(): Promise<UserData[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "faculty")
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapUser(r as unknown as Record<string, unknown>));
}

// ─── Courses ───────────────────────────────────────────

export async function getAllCourses(): Promise<Course[]> {
  const { data } = await supabase.from("courses").select("*");
  return (data || []).map((r) => mapCourse(r as unknown as Record<string, unknown>));
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapCourse(data as unknown as Record<string, unknown>) : null;
}

export async function createCourse(
  courseData: Omit<Course, "id">,
  id?: string
): Promise<string> {
  const courseId = id || courseData.code.toLowerCase().replace(/\s+/g, "-");
  const { error } = await supabase.from("courses").upsert({
    id: courseId,
    name: courseData.name,
    code: courseData.code,
    hasBranches: courseData.hasBranches,
    semesters: courseData.semesters,
  });
  if (error) throw error;
  return courseId;
}

export async function updateCourse(
  id: string,
  data: Partial<Course>
): Promise<void> {
  const { error } = await supabase.from("courses").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteCourse(id: string): Promise<void> {
  await supabase.from("branches").delete().eq("courseId", id);
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function getBranches(courseId: string): Promise<Branch[]> {
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("courseId", courseId);
  return (data || []).map((r) => mapBranch(r as unknown as Record<string, unknown>));
}

export async function createBranch(data: Branch): Promise<void> {
  const { error } = await supabase.from("branches").upsert({
    id: data.id,
    courseId: data.courseId,
    name: data.name,
    code: data.code,
  });
  if (error) throw error;
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}

// ─── Subjects ───────────────────────────────────────────

export async function getSubjects(
  courseId: string,
  branchId: string | null,
  semesterId: number
): Promise<{ id: string; name: string; code: string }[]> {
  let query = supabase
    .from("subjects")
    .select("id, name, code")
    .eq("courseId", courseId)
    .eq("semesterId", semesterId);

  if (branchId) {
    query = query.eq("branchId", branchId);
  } else {
    query = query.is("branchId", null);
  }

  const { data } = await query.order("name", { ascending: true });
  return (data || []) as { id: string; name: string; code: string }[];
}

export async function createSubject(
  courseId: string,
  branchId: string | null,
  semesterId: number,
  name: string,
  code: string
): Promise<string> {
  const id = `${courseId}_${branchId || "common"}_${semesterId}_${code.toLowerCase()}`;
  const { error } = await supabase.from("subjects").upsert({
    id,
    courseId,
    branchId,
    semesterId,
    name,
    code: code.toUpperCase(),
  });
  if (error) throw error;
  return id;
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
}

// ─── Assignments ────────────────────────────────────────

export async function getAssignmentsForStudent(
  courseId: string,
  branchId: string | null,
  semesterId: number
): Promise<Assignment[]> {
  let query = supabase
    .from("assignments")
    .select("*")
    .eq("courseId", courseId)
    .eq("semesterId", semesterId)
    .order("dueDate", { ascending: true });

  if (branchId) {
    query = query.eq("branchId", branchId);
  } else {
    query = query.is("branchId", null);
  }

  const { data } = await query;
  return (data || []).map((r) => mapAssignment(r as unknown as Record<string, unknown>));
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const { data } = await supabase
    .from("assignments")
    .select("*")
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapAssignment(r as unknown as Record<string, unknown>));
}

export async function getAssignmentsByFaculty(
  facultyId: string
): Promise<Assignment[]> {
  const { data } = await supabase
    .from("assignments")
    .select("*")
    .eq("createdBy", facultyId)
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapAssignment(r as unknown as Record<string, unknown>));
}

// ─── Submissions ────────────────────────────────────────

export async function getSubmission(
  assignmentId: string,
  studentId: string
): Promise<{ id: string; status: string; fileUrl: string } | null> {
  const { data } = await supabase
    .from("submissions")
    .select("id, status, fileUrl")
    .eq("assignmentId", assignmentId)
    .eq("studentId", studentId)
    .maybeSingle();
  return data as { id: string; status: string; fileUrl: string } | null;
}

export async function getFullSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignmentId", assignmentId)
    .eq("studentId", studentId)
    .maybeSingle();
  if (!data) return null;
  return mapSubmission(data as unknown as Record<string, unknown>);
}

export async function upsertSubmission(
  assignmentId: string,
  studentId: string,
  status: string,
  fileUrl?: string
): Promise<void> {
  const existing = await getSubmission(assignmentId, studentId);
  if (existing) {
    await supabase
      .from("submissions")
      .update({
        status,
        fileUrl: fileUrl || existing.fileUrl,
        submittedAt: status === "submitted" || status === "late" ? Date.now() : null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("submissions").insert({
      assignmentId,
      studentId,
      status,
      fileUrl: fileUrl || "",
      submittedAt: status === "submitted" || status === "late" ? Date.now() : null,
    });
  }
}

export async function getSubmissionsForAssignment(
  assignmentId: string
): Promise<Submission[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignmentId", assignmentId)
    .order("submittedAt", { ascending: false });
  return (data || []).map((r) => mapSubmission(r as unknown as Record<string, unknown>));
}

export async function getSubmissionsByStudent(
  studentId: string
): Promise<Submission[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("studentId", studentId)
    .order("submittedAt", { ascending: false });
  return (data || []).map((r) => mapSubmission(r as unknown as Record<string, unknown>));
}

export async function gradeSubmission(
  submissionId: string,
  grade: string | null,
  feedback: string,
  gradedBy: string
): Promise<void> {
  const { error } = await supabase
    .from("submissions")
    .update({
      grade,
      feedback,
      gradedBy,
      gradedAt: Date.now(),
    })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) throw error;
}

// ─── Contributions / Content Queue ─────────────────────

export async function getPendingContributions(): Promise<Contribution[]> {
  const { data } = await supabase
    .from("contributions")
    .select("*")
    .eq("status", "pending")
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapContribution(r as unknown as Record<string, unknown>));
}

export async function getAllContributions(): Promise<Contribution[]> {
  const { data } = await supabase
    .from("contributions")
    .select("*")
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapContribution(r as unknown as Record<string, unknown>));
}

export async function approveContribution(
  id: string,
  adminUid: string
): Promise<void> {
  const { data: contrib } = await supabase
    .from("contributions")
    .select("*")
    .eq("id", id)
    .single();

  if (!contrib) throw new Error("Contribution not found");

  const c = contrib as unknown as Record<string, unknown>;

  const { error: resourceError } = await supabase.from("resources").insert({
    type: c.type,
    title: c.title,
    description: c.description || "",
    courseId: c.courseId,
    branchId: c.branchId || null,
    semesterId: c.semesterId,
    subjectId: c.subjectId || "",
    unit: c.unit || null,
    fileUrl: c.fileUrl || "",
    tags: c.tags || [],
    createdBy: c.contributedBy,
    createdAt: Date.now(),
  });
  if (resourceError) throw resourceError;

  const { error: updateError } = await supabase
    .from("contributions")
    .update({
      status: "approved",
      approvedBy: adminUid,
      approvedAt: Date.now(),
    })
    .eq("id", id);
  if (updateError) throw updateError;
}

export async function rejectContribution(
  id: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from("contributions")
    .update({
      status: "rejected",
      rejectReason: reason || "",
      rejectedAt: Date.now(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function getMyContributions(uid: string): Promise<Contribution[]> {
  const { data } = await supabase
    .from("contributions")
    .select("*")
    .eq("contributedBy", uid)
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapContribution(r as unknown as Record<string, unknown>));
}

// ─── Resources ─────────────────────────────────────────

export async function getResources(type: ResourceType): Promise<Resource[]> {
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("type", type)
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapResource(r as unknown as Record<string, unknown>));
}

export async function getAllResources(): Promise<
  { type: ResourceType; data: Resource[] }[]
> {
  const { data } = await supabase
    .from("resources")
    .select("*")
    .order("createdAt", { ascending: false });

  const grouped: Record<string, Resource[]> = {};
  for (const r of data || []) {
    const res = mapResource(r as unknown as Record<string, unknown>);
    if (!grouped[res.type]) grouped[res.type] = [];
    grouped[res.type].push(res);
  }

  const types: ResourceType[] = ["notes", "pyqs", "assignments", "labManuals", "others"];
  return types
    .filter((t) => grouped[t])
    .map((type) => ({ type, data: grouped[type] || [] }));
}

export async function deleteResource(
  type: ResourceType,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("type", type);
  if (error) throw error;
}

// ─── Users ─────────────────────────────────────────────

export async function getAllUsers(): Promise<UserData[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("createdAt", { ascending: false });
  return (data || []).map((r) => mapUser(r as unknown as Record<string, unknown>));
}

export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("uid", uid);
  if (error) throw error;
}

// ─── Stats ──────────────────────────────────────────────

export async function getAdminStats() {
  const [
    { count: totalUsers },
    { count: pendingFaculty },
    { count: pendingContributions },
    { count: totalResources },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "faculty")
      .eq("approved", false),
    supabase
      .from("contributions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("resources").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: totalUsers || 0,
    pendingFaculty: pendingFaculty || 0,
    pendingContributions: pendingContributions || 0,
    totalResources: totalResources || 0,
  };
}
