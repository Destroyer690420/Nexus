"use client";

import { useState, useEffect } from "react";
import { Button, Card, Modal, Input } from "@/components/ui";
import {
  getAllCourses,
  getBranches,
  createCourse,
  updateCourse,
  deleteCourse,
  createBranch,
  deleteBranch,
  getSubjects,
  createSubject,
  deleteSubject,
} from "@/lib/queries";
import type { Course, Branch } from "@/types";

interface SubjectItem { id: string; name: string; code: string }

export function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formHasBranches, setFormHasBranches] = useState(false);
  const [formSemesters, setFormSemesters] = useState("8");
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [branchData, setBranchData] = useState<Record<string, Branch[]>>({});
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchCourseId, setBranchCourseId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");

  const [showSubjects, setShowSubjects] = useState<string | null>(null);
  const [subSemester, setSubSemester] = useState("");
  const [subBranch, setSubBranch] = useState("");
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const list = await getAllCourses();
    setCourses(list);
    const branches: Record<string, Branch[]> = {};
    for (const c of list) {
      if (c.hasBranches) branches[c.id] = await getBranches(c.id);
    }
    setBranchData(branches);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingCourse(null);
    setFormName("");
    setFormCode("");
    setFormHasBranches(false);
    setFormSemesters("8");
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditingCourse(c);
    setFormName(c.name);
    setFormCode(c.code);
    setFormHasBranches(c.hasBranches);
    setFormSemesters(String(c.semesters.length));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formCode) return;
    setSaving(true);
    const semCount = Number(formSemesters);
    const semesters = Array.from({ length: semCount }, (_, i) => i + 1);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          name: formName,
          code: formCode,
          hasBranches: formHasBranches,
          semesters,
        });
      } else {
        const id = formCode.toLowerCase().replace(/\s+/g, "-");
        await createCourse(
          { name: formName, code: formCode, hasBranches: formHasBranches, semesters },
          id
        );
      }
      setShowModal(false);
      await loadCourses();
    } catch {
      alert("Failed to save course.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      setDeleteConfirm(null);
      await loadCourses();
    } catch {
      alert("Failed to delete course.");
    }
  };

  const openAddBranch = (courseId: string) => {
    setBranchCourseId(courseId);
    setBranchName("");
    setBranchCode("");
    setShowBranchModal(true);
  };

  const handleSaveBranch = async () => {
    if (!branchName || !branchCode || !branchCourseId) return;
    try {
      const id = `${branchCourseId}_${branchCode.toLowerCase()}`;
      await createBranch({
        id,
        courseId: branchCourseId,
        name: branchName,
        code: branchCode.toUpperCase(),
      });
      setShowBranchModal(false);
      const branches = await getBranches(branchCourseId);
      setBranchData((prev) => ({ ...prev, [branchCourseId]: branches }));
    } catch {
      alert("Failed to add branch.");
    }
  };

  const handleDeleteBranch = async (branchId: string, courseId: string) => {
    try {
      await deleteBranch(branchId);
      const branches = await getBranches(courseId);
      setBranchData((prev) => ({ ...prev, [courseId]: branches }));
    } catch {
      alert("Failed to delete branch.");
    }
  };

  const openSubjects = async (courseId: string) => {
    setShowSubjects(courseId === showSubjects ? null : courseId);
    setSubSemester("");
    setSubBranch("");
    setSubjectList([]);
  };

  const loadSubjects = async () => {
    if (!showSubjects || !subSemester) return;
    const course = courses.find((c) => c.id === showSubjects);
    const branch = course?.hasBranches ? subBranch : null;
    const list = await getSubjects(showSubjects, branch, Number(subSemester));
    setSubjectList(list);
  };

  useEffect(() => {
    loadSubjects();
  }, [showSubjects, subSemester, subBranch]);

  const handleAddSubject = async () => {
    if (!newSubName || !newSubCode || !showSubjects || !subSemester) return;
    try {
      const course = courses.find((c) => c.id === showSubjects);
      const branch = course?.hasBranches ? subBranch : null;
      await createSubject(showSubjects, branch, Number(subSemester), newSubName, newSubCode);
      setNewSubName("");
      setNewSubCode("");
      await loadSubjects();
    } catch {
      alert("Failed to add subject.");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject(id);
      setSubjectList((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete subject.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          {courses.length} course{courses.length !== 1 ? "s" : ""} configured.
        </p>
        <Button onClick={openAdd} variant="primary">
          Add Course
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {courses.length === 0 && (
          <Card>
            <p className="text-sm text-text-secondary">
              No courses yet. Click "Add Course" to get started.
            </p>
          </Card>
        )}
        {courses.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {c.name}{" "}
                  <span className="text-text-tertiary font-normal">
                    ({c.code})
                  </span>
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {c.semesters.length} semesters
                  {c.hasBranches ? " · Has branches" : " · No branches"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openSubjects(c.id)}>
                  {showSubjects === c.id ? "Close Subjects" : "Subjects"}
                </Button>
                {c.hasBranches && (
                  <Button variant="ghost" onClick={() => openAddBranch(c.id)}>
                    + Branch
                  </Button>
                )}
                <Button variant="ghost" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => setDeleteConfirm(c.id)}>
                  Delete
                </Button>
              </div>
            </div>

            {c.hasBranches && branchData[c.id]?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {branchData[c.id].map((b) => (
                  <span key={b.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary">
                    {b.name}
                    <button onClick={() => handleDeleteBranch(b.id, c.id)}
                      className="text-text-tertiary hover:text-destructive cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            )}

            {showSubjects === c.id && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium mb-3">
                  Subjects
                </p>
                <div className="flex gap-3 mb-3">
                  {c.hasBranches && (
                    <select value={subBranch} onChange={(e) => setSubBranch(e.target.value)}
                      className="rounded-md border border-border bg-input-bg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent">
                      <option value="">All branches</option>
                      {branchData[c.id]?.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                  <select value={subSemester} onChange={(e) => setSubSemester(e.target.value)}
                    className="rounded-md border border-border bg-input-bg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent">
                    <option value="">Select semester</option>
                    {c.semesters.map((s) => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {subSemester && (
                  <>
                    {subjectList.length === 0 ? (
                      <p className="text-xs text-text-tertiary mb-3">No subjects added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {subjectList.map((s) => (
                          <span key={s.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary">
                            {s.name}
                            <button onClick={() => handleDeleteSubject(s.id)}
                              className="text-text-tertiary hover:text-destructive cursor-pointer">×</button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-end">
                      <Input placeholder="Subject name" value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="text-xs" />
                      <Input placeholder="Code" value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                        className="text-xs w-20" />
                      <Button variant="primary" onClick={handleAddSubject}>
                        Add
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingCourse ? "Edit Course" : "Add Course"}>
        <div className="flex flex-col gap-4">
          <Input label="Course Name" value={formName} onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Bachelor of Technology" />
          <Input label="Course Code" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())}
            placeholder="e.g. BTECH" />
          <Input label="Number of Semesters" type="number" min={1} max={12}
            value={formSemesters} onChange={(e) => setFormSemesters(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={formHasBranches}
              onChange={(e) => setFormHasBranches(e.target.checked)}
              className="rounded border-border" />
            This course has branches / specializations
          </label>
          <Button onClick={handleSave} loading={saving} className="w-full">
            {editingCourse ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showBranchModal} onClose={() => setShowBranchModal(false)} title="Add Branch">
        <div className="flex flex-col gap-4">
          <Input label="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. Computer Science & Engineering" />
          <Input label="Branch Code" value={branchCode} onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
            placeholder="e.g. CSE" />
          <Button onClick={handleSaveBranch} className="w-full">Add Branch</Button>
        </div>
      </Modal>

      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Course">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this course? This will also remove
            all associated branches and subjects. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
