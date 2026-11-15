import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GalleryPhoto } from "../lib/gallery";
const media = vi.hoisted(() => ({ items: [] as GalleryPhoto[] }));
vi.mock("../lib/gallery", () => ({
  get galleryPhotos() {
    return media.items;
  },
}));
import { Gallery } from "../components/gallery";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  media.items = [];
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("shows an honest empty state when no field media is supplied", () => {
  render(<Gallery />);
  expect(
    screen.getByRole("heading", { name: "From our community, with care" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("never advances away from a video or autoplays it", () => {
  media.items = [
    {
      kind: "video",
      src: "/test.mp4",
      alt: "Outreach video",
      title: "Outreach",
      credit: "Test fixture",
      transcript: "A camp tour.",
    },
    { src: "/test.jpg", alt: "Camp photo", title: "Camp", credit: "Test fixture" },
  ];
  render(<Gallery />);
  const video = screen.getByLabelText("Outreach video");
  expect(video).toHaveAttribute("controls");
  expect(video).toHaveAttribute("preload", "none");
  expect(video).not.toHaveAttribute("autoplay");
  act(() => vi.advanceTimersByTime(20000));
  expect(video).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
  expect(video).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Camp photo" })).toBeInTheDocument();
});
it("respects the photo pause control", () => {
  media.items = [
    { src: "/one.jpg", alt: "First camp", title: "First", credit: "Test fixture" },
    { src: "/two.jpg", alt: "Second camp", title: "Second", credit: "Test fixture" },
  ];
  render(<Gallery />);
  fireEvent.click(screen.getByRole("button", { name: "Pause gallery" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole("img", { name: "First camp" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Play gallery" }));
  act(() => vi.advanceTimersByTime(4500));
  expect(screen.getByRole("img", { name: "Second camp" })).toBeInTheDocument();
});
