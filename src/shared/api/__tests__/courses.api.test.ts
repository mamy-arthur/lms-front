jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import { courseCategoriesApi, coursesApi, courseSectionsApi } from '../courses.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

describe('coursesApi family', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls CRUD endpoints for courses', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValue({ data: { id: 'course-1' } });
    mockApiPatch.mockResolvedValue({ data: { id: 'course-1' } });
    mockApiDelete.mockResolvedValue(undefined);

    await coursesApi.list();
    await coursesApi.get('course-1');
    await coursesApi.create({ title: 'Course A' } as never);
    await coursesApi.update('course-1', { title: 'Course B' } as never);
    await coursesApi.remove('course-1');

    expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/courses');
    expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/courses/course-1');
    expect(mockApiPost).toHaveBeenCalledWith('platform/courses', { title: 'Course A' });
    expect(mockApiPatch).toHaveBeenCalledWith('platform/courses/course-1', { title: 'Course B' });
    expect(mockApiDelete).toHaveBeenCalledWith('platform/courses/course-1');
  });

  it('calls CRUD endpoints for course categories', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValue({ data: { id: 'cat-1' } });
    mockApiPatch.mockResolvedValue({ data: { id: 'cat-1' } });
    mockApiDelete.mockResolvedValue(undefined);

    await courseCategoriesApi.list();
    await courseCategoriesApi.get('cat-1');
    await courseCategoriesApi.create({ name: 'Cat A' } as never);
    await courseCategoriesApi.update('cat-1', { name: 'Cat B' } as never);
    await courseCategoriesApi.remove('cat-1');

    expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/course-categories');
    expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/course-categories/cat-1');
    expect(mockApiPost).toHaveBeenCalledWith('platform/course-categories', { name: 'Cat A' });
    expect(mockApiPatch).toHaveBeenCalledWith('platform/course-categories/cat-1', { name: 'Cat B' });
    expect(mockApiDelete).toHaveBeenCalledWith('platform/course-categories/cat-1');
  });

  it('calls sections endpoints including reorder and visibility', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValue({ data: { id: 'sec-1' } });
    mockApiPatch.mockResolvedValue({ data: { id: 'sec-1' } });
    mockApiDelete.mockResolvedValue(undefined);

    await courseSectionsApi.list('course-1');
    await courseSectionsApi.get('course-1', 'sec-1');
    await courseSectionsApi.create('course-1', { name: 'Section 1' });
    await courseSectionsApi.update('course-1', 'sec-1', { name: 'Section 2' });
    await courseSectionsApi.remove('course-1', 'sec-1');
    await courseSectionsApi.reorder('course-1', ['sec-2', 'sec-1']);
    await courseSectionsApi.toggleVisibility('course-1', 'sec-1', true);

    expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/courses/course-1/sections');
    expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/courses/course-1/sections/sec-1');
    expect(mockApiPost).toHaveBeenNthCalledWith(1, 'platform/courses/course-1/sections', {
      name: 'Section 1',
    });
    expect(mockApiPatch).toHaveBeenNthCalledWith(1, 'platform/courses/course-1/sections/sec-1', {
      name: 'Section 2',
    });
    expect(mockApiDelete).toHaveBeenCalledWith('platform/courses/course-1/sections/sec-1');
    expect(mockApiPost).toHaveBeenNthCalledWith(2, 'platform/courses/course-1/sections/reorder', {
      section_ids: ['sec-2', 'sec-1'],
    });
    expect(mockApiPatch).toHaveBeenNthCalledWith(
      2,
      'platform/courses/course-1/sections/sec-1/visibility',
      { is_hidden: true },
    );
  });
});
