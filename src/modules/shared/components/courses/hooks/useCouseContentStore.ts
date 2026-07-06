import { create } from 'zustand';
import { ContentType, CourseContent, CourseSection } from '../types';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface CourseState {
  sections: CourseSection[];
  addSection: () => CourseSection;
  updateSection: (id: string, patch: Partial<CourseSection>) => void;
  removeSection: (id: string) => void;
  addContent: (
    sectionId: string,
    type: ContentType,
    title: string,
    data?: Record<string, unknown>,
  ) => CourseContent | undefined;
  updateContent: (sectionId: string, contentId: string, patch: Partial<CourseContent>) => void;
  removeContent: (sectionId: string, contentId: string) => void;
  getSection: (sectionId: string) => CourseSection | undefined;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  sections: [
    {
      id: uid(),
      title: 'Introduction',
      description: 'Bienvenue dans ce cours.',
      order: 0,
      contents: [],
    },
  ],
  addSection: () => {
    const sections = get().sections;
    const section: CourseSection = {
      id: uid(),
      title: `Section ${sections.length + 1}`,
      description: '',
      order: sections.length,
      contents: [],
    };
    set({ sections: [...sections, section] });
    return section;
  },
  updateSection: (id, patch) =>
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)),
    })),
  removeSection: (id) => set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),
  addContent: (sectionId, type, title, data) => {
    const section = get().sections.find((s) => s.id === sectionId);
    if (!section) return undefined;
    const content: CourseContent = {
      id: uid(),
      sectionId,
      type,
      title,
      data,
    };
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, contents: [...sec.contents, content] } : sec,
      ),
    }));
    return content;
  },
  updateContent: (sectionId, contentId, patch) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              contents: sec.contents.map((c) => (c.id === contentId ? { ...c, ...patch } : c)),
            }
          : sec,
      ),
    })),
  removeContent: (sectionId, contentId) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              contents: sec.contents.filter((c) => c.id !== contentId),
            }
          : sec,
      ),
    })),
  getSection: (sectionId) => get().sections.find((s) => s.id === sectionId),
}));
