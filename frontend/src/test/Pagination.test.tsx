import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "../components/Pagination";
import { PaginationMeta } from "../types";

describe("Pagination Component", () => {
  const defaultMeta: PaginationMeta = {
    page: 1,
    limit: 6,
    total: 24,
    totalPages: 4,
    hasNextPage: true,
    hasPrevPage: false,
  };

  it("renders multi-page sticky pagination with page numbers and controls", () => {
    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();

    render(
      <Pagination
        meta={defaultMeta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    );

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();

    const pageCount = screen.getAllByText((_, el) =>
      el?.textContent?.replace(/\s+/g, " ").includes("Page 1 of 4") ?? false
    )[0];
    expect(pageCount).toBeInTheDocument();

    // Next page button click
    const nextBtn = screen.getByRole("button", { name: /Next page/i });
    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Numbered button click
    const page3Btn = screen.getByRole("button", { name: "3" });
    fireEvent.click(page3Btn);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("renders clean inline static summary when totalPages is 1", () => {
    const singlePageMeta: PaginationMeta = {
      page: 1,
      limit: 6,
      total: 4,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();

    render(
      <Pagination
        meta={singlePageMeta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    );

    expect(
      screen.getByText("Showing all 4 events · Page 1 of 1")
    ).toBeInTheDocument();

    // No numbered page buttons in single page mode
    expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
  });

  it("renders nothing when total items is 0", () => {
    const emptyMeta: PaginationMeta = {
      page: 1,
      limit: 6,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };

    const { container } = render(
      <Pagination
        meta={emptyMeta}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles limit change selection", () => {
    const onLimitChange = vi.fn();

    render(
      <Pagination
        meta={defaultMeta}
        onPageChange={vi.fn()}
        onLimitChange={onLimitChange}
      />
    );

    const limitTrigger = screen.getByLabelText(/Select events per page/i);
    fireEvent.click(limitTrigger);

    const option12 = screen.getByText("12 / page");
    fireEvent.click(option12);

    expect(onLimitChange).toHaveBeenCalledWith(12);
  });
});
