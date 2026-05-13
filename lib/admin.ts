import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  UserData,
  Contribution,
  Resource,
  Course,
  Branch,
  ResourceType,
  UserRole,
} from "@/types";

// ─── Faculty ───────────────────────────────────────────

export async function getPendingFaculty(): Promise<UserData[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "faculty"),
    where("approved", "==", false)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserData);
}

export async function getAllFaculty(): Promise<UserData[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "faculty"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserData);
}

// ─── Courses ───────────────────────────────────────────

export async function getAllCourses(): Promise<Course[]> {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
}

export async function getCourse(id: string): Promise<Course | null> {
  const snap = await getDoc(doc(db, "courses", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Course) : null;
}

export async function createCourse(
  data: Omit<Course, "id">,
  id?: string
): Promise<string> {
  const courseId = id || data.code.toLowerCase().replace(/\s+/g, "-");
  await setDoc(doc(db, "courses", courseId), data);
  return courseId;
}

export async function updateCourse(
  id: string,
  data: Partial<Course>
): Promise<void> {
  await updateDoc(doc(db, "courses", id), data);
}

export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(doc(db, "courses", id));
  const branches = await getBranches(id);
  for (const branch of branches) {
    await deleteDoc(doc(db, "branches", branch.id));
  }
}

export async function getBranches(courseId: string): Promise<Branch[]> {
  const q = query(
    collection(db, "branches"),
    where("courseId", "==", courseId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
}

export async function createBranch(data: Branch): Promise<void> {
  await setDoc(doc(db, "branches", data.id), data);
}

export async function deleteBranch(id: string): Promise<void> {
  await deleteDoc(doc(db, "branches", id));
}

// ─── Contributions / Content Queue ─────────────────────

export async function getPendingContributions(): Promise<Contribution[]> {
  const q = query(
    collection(db, "contributions"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contribution));
}

export async function getAllContributions(): Promise<Contribution[]> {
  const q = query(
    collection(db, "contributions"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contribution));
}

export async function approveContribution(
  id: string,
  adminUid: string
): Promise<void> {
  const contribSnap = await getDoc(doc(db, "contributions", id));
  if (!contribSnap.exists()) throw new Error("Contribution not found");

  const contrib = contribSnap.data() as Contribution;
  const targetCollection = contrib.type;

  const batch = writeBatch(db);
  const resourceRef = doc(collection(db, targetCollection));
  batch.set(resourceRef, {
    title: contrib.title,
    description: contrib.description || "",
    courseId: contrib.courseId,
    branchId: contrib.branchId || null,
    semesterId: contrib.semesterId,
    subjectId: contrib.subjectId || "",
    unit: contrib.unit || null,
    fileUrl: contrib.fileUrl || "",
    tags: contrib.tags || [],
    createdBy: contrib.contributedBy,
    createdAt: Date.now(),
  });

  batch.update(doc(db, "contributions", id), {
    status: "approved",
    approvedBy: adminUid,
    approvedAt: Date.now(),
  });

  await batch.commit();
}

export async function rejectContribution(
  id: string,
  reason?: string
): Promise<void> {
  await updateDoc(doc(db, "contributions", id), {
    status: "rejected",
    rejectReason: reason || "",
    rejectedAt: Date.now(),
  });
}

// ─── Resources ─────────────────────────────────────────

export async function getResources(type: ResourceType): Promise<Resource[]> {
  const q = query(
    collection(db, type),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, type, ...d.data() } as Resource));
}

export async function getAllResources(): Promise<
  { type: ResourceType; data: Resource[] }[]
> {
  const types: ResourceType[] = ["notes", "pyqs", "assignments", "labManuals", "others"];
  const results = await Promise.all(
    types.map(async (t) => {
      const items = await getResources(t);
      return { type: t, data: items };
    })
  );
  return results;
}

export async function deleteResource(
  type: ResourceType,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, type, id));
}

// ─── Users ─────────────────────────────────────────────

export async function getAllUsers(): Promise<UserData[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserData);
}

export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

// ─── Stats ──────────────────────────────────────────────

export async function getAdminStats() {
  const [usersSnap, facultySnap, contribSnap, notesSnap, pyqsSnap, assignSnap, labSnap] =
    await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "faculty"),
          where("approved", "==", false)
        )
      ),
      getDocs(
        query(
          collection(db, "contributions"),
          where("status", "==", "pending")
        )
      ),
      getDocs(collection(db, "notes")),
      getDocs(collection(db, "pyqs")),
      getDocs(collection(db, "assignments")),
      getDocs(collection(db, "labManuals")),
    ]);

  return {
    totalUsers: usersSnap.size,
    pendingFaculty: facultySnap.size,
    pendingContributions: contribSnap.size,
    totalResources:
      notesSnap.size + pyqsSnap.size + assignSnap.size + labSnap.size,
  };
}
