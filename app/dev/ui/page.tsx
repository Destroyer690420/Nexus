"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import {
  Button,
  IconButton,
  Card,
  GroupedList,
  ListRow,
  SegmentedControl,
  ScrollTabs,
  TabBar,
  SearchField,
  TextField,
  Textarea,
  Select,
  Switch,
  FilePicker,
  ProgressBar,
  StatusPill,
  Chip,
  Avatar,
  Sheet,
  ConfirmSheet,
  Toast,
  Skeleton,
  Banner,
  FileCard,
  StatTile,
  Stepper,
  Stickie,
} from "@/components/ui";
import {
  House,
  MagnifyingGlass,
  PlusCircle,
  Bell,
  User,
  Gear,
  Trash,
  ShareNetwork,
  DownloadSimple,
  Sparkle,
} from "@phosphor-icons/react";

export default function UIDevGallery() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [segmentedVal, setSegmentedVal] = useState("all");
  const [activeTab, setActiveTab] = useState("notes");
  const [searchValue, setSearchValue] = useState("Operating Systems");
  const [switchVal, setSwitchVal] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: (a: boolean) => <House size={22} weight={a ? "fill" : "bold"} /> },
    { href: "/dashboard/search", label: "Search", icon: (a: boolean) => <MagnifyingGlass size={22} weight={a ? "fill" : "bold"} /> },
    { href: "/dashboard/contribute", label: "Contribute", icon: (a: boolean) => <PlusCircle size={22} weight={a ? "fill" : "bold"} /> },
    { href: "/dashboard/announcements", label: "Alerts", icon: (a: boolean) => <Bell size={22} weight={a ? "fill" : "bold"} />, badge: 3 },
    { href: "/dashboard/profile", label: "Profile", icon: (a: boolean) => <User size={22} weight={a ? "fill" : "bold"} /> },
  ];

  return (
    <div className="min-h-screen bg-bg-petal text-ink p-4 sm:p-8 max-w-5xl mx-auto space-y-12 pb-32">
      {/* Top Header & Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-line">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">
            Nexus UI Component Gallery
          </h1>
          <p className="text-ink-2 text-sm sm:text-base mt-1">
            Duolingo 3D Tactile × iOS System Inset Library
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-[16px] border-2 border-line">
          <Button
            size="sm"
            variant={theme === "light" ? "primary" : "ghost"}
            onClick={() => toggleTheme("light")}
          >
            Light
          </Button>
          <Button
            size="sm"
            variant={theme === "dark" ? "primary" : "ghost"}
            onClick={() => toggleTheme("dark")}
          >
            Dark
          </Button>
        </div>
      </div>

      {/* 1. Stickie Mascot Moods */}
      <section aria-labelledby="stickie-heading" className="space-y-4">
        <h2 id="stickie-heading" className="font-display font-black text-2xl text-ink">
          1. Stickie Mascot Moods
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {(["wave", "mail", "sleepy", "think", "cheer", "oops"] as const).map((mood) => (
            <Card key={mood} className="flex flex-col items-center justify-center p-4 text-center">
              <Stickie mood={mood} size={84} />
              <span className="font-display font-black text-sm text-ink mt-2 capitalize">
                {mood}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. 3D Buttons & IconButtons */}
      <section aria-labelledby="buttons-heading" className="space-y-4">
        <h2 id="buttons-heading" className="font-display font-black text-2xl text-ink">
          2. Buttons & 3D Tactile Elevation
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Berry</Button>
          <Button variant="secondary">Secondary Outline</Button>
          <Button variant="tonal">Tonal Tint</Button>
          <Button variant="sun" icon={<Sparkle size={18} weight="fill" />}>
            Marigold Reward
          </Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center pt-2">
          <Button size="sm">Small (40px)</Button>
          <Button size="md">Medium (48px)</Button>
          <Button size="lg">Large (56px)</Button>
          <Button loading>Loading State</Button>
          <Button disabled>Disabled Button</Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-2">
          <IconButton ariaLabel="Settings" variant="primary">
            <Gear size={20} weight="bold" />
          </IconButton>
          <IconButton ariaLabel="Share" variant="secondary">
            <ShareNetwork size={20} weight="bold" />
          </IconButton>
          <IconButton ariaLabel="Download" variant="tonal">
            <DownloadSimple size={20} weight="bold" />
          </IconButton>
          <IconButton ariaLabel="Delete" variant="ghost">
            <Trash size={20} weight="bold" />
          </IconButton>
        </div>
      </section>

      {/* 3. Cards */}
      <section aria-labelledby="cards-heading" className="space-y-4">
        <h2 id="cards-heading" className="font-display font-black text-2xl text-ink">
          3. Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="flat">
            <h3 className="font-display font-black text-lg text-ink">Flat 2px Outline</h3>
            <p className="text-sm text-ink-2 mt-1">Clean surface card with no blur shadow.</p>
          </Card>
          <Card variant="tappable" onClick={() => alert("Card tapped")}>
            <h3 className="font-display font-black text-lg text-ink">Tappable Ledge</h3>
            <p className="text-sm text-ink-2 mt-1">Press me! 4px tactile ledge pops on active.</p>
          </Card>
          <Card variant="tinted" tint="sun">
            <h3 className="font-display font-black text-lg text-sun-deep">Sun Tint</h3>
            <p className="text-sm text-sun-deep mt-1">Used for PYQs and announcements.</p>
          </Card>
          <Card variant="tinted" tint="fern">
            <h3 className="font-display font-black text-lg text-fern-deep">Fern Tint</h3>
            <p className="text-sm text-fern-deep mt-1">Used for Lab manuals and approvals.</p>
          </Card>
        </div>
      </section>

      {/* 4. Grouped Inset Lists & Rows */}
      <section aria-labelledby="lists-heading" className="space-y-4">
        <h2 id="lists-heading" className="font-display font-black text-2xl text-ink">
          4. iOS Inset Grouped Lists
        </h2>
        <GroupedList header="ACADEMIC PROFILE" footer="Semester updates take effect immediately.">
          <ListRow
            icon={<House size={18} weight="bold" />}
            title="Course & Branch"
            subtitle="B.Tech Computer Science"
            chevron
            onClick={() => {}}
          />
          <ListRow
            icon={<Bell size={18} weight="bold" />}
            iconBg="bg-sun-tint text-sun-deep"
            title="Current Semester"
            trailing={<span className="font-bold text-ink">Semester 6</span>}
            chevron
            onClick={() => {}}
          />
          <ListRow
            icon={<Trash size={18} weight="bold" />}
            iconBg="bg-crimson-tint text-crimson-deep"
            title="Sign out of Nexus"
            destructive
            onClick={() => {}}
          />
        </GroupedList>
      </section>

      {/* 5. Navigation Controls */}
      <section aria-labelledby="controls-heading" className="space-y-4">
        <h2 id="controls-heading" className="font-display font-black text-2xl text-ink">
          5. Segmented Controls & ScrollTabs
        </h2>
        <div className="space-y-3">
          <SegmentedControl
            value={segmentedVal}
            onChange={setSegmentedVal}
            options={[
              { value: "all", label: "All Items" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
            ]}
          />
          <ScrollTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "notes", label: "Notes", count: 14 },
              { id: "pyqs", label: "PYQs", count: 8 },
              { id: "assignments", label: "Assignments", count: 2 },
              { id: "lab_manuals", label: "Lab Manuals", count: 5 },
            ]}
          />
        </div>
      </section>

      {/* 6. Form Inputs & Controls */}
      <section aria-labelledby="inputs-heading" className="space-y-4">
        <h2 id="inputs-heading" className="font-display font-black text-2xl text-ink">
          6. Form Inputs (16px minimum font)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Full Name"
            placeholder="Gaurav Sharma"
            defaultValue="Gaurav Sharma"
          />
          <TextField
            label="College Email"
            placeholder="you@college.edu"
            error="Please enter a valid college email"
          />
          <Select label="Course" defaultValue="btech">
            <option value="btech">B.Tech Computer Science</option>
            <option value="bca">BCA Data Science</option>
          </Select>
          <div className="p-3 bg-surface rounded-[18px] border-2 border-line flex items-center">
            <Switch
              checked={switchVal}
              onChange={setSwitchVal}
              label="Pin to top"
              description="Keep announcement at the top of the feed"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              placeholder="Add key highlights or syllabus details..."
              helperText="Optional, max 200 characters"
            />
          </div>
          <div className="sm:col-span-2">
            <SearchField
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search subjects or file titles..."
            />
          </div>
        </div>
      </section>

      {/* 7. FilePicker (Dropzone) & Progress */}
      <section aria-labelledby="file-picker-heading" className="space-y-4">
        <h2 id="file-picker-heading" className="font-display font-black text-2xl text-ink">
          7. FilePicker & Thick Progress Bar
        </h2>
        <div className="space-y-4">
          <FilePicker
            file={null}
            onFileSelect={() => {}}
            label="Dropzone (Empty)"
          />
          <ProgressBar progress={68} ariaLabel="Upload progress" />
        </div>
      </section>

      {/* 8. Status Pills, Chips, and Avatars */}
      <section aria-labelledby="pills-heading" className="space-y-4">
        <h2 id="pills-heading" className="font-display font-black text-2xl text-ink">
          8. Status Pills, Category Chips & Avatars
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status="pending" />
          <StatusPill status="approved" />
          <StatusPill status="rejected" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="berry">Notes (Berry)</Chip>
          <Chip variant="sun">PYQs (Sun)</Chip>
          <Chip variant="tangerine">Assignments (Tangerine)</Chip>
          <Chip variant="fern">Lab Manuals (Fern)</Chip>
          <Chip onRemove={() => {}}>Removable Tag</Chip>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Avatar size="sm" name="Gaurav Sharma" />
          <Avatar size="md" name="Admin User" />
          <Avatar size="lg" name="Faculty Member" />
          <Avatar size="xl" name="Gaurav" editable onEdit={() => alert("Change avatar")} />
        </div>
      </section>

      {/* 9. FileCard */}
      <section aria-labelledby="filecard-heading" className="space-y-4">
        <h2 id="filecard-heading" className="font-display font-black text-2xl text-ink">
          9. File Cards with Type Badges & Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FileCard
            title="Operating Systems Complete Unit 3 Notes.pdf"
            fileRef="test-file-id"
            sizeBytes={4200000}
            unit={3}
            tags={["OS", "Memory Management"]}
          />
          <FileCard
            title="Database Systems End Sem 2024.pdf"
            fileRef="test-file-id-2"
            sizeBytes={1850000}
            year={2024}
            tags={["SQL", "PYQ"]}
          />
          <FileCard
            title="Networks Lab Experiment 4.docx"
            fileRef="test-file-id-3"
            sizeBytes={512000}
            tags={["Sockets"]}
          />
        </div>
      </section>

      {/* 10. StatTiles & Stepper */}
      <section aria-labelledby="stats-heading" className="space-y-4">
        <h2 id="stats-heading" className="font-display font-black text-2xl text-ink">
          10. StatTiles & Onboarding Stepper
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Students" value={1420} color="berry" />
          <StatTile label="Resources" value={388} color="sun" />
          <StatTile label="Pending" value={7} color="tangerine" />
          <StatTile label="Approved" value={381} color="fern" />
        </div>
        <div className="p-5 bg-surface rounded-[20px] border-2 border-line">
          <Stepper currentStep={2} totalSteps={3} stepName="Select Semester" />
        </div>
      </section>

      {/* 11. Banners & Skeletons */}
      <section aria-labelledby="feedback-heading" className="space-y-4">
        <h2 id="feedback-heading" className="font-display font-black text-2xl text-ink">
          11. Banners & Skeletons
        </h2>
        <Banner variant="pinned" icon={<Bell size={20} weight="fill" />}>
          Final semester exam timetable has been released by the academic council.
        </Banner>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </section>

      {/* 12. Modal Sheets & Toasts */}
      <section aria-labelledby="sheets-heading" className="space-y-4">
        <h2 id="sheets-heading" className="font-display font-black text-2xl text-ink">
          12. Sheets & Toast Feedback
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setSheetOpen(true)}>Open Bottom Sheet</Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Open Confirm Dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setToastType("success");
              setToastOpen(true);
            }}
          >
            Trigger Success Toast
          </Button>
        </div>
      </section>

      {/* Bottom TabBar Preview */}
      <section aria-labelledby="tabbar-heading" className="space-y-4 pt-4">
        <h2 id="tabbar-heading" className="font-display font-black text-2xl text-ink">
          13. Mobile TabBar Preview
        </h2>
        <div className="border-2 border-line rounded-[24px] p-2 bg-surface">
          <TabBar items={navItems} className="!relative !bottom-0 rounded-[18px]" />
        </div>
      </section>

      {/* Interactive Sheet & ConfirmSheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Materials"
        description="Select units and formats to refine your study feed."
      >
        <div className="space-y-4 py-2">
          <Select label="Filter by Unit">
            <option>All Units</option>
            <option>Unit 1</option>
            <option>Unit 2</option>
          </Select>
          <Button fullWidth onClick={() => setSheetOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setToastType("error");
          setToastOpen(true);
        }}
        destructive
        title="Delete Announcement?"
        description="This action cannot be undone. All students will lose access to this notice."
        confirmLabel="Delete Notice"
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        type={toastType}
        message={
          toastType === "success"
            ? "File submitted for review successfully!"
            : "Announcement has been permanently deleted."
        }
      />
    </div>
  );
}
