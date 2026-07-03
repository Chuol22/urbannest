// src/components/ui/Pagination.tsx

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true
}: PaginationProps) {
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 2;

    if (!showLeftDots && showRightDots) {
      const leftItemsCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemsCount);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemsCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemsCount + 1, totalPages);
      return [1, '...', ...rightRange];
    }

    if (showLeftDots && showRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="pagination" aria-label="Pagination">
      <ul className="pagination-list">
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="pagination-item"
              aria-label="Go to first page"
            >
              «
            </button>
          </li>
        )}

        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-item"
            aria-label="Go to previous page"
          >
            ‹
          </button>
        </li>

        {pageNumbers.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="pagination-dots">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`pagination-item ${currentPage === page ? 'pagination-active' : ''}`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-item"
            aria-label="Go to next page"
          >
            ›
          </button>
        </li>

        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-item"
              aria-label="Go to last page"
            >
              »
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}