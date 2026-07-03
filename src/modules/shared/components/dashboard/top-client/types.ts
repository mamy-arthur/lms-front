export type Course = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  wallet: number;
  courses: Course[];
};
