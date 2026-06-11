export type Category = {
  id: string;
  name: string;
  identifier: string;
  parentId: string | null;
  visible: boolean;
  description?: string;
};

export type Course = {
  id: string;
  fullName: string;
  shortName: string;
  categoryId: string | null;
  identifier: string;
  visible: boolean;
  description?: string;
};
