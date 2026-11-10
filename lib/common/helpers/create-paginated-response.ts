export const createPaginatedResponse = <T>(
  data: T,
  total: number,
  page: number,
  limit: number,
) => {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
