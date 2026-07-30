import type { ApiPurchasedLearningPath } from '@/shared/types/purchased-learning-path.types';
import type { PurchasedLearningPath } from '../types';

/** Mappe une ressource API vers le modèle UI purchasedLearningPath. */
export function mapToPurchasedLearningPath(api: ApiPurchasedLearningPath): PurchasedLearningPath {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    name: api.learning_path.name,
    purchasedCredits: api.purchased,
    enrollments: [],
  };
}
