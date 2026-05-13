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
} from "@/lib/queries";
import type { Course, Branch } from "@/types";

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

  const [branchData, setBranchData] = useState<
    Record<string, Branch[]>
  >({});
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchCourseId, setBranchCourseId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");

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
                {c.hasBranches && (
                  <Button
                    variant="ghost"
                    onClick={() => openAddBranch(c.id)}
                  >
                    + Branch
                  </Button>
                )}
                <Button variant="ghost" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirm(c.id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {c.hasBranches && branchData[c.id]?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {branchData[c.id].map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {b.name}
                    <button
                      onClick={() => handleDeleteBranch(b.id, c.id)}
                      className="text-text-tertiary hover:text-destructive cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCourse ? "Edit Course" : "Add Course"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Course Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Bachelor of Technology"
          />
          <Input
            label="Course Code"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
            placeholder="e.g. BTECH"
          />
          <Input
            label="Number of Semesters"
            type="number"
            min={1}
            max={12}
            value={formSemesters}
            onChange={(e) => setFormSemesters(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={formHasBranches}
              onChange={(e) => setFormHasBranches(e.target.checked)}
              className="rounded border-border"
            />
            This course has branches / specializations
          </label>
          <Button onClick={handleSave} loading={saving} className="w-full">
            {editingCourse ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title="Add Branch"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. Computer Science & Engineering"
          />
          <Input
            label="Branch Code"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
            placeholder="e.g. CSE"
          />
          <Button onClick={handleSaveBranch} className="w-full">
            Add Branch
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Course"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this course? This will also remove
            all associated branches. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
