import { DataProvider } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import { httpClient } from "@/shared/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResourceHandlers = Record<string, (resource: string, params: any) => Promise<any>>;

const handlers: Record<string, ResourceHandlers> = {};

export function registerResourceHandlers(
  resource: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h: Record<string, (resource: string, params: any) => Promise<any>>
) {
  handlers[resource] = { ...handlers[resource], ...h };
}

const base = simpleRestProvider(
  process.env.NEXT_PUBLIC_API_URL ?? "/api",
  httpClient
);

export const dataProvider: DataProvider = {
  ...base,
  getList(resource, params) {
    return (
      handlers[resource]?.getList?.(resource, params) ??
      base.getList(resource, params)
    );
  },
  getOne(resource, params) {
    return (
      handlers[resource]?.getOne?.(resource, params) ??
      base.getOne(resource, params)
    );
  },
  getMany(resource, params) {
    return (
      handlers[resource]?.getMany?.(resource, params) ??
      base.getMany(resource, params)
    );
  },
  getManyReference(resource, params) {
    return (
      handlers[resource]?.getManyReference?.(resource, params) ??
      base.getManyReference(resource, params)
    );
  },
  create(resource, params) {
    return (
      handlers[resource]?.create?.(resource, params) ??
      base.create(resource, params)
    );
  },
  update(resource, params) {
    return (
      handlers[resource]?.update?.(resource, params) ??
      base.update(resource, params)
    );
  },
  updateMany(resource, params) {
    return (
      handlers[resource]?.updateMany?.(resource, params) ??
      base.updateMany(resource, params)
    );
  },
  delete(resource, params) {
    return (
      handlers[resource]?.delete?.(resource, params) ??
      base.delete(resource, params)
    );
  },
  deleteMany(resource, params) {
    return (
      handlers[resource]?.deleteMany?.(resource, params) ??
      base.deleteMany(resource, params)
    );
  },
};
