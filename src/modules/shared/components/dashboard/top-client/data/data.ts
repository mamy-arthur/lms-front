import { Client } from '../types';

export const topClients: Client[] = [
  {
    id: '1',
    name: 'Client First',
    email: 'excellence-academy-client1@yopmail.com',
    wallet: 325,
    courses: [
      { id: '1', name: 'React Avancé' },
      { id: '2', name: 'Docker Fundamentals' },
      { id: '3', name: 'Kubernetes Basics' },
    ],
  },
  {
    id: '2',
    name: 'Noémie Lauret',
    email: 'noemie.lauret@excellence-academy.fr',
    wallet: 120,
    courses: [
      { id: '4', name: 'TypeScript Mastery' },
      { id: '5', name: 'Next.js Expert' },
    ],
  },
  {
    id: '3',
    name: 'Excellence Client 2',
    email: 'excellence-academy.client2@yopmail.com',
    wallet: 80,
    courses: [{ id: '6', name: 'Laravel Advanced' }],
  },
  {
    id: '4',
    name: 'Client 4',
    email: 'client4@yopmail.com',
    wallet: 50,
    courses: [{ id: '7', name: 'Git & GitHub' }],
  },
  {
    id: '5',
    name: 'Client 5',
    email: 'client5@yopmail.com',
    wallet: 30,
    courses: [],
  },
];
