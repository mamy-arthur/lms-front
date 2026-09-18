/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Role } from '@/shared/constants/roles';
import {
  createSimulationFixtures,
  SIMULATION_IDS,
  SIMULATION_IMAGE,
  SIMULATION_COVER_IMAGE,
  SIMULATION_SCORM_LAUNCH,
} from '../fixtures';

describe('simulation fixtures', () => {
  it('ships a visible, scriptless cover instead of a transparent tracking pixel', () => {
    const svg = readFileSync(join(process.cwd(), 'public', SIMULATION_COVER_IMAGE), 'utf8');
    expect(svg).toContain('width="960" height="540"');
    expect(svg).toContain('MODE SIMULATION');
    expect(svg).toContain('<rect width="960" height="540" fill="url(#background)"');
    expect(svg).not.toMatch(/<script|<foreignObject|<image|\bon\w+=|\bhref=/i);
  });

  it.each(Object.values(Role))('builds a deterministic fictional graph for %s', (role) => {
    const data = createSimulationFixtures(role);
    const again = createSimulationFixtures(role);
    expect(data.role).toBe(role);
    expect(data.resources).toEqual(again.resources);
    for (const rows of Object.values(data.resources)) {
      for (const row of rows) {
        expect(row.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
      }
    }
    for (const user of data.resources.users) {
      expect(user.full_name).toContain('démonstration');
      expect(user.email).toMatch(/@example\.test$/);
    }
    for (const path of data.resources['learning-paths'])
      expect(path.name).toContain('démonstration');
    expect(JSON.stringify(data.resources)).not.toMatch(/https?:\/\//);
    expect(SIMULATION_IMAGE).toMatch(/^data:image\/png;base64,/);
    for (const path of data.resources['learning-paths']) {
      expect(path.image).toMatchObject({ url: SIMULATION_COVER_IMAGE, mime_type: 'image/svg+xml' });
    }
    expect(data.resources.entries[0].course_section_id).toBe(data.resources.sections[0].id);
    expect(data.resources.sections[0].course_id).toBe(data.resources.courses[0].id);
    expect(data.resources.quizzes[0].question_bank_id).toBe(data.resources['question-banks'][0].id);
    expect(data.enrollments[0].learning_path_id).toBe(SIMULATION_IDS.learningPath);
    const scorm = data.resources.entries.find((row) => row.id === SIMULATION_IDS.scormEntry);
    expect(scorm).toMatchObject({
      content_type_id: SIMULATION_IDS.scormType,
      course_section_id: SIMULATION_IDS.scormSection,
      data: { scorm_package_id: SIMULATION_IDS.scormPackage },
    });
    expect(data.scormPackages[0]).toMatchObject({
      content_entry_id: SIMULATION_IDS.scormEntry,
      status: 'ready',
    });
    expect(data.enrollments[1].learning_path_id).toBe(SIMULATION_IDS.secondLearningPath);
    expect(SIMULATION_SCORM_LAUNCH).toMatch(/^data:text\/html;charset=utf-8,/);
  });

  it('scopes the user and management fixtures to the reset role', () => {
    const trainee = createSimulationFixtures(Role.TRAINEE);
    expect(trainee.resources.users.map((user) => user.id)).toEqual([SIMULATION_IDS.learner]);
    expect(trainee.resources.groups).toEqual([]);
    expect(trainee.purchases).toEqual([]);
    const manager = createSimulationFixtures(Role.CLIENT_MANAGER);
    expect(manager.resources.users.map((user) => user.role)).toEqual([
      Role.CLIENT_MANAGER,
      Role.TRAINEE,
      Role.TRAINEE,
    ]);
    expect(manager.purchases[0].purchased).toBe(12);
    expect(createSimulationFixtures(Role.EDITOR).resources.users).toHaveLength(4);
    expect(createSimulationFixtures(Role.SUPER_ADMIN).resources.users).toHaveLength(5);
  });

  it('never shares mutable fixture objects, arrays, sets or maps between resets', () => {
    const first = createSimulationFixtures(Role.EDITOR);
    first.resources.courses[0].full_name = 'Changed';
    (first.resources['learning-paths'][0].competencies as unknown[]).pop();
    first.completedEntries.add('changed');
    first.shopPrices.set('changed', { price: 1, currency: 'EUR' });
    first.scormPackages[0].title = 'Changed';
    first.twoFactorOverrides.clear();
    const second = createSimulationFixtures(Role.EDITOR);
    expect(second.resources.courses[0].full_name).toContain('démonstration');
    expect(second.resources['learning-paths'][0].competencies).toHaveLength(1);
    expect(second.completedEntries.size).toBe(0);
    expect(second.shopPrices.size).toBe(0);
    expect(second.scormPackages[0].title).toBe('SCORM démonstration');
    expect(second.scormTracking).not.toBe(first.scormTracking);
    expect(second.twoFactorOverrides).not.toBe(first.twoFactorOverrides);
  });
});
