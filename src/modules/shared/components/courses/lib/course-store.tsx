import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { Category, Course } from "../types/index";

const uid = () => Math.random().toString(36).slice(2, 10);

const initialCategories: Category[] = [
    {
        id: "c1",
        name: "Développement",
        identifier: "DEV",
        parentId: null,
        visible: true,
        description: "Tous les cours liés au développement.",
    },
    {
        id: "c2",
        name: "Frontend",
        identifier: "DEV-FE",
        parentId: "c1",
        visible: true,
    },
    {
        id: "c3",
        name: "Backend",
        identifier: "DEV-BE",
        parentId: "c1",
        visible: true,
    },
    {
        id: "c4",
        name: "Design",
        identifier: "DSN",
        parentId: null,
        visible: true,
    },
    {
        id: "c5",
        name: "UX Research",
        identifier: "DSN-UX",
        parentId: "c4",
        visible: false,
    },
];

const initialCourses: Course[] = [
    {
        id: "co1",
        fullName: "Introduction à React 19",
        shortName: "REACT19",
        categoryId: "c2",
        identifier: "FE-101",
        visible: true,
        description: "Les fondamentaux de React 19.",
    },
    {
        id: "co2",
        fullName: "API REST avec Node.js",
        shortName: "NODE-API",
        categoryId: "c3",
        identifier: "BE-201",
        visible: true,
    },
    {
        id: "co3",
        fullName: "Design Systems avancés",
        shortName: "DS-ADV",
        categoryId: "c4",
        identifier: "DSN-301",
        visible: false,
    },
    {
        id: "co4",
        fullName: "TypeScript avancé pour développeurs React",
        shortName: "TS-ADV",
        categoryId: "c2",
        identifier: "FE-102",
        visible: true,
        description: "Maîtriser TypeScript dans un contexte React moderne.",
    },
    {
        id: "co5",
        fullName: "Architecture backend avec NestJS",
        shortName: "NEST-ARCH",
        categoryId: "c3",
        identifier: "BE-202",
        visible: true,
        description: "Structurer une application backend scalable avec NestJS.",
    },
    {
        id: "co6",
        fullName: "UI/UX Design fundamentals",
        shortName: "UIUX-101",
        categoryId: "c4",
        identifier: "DSN-302",
        visible: true,
        description:
            "Principes essentiels du design d’interface et expérience utilisateur.",
    },
    {
        id: "co7",
        fullName: "Gestion d’état avec Redux Toolkit",
        shortName: "REDUX-RTK",
        categoryId: "c2",
        identifier: "FE-103",
        visible: false,
        description:
            "Simplifier la gestion d’état global dans les applications React.",
    },
    {
        id: "co8",
        fullName: "Docker pour développeurs web",
        shortName: "DOCKER-WEB",
        categoryId: "c3",
        identifier: "DEVOPS-101",
        visible: true,
        description: "Conteneurisation des applications web avec Docker.",
    },
    {
        id: "co9",
        fullName: "Bases de données relationnelles avec PostgreSQL",
        shortName: "POSTGRES-101",
        categoryId: "c3",
        identifier: "DB-101",
        visible: true,
        description: "Comprendre et utiliser PostgreSQL efficacement.",
    },
    {
        id: "co10",
        fullName: "Next.js 15 pour applications modernes",
        shortName: "NEXT15",
        categoryId: "c2",
        identifier: "FE-104",
        visible: true,
        description:
            "Construire des applications performantes avec Next.js 15.",
    },
    {
        id: "co11",
        fullName: "Méthodologies Agile et Scrum",
        shortName: "AGILE-SCRUM",
        categoryId: "c1",
        identifier: "PM-101",
        visible: true,
        description: "Introduction aux pratiques Agile et Scrum en équipe.",
    },
    {
        id: "co12",
        fullName: "Sécurité des applications web",
        shortName: "WEB-SEC",
        categoryId: "c3",
        identifier: "SEC-101",
        visible: false,
        description:
            "Bonnes pratiques pour sécuriser une application web moderne.",
    },
];

type Ctx = {
    courses: Course[];
    categories: Category[];
    loading: boolean;
    upsertCourse: (c: Omit<Course, "id"> & { id?: string }) => Course;
    deleteCourse: (id: string) => void;
    toggleCourseVisibility: (id: string) => void;
    upsertCategory: (c: Omit<Category, "id"> & { id?: string }) => Category;
    deleteCategory: (id: string) => void;
    toggleCategoryVisibility: (id: string) => void;
};

const CoursesCtx = createContext<Ctx | null>(null);

export function CoursesProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [categories, setCategories] = useState<Category[]>(initialCategories);

    const value = useMemo<Ctx>(
        () => ({
            courses,
            categories,
            loading: false,
            upsertCourse: (c) => {
                if (c.id) {
                    const updated = { ...c, id: c.id } as Course;
                    setCourses((prev) =>
                        prev.map((x) => (x.id === c.id ? updated : x)),
                    );
                    return updated;
                }
                const created: Course = { ...c, id: uid() };
                setCourses((prev) => [created, ...prev]);
                return created;
            },
            deleteCourse: (id) =>
                setCourses((prev) => prev.filter((c) => c.id !== id)),
            toggleCourseVisibility: (id) =>
                setCourses((prev) =>
                    prev.map((c) =>
                        c.id === id ? { ...c, visible: !c.visible } : c,
                    ),
                ),
            upsertCategory: (c) => {
                if (c.id) {
                    const updated = { ...c, id: c.id } as Category;
                    setCategories((prev) =>
                        prev.map((x) => (x.id === c.id ? updated : x)),
                    );
                    return updated;
                }
                const created: Category = { ...c, id: uid() };
                setCategories((prev) => [...prev, created]);
                return created;
            },
            deleteCategory: (id) => {
                setCategories((prev) =>
                    prev
                        .filter((c) => c.id !== id)
                        .map((c) =>
                            c.parentId === id ? { ...c, parentId: null } : c,
                        ),
                );
                setCourses((prev) =>
                    prev.map((c) =>
                        c.categoryId === id ? { ...c, categoryId: null } : c,
                    ),
                );
            },
            toggleCategoryVisibility: (id) =>
                setCategories((prev) =>
                    prev.map((c) =>
                        c.id === id ? { ...c, visible: !c.visible } : c,
                    ),
                ),
        }),
        [courses, categories],
    );

    return <CoursesCtx.Provider value={value}>{children}</CoursesCtx.Provider>;
}

export function useCoursesStore() {
    const ctx = useContext(CoursesCtx);
    if (!ctx)
        throw new Error("useCoursesStore must be used within CoursesProvider");
    return ctx;
}

export function buildCategoryTree(categories: Category[]) {
    const byParent = new Map<string | null, Category[]>();
    for (const c of categories) {
        const arr = byParent.get(c.parentId) ?? [];
        arr.push(c);
        byParent.set(c.parentId, arr);
    }
    const result: { category: Category; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) => {
        const children = (byParent.get(parentId) ?? [])
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));
        for (const child of children) {
            result.push({ category: child, depth });
            walk(child.id, depth + 1);
        }
    };
    walk(null, 0);
    return result;
}

export function getCategoryPath(
    categories: Category[],
    id: string | null,
): string {
    if (!id) return "—";
    const map = new Map(categories.map((c) => [c.id, c] as const));
    const parts: string[] = [];
    let cur = map.get(id);
    let guard = 0;
    while (cur && guard++ < 20) {
        parts.unshift(cur.name);
        cur = cur.parentId ? map.get(cur.parentId) : undefined;
    }
    return parts.join(" / ");
}
