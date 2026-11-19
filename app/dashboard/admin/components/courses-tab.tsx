"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Sheet,
  ConfirmSheet,
  TextField,
  Select,
  Chip,
  Stickie,
} from "@/components/ui";
import {
  Plus,
  PencilSimple,
  Trash,
  BookOpen,
  GitBranch,
  X,
} from "@phosphor-icons/react";
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

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Course modal
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formHasBranches, setFormHasBranches] = useState(false);
  const [formSemesters, setFormSemesters] = useState("8");
  const [saving, setSaving] = useState(false);

  // Delete Course confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingCourse, setDeletingCourse] = useState(false);

  // Branch management
  const [branchData, setBranchData] = useState<Record<string, Branch[]>>({});
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchCourseId, setBranchCourseId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);

  // Subjects drilldown
  const [showSubjects, setShowSubjects] = useState<string | null>(null);
  const [subSemester, setSubSemester] = useState("");
  const [subBranch, setSubBranch] = useState("");
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

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
    setDeletingCourse(true);
    try {
      await deleteCourse(id);
      setDeleteConfirm(null);
      await loadCourses();
    } catch {
      alert("Failed to delete course.");
    }
    setDeletingCourse(false);
  };

  const openAddBranch = (courseId: string) => {
    setBranchCourseId(courseId);
    setBranchName("");
    setBranchCode("");
    setShowBranchModal(true);
  };

  const handleSaveBranch = async () => {
    if (!branchName || !branchCode || !branchCourseId) return;
    setSavingBranch(true);
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
    setSavingBranch(false);
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

  const loadSubjects = useCallback(async () => {
    if (!showSubjects || !subSemester) return;
    const course = courses.find((c) => c.id === showSubjects);
    const branch = course?.hasBranches ? subBranch : null;
    const list = await getSubjects(showSubjects, branch, Number(subSemester));
    setSubjectList(list);
  }, [showSubjects, subSemester, subBranch, courses]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleAddSubject = async () => {
    if (!newSubName || !newSubCode || !showSubjects || !subSemester) return;
    setAddingSubject(true);
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
    setAddingSubject(false);
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
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-line-strong border-t-berry animate-spin" />
        <p className="text-[14px] text-ink-3">Loading curriculum structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-extrabold text-ink">
            Curriculum Structure
          </h2>
          <p className="text-[14px] text-ink-2">
            {courses.length} course{courses.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={openAdd} variant="primary" size="md">
          <Plus size={18} weight="bold" className="mr-1.5" />
          Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center">
          <Stickie mood="think" size={100} className="mb-4" />
          <h3 className="font-display font-black text-lg text-ink mb-1">
            No courses found
          </h3>
          <p className="text-[14px] text-ink-2 max-w-sm mb-5">
            Add a degree or diploma program to organise subjects and study material.
          </p>
          <Button onClick={openAdd} variant="primary">
            Add First Course
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => {
            const isSubjectsOpen = showSubjects === c.id;
            const branches = branchData[c.id] || [];

            return (
              <Card key={c.id} className="p-5 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-sunflower/15 border border-sunflower/30 flex items-center justify-center shrink-0 text-sunflower">
                      <BookOpen size={22} weight="bold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-display font-extrabold text-ink">
                          {c.name}
                        </h3>
                        <Chip variant="sun">{c.code}</Chip>
                      </div>
                      <p className="text-[13px] text-ink-3 mt-0.5">
                        {c.semesters.length} semesters ·{" "}
                        {c.hasBranches ? `${branches.length} branches` : "No branches"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={isSubjectsOpen ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => openSubjects(c.id)}
                    >
                      <BookOpen size={16} weight="bold" className="mr-1" />
                      {isSubjectsOpen ? "Hide Subjects" : "Subjects"}
                    </Button>
                    {c.hasBranches && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openAddBranch(c.id)}
                      >
                        <Plus size={16} weight="bold" className="mr-1" />
                        Branch
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                    >
                      <PencilSimple size={18} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(c.id)}
                      className="text-crimson hover:bg-crimson/10"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash size={18} weight="bold" />
                    </Button>
                  </div>
                </div>

                {/* Branches List */}
                {c.hasBranches && (
                  <div className="mt-4 pt-4 border-t border-line/60">
                    <div className="flex items-center gap-2 mb-2 text-xs font-display font-extrabold text-ink-3 uppercase tracking-wider">
                      <GitBranch size={14} weight="bold" />
                      Branches ({branches.length})
                    </div>
                    {branches.length === 0 ? (
                      <p className="text-[13px] text-ink-3 italic">
                        No branches added yet. Click &quot;+ Branch&quot; to add one.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {branches.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-surface-2 border border-line text-[13px] font-medium text-ink"
                          >
                            <span>{b.name}</span>
                            <span className="text-[11px] font-mono font-bold text-ink-3">
                              ({b.code})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(b.id, c.id)}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson/10 transition-colors ml-1 cursor-pointer"
                              aria-label={`Delete branch ${b.name}`}
                            >
                              <X size={12} weight="bold" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subjects Drilldown Accordion */}
                {isSubjectsOpen && (
                  <div className="mt-4 pt-4 border-t-2 border-line space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display font-extrabold text-ink uppercase tracking-wider">
                        Manage Subjects
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {c.hasBranches && (
                        <Select
                          label="Filter by Branch"
                          value={subBranch}
                          onChange={(e) => setSubBranch(e.target.value)}
                        >
                          <option value="">All branches</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </Select>
                      )}
                      <Select
                        label="Select Semester"
                        value={subSemester}
                        onChange={(e) => setSubSemester(e.target.value)}
                      >
                        <option value="">Choose semester...</option>
                        {c.semesters.map((s) => (
                          <option key={s} value={String(s)}>
                            Semester {s}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {subSemester ? (
                      <div className="space-y-4 p-4 rounded-[16px] bg-surface-2 border border-line">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-display font-black text-ink-3 uppercase tracking-wider">
                            Semester {subSemester} Subjects ({subjectList.length})
                          </p>
                        </div>

                        {subjectList.length === 0 ? (
                          <p className="text-[13px] text-ink-3 italic py-2">
                            No subjects registered for this semester yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {subjectList.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-surface border border-line text-[13px] font-medium text-ink shadow-xs"
                              >
                                <span>{s.name}</span>
                                <span className="text-[11px] font-mono font-bold text-ink-3">
                                  ({s.code})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(s.id)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson/10 transition-colors ml-1 cursor-pointer"
                                  aria-label={`Delete subject ${s.name}`}
                                >
                                  <X size={12} weight="bold" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Add Subject form */}
                        <div className="pt-3 border-t border-line/60">
                          <p className="text-xs font-display font-extrabold text-ink mb-2">
                            Add a Subject
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="flex-1">
                              <TextField
                                placeholder="Subject name (e.g. Operating Systems)"
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                              />
                            </div>
                            <div className="w-full sm:w-32">
                              <TextField
                                placeholder="Code (e.g. CS501)"
                                value={newSubCode}
                                onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                              />
                            </div>
                            <Button
                              variant="primary"
                              onClick={handleAddSubject}
                              disabled={!newSubName.trim() || !newSubCode.trim() || addingSubject}
                              loading={addingSubject}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-ink-3 italic">
                        Please select a semester above to view and add subjects.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Sheet */}
      <Sheet
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingCourse ? "Edit Course" : "Add Course"}
        description={
          editingCourse
            ? "Update course name, code, or branch options."
            : "Define a new course or degree program."
        }
      >
        <div className="space-y-4 mt-2">
          <TextField
            label="Course Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Bachelor of Technology"
          />
          <TextField
            label="Course Code"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
            placeholder="e.g. BTECH"
          />
          <TextField
            label="Number of Semesters"
            type="number"
            min={1}
            max={12}
            value={formSemesters}
            onChange={(e) => setFormSemesters(e.target.value)}
          />

          <label className="flex items-center gap-3 p-3.5 rounded-[14px] bg-surface-2 border border-line cursor-pointer">
            <input
              type="checkbox"
              checked={formHasBranches}
              onChange={(e) => setFormHasBranches(e.target.checked)}
              className="w-5 h-5 rounded-[6px] accent-berry cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-[14px] font-display font-extrabold text-ink">
                Has branches / specializations
              </span>
              <span className="text-[12px] text-ink-3">
                Enable if students choose branches like CSE, ECE, ME, etc.
              </span>
            </div>
          </label>

          <div className="flex gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!formName.trim() || !formCode.trim()}
              fullWidth
            >
              {editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Add Branch Sheet */}
      <Sheet
        open={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title="Add Branch"
        description="Add a department or specialization to this course."
      >
        <div className="space-y-4 mt-2">
          <TextField
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. Computer Science & Engineering"
          />
          <TextField
            label="Branch Code"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
            placeholder="e.g. CSE"
          />
          <div className="flex gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setShowBranchModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveBranch}
              loading={savingBranch}
              disabled={!branchName.trim() || !branchCode.trim()}
              fullWidth
            >
              Add Branch
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Delete Course Confirm */}
      <ConfirmSheet
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Course?"
        description="Are you sure you want to delete this course? This will also remove all associated branches and subjects. This action cannot be undone."
        confirmLabel="Delete Course"
        destructive
        loading={deletingCourse}
      />
    </div>
  );
}
