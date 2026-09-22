import { render, screen, cleanup } from '@testing-library/react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { CartItem } from '@/modules/portal/resources/cart/CartItem';
import { Role } from '@/shared/constants/roles';
import type { ApiCartResponse } from '@/shared/types/cart.types';
import { SIMULATION_COVER_IMAGE, SIMULATION_DATE } from '../fixtures';
import {
  resetSimulationData,
  rememberShopData,
  handleSimulationRequest,
  clearSimulationData,
} from '../local-api';

jest.mock('@/modules/portal/resources/cart/hooks/useCartActions', () => ({
  useCartActions: () => ({
    increase: jest.fn(),
    decrease: jest.fn(),
    remove: jest.fn(),
    setQuantity: jest.fn(),
    isMutatingFor: () => false,
  }),
}));

afterEach(() => {
  cleanup();
  clearSimulationData();
});

it.each([
  ['/api/v1/role-simulation/shop/learning-paths/product/image', 'Formation boutique'],
  [SIMULATION_COVER_IMAGE, 'Formation démonstration'],
])('renders the formation cover directly, preserving session cookies: %s', (image, title) => {
  render(
    <FormationCard
      title={title}
      author=""
      category=""
      price={25}
      updatedAt={SIMULATION_DATE}
      enrolledCompanies={0}
      moduleCount={1}
      evaluationCount={0}
      coverImage={image}
    />,
  );
  expect(screen.getByRole('img', { name: title })).toHaveAttribute('src', image);
  expect(screen.getByRole('img', { name: title })).not.toHaveAttribute('crossorigin');
});

it('renders the authorized real shop cover after a local add-to-cart', async () => {
  resetSimulationData(Role.CLIENT_MANAGER);
  const image = '/api/v1/role-simulation/shop/learning-paths/product/image';
  rememberShopData({ data: { id: 'product', price: 25, currency: 'EUR', image: { url: image } } });
  const response = await handleSimulationRequest('carts/items', {
    method: 'POST',
    body: JSON.stringify({ learning_path_id: 'product' }),
  });
  const item = (response.json as ApiCartResponse).data.items[0];
  render(<CartItem item={item} />);
  expect(screen.getByRole('img', { name: item.name })).toHaveAttribute('src', image);
});
