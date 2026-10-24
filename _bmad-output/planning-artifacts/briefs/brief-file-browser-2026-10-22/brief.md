---
title: "Product Brief: file-browser"
status: ready
created: 2026-10-22
updated: 2026-10-23
---

# Product Brief: file-browser

## Executive Summary

file-browser is a lightweight, fully client-side desktop-browser app for looking at a local folder: a folder tree on the left, a clean preview on the right. It exists because working with Claude Code in a terminal is powerful but blind. You lose sight of the file tree, of what was just created, and of how documents look. Opening a heavy IDE to find out is slow, and an IDE's editing machinery is noise when you only want to look.

It is a general-purpose viewer for any local folder, with the terminal-plus-Claude-Code workflow as its first and most demanding use. Everything runs in the browser. No server, no uploads, no cost, and no file ever leaves the machine. It is read-only by design, which makes it safe to point at any project.

v1 is an exceptionally responsive previewer with manual freshness: a refresh button and a "last modified" stamp. Live awareness of what an agent is doing to your files is the product's long-term promise and the v2 milestone. v1 earns the right to build it by being something you reach for every day. It is also a production-quality learning project: built end-to-end with agentic engineering, with its workflow documented as a deliverable.

## The Problem

A developer working with Claude Code in a terminal gets execution but no visual awareness. Files appear and change, and the only way to see them is `ls`, `cat`, or switching to an IDE. Today's options are all a poor fit:

- **A full IDE** is heavy to launch and built for editing, which is not the job.
- **The OS file manager** shows files but previews few formats well and knows nothing about project structure.
- **The terminal** shows text but not rendered Markdown, PDFs or Word documents.

The cost is friction: small moments of "what did it just make, and what does it look like?" that interrupt flow.

## The Solution

A two-pane browser. Open a folder and a hierarchical tree appears instantly, loading sub-folders only when expanded. Select a file and a polished preview fills the right pane, with the file name and a clear **Last modified: date & time** in its header. A refresh button re-reads the tree on demand. A toggle shows or hides dotfiles, which are visible by default because `.claude/` and config files are exactly what is interesting, and shown dimmed so they never crowd the content. Three themes (Light, Dark, Warm Sand/sepia) make it comfortable for long sessions. It is built for a full-screen or maximized window, so previews get room.

## What Makes This Different

Honestly, the differentiator is feel and focus, not technology. It is deliberately narrower than an IDE (view only), lighter than an IDE (opens instantly, nothing to install or serve), and opinionated about the agent workflow (dotfiles on, freshness front and center). Local privacy comes for free from the architecture and is a real trust advantage over any hosted viewer. The moat, if any, is execution quality and speed. We do not claim more.

## Who This Serves

- **Primary: the builder-developer** (the author first) who works with a CLI coding agent and wants a quick, beautiful look at the project without leaving flow.
- **Evaluator: the course instructor**, who needs to see a working, polished product and a clearly documented agentic workflow.
- **Future: the community**, if the tool proves delightful enough to share. Not a v1 design driver.

## Success Criteria

**Evaluation**
- Core functionality works end-to-end on real folders.
- UX is polished and fluid; all three themes are complete.
- `npm run build` and `npm run lint` pass clean.
- The agentic workflow is documented in clear artifacts (this brief, the PRD, decision logs).

**Daily use**: opening it feels lighter and faster than launching an IDE just to inspect files.

**Performance targets** (confirmed)
- Initial load: under 150 KB gzipped JavaScript; heavy renderers (PDF, DOCX) load only on first use.
- Open a folder to a visible tree: under 300 ms for a folder of about 1,000 entries.
- Expand a folder: under 100 ms for the same size.
- Text or Markdown preview under 1 MB: under 100 ms from selection.
- DOCX preview of a typical (under 5 MB) document: under 1 s.

## Scope

**In for v1**
- Folder picker (File System Access API; Chrome and Edge) and read-only access.
- Hierarchical tree, lazily loaded on expand; manual refresh button.
- Previews: plain text, Markdown, PDF, Word (.docx), and basic images (.png, .jpg, .svg, .webp), rendered client-side. Images use a native `<img>` fed by `URL.createObjectURL()`; SVG is never inlined.
- Fallback **metadata card** for everything else, including binaries: name, size, MIME type, last modified.
- "Last modified" in the preview header.
- Dotfile toggle (default on; dotfiles at `opacity: 0.6`).
- Light, Dark, and Warm Sand themes, built with plain CSS custom properties and no CSS framework `[ASSUMPTION: defaults to system light/dark, remembered locally]`.
- Single selection; keyboard and screen-reader accessible tree and previews.

**Out for v1**
- Any file operation (rename, delete, move, write) and any editing.
- Multi-select and file-content search (roadmap candidates).
- Background polling or live change feeds (v2).
- Non-Chromium browsers.
- Any backend or external network request.

## Vision

v2 turns the window into a live view of the project: background change detection, highlighting of new and modified files, a feed of what an agent just touched. Beyond that: search, multi-select, and code previews. If it becomes the thing developers leave open next to their terminal, it becomes a calm, always-current picture of a project while an agent works on it. The same local-first, read-only trust model carries through.

## Open Items

- **Decided:** Markdown and DOCX output is sanitized, and remote images or links are never fetched, to honor the no-network policy.
- `[ASSUMPTION]` MIME type is derived from file extension and the browser's `File.type`; no content sniffing in v1.
- Dotfiles default-on reverses the current code, which hides them. Needs an explicit change, and makes lazy loading mandatory because `.git` and `node_modules` become visible.
- Product name is still the working title "file-browser".
