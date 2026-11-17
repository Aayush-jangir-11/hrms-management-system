// Standard Pagination Helper for Express API Controllersn:
// If req.query.page or req.query.limit is supplied, it paginates and provides metadata.
// If not supplied, it safely returns all records while still including standard pagination metadata.
const getPagination = (query, defaultLimit = 10) => {
  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return {
    isPaginated,
    page,
    limit,
    skip,
  };
};

const formatPagination = ({ totalRecords, page, limit, isPaginated }) => {
  if (!isPaginated) {
    return {
      currentPage: 1,
      totalPages: 1,
      totalRecords,
      limit: totalRecords,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return {
    currentPage: page,
    totalPages,
    totalRecords,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  getPagination,
  formatPagination,
};
