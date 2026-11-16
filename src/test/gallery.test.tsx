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
it("never autoplays the video or advances while a visitor watches it", () => {
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
  fireEvent.play(video);
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

it("rotates every four seconds and continues forward across the last panel", () => {
  media.items = Array.from({ length: 6 }, (_, index) => ({
    src: `/${index}.jpg`,
    alt: `Camp ${index}`,
    title: `Camp ${index}`,
    credit: "Test fixture",
  }));
  media.items[5] = {
    kind: "video",
    src: "/camp.mp4",
    alt: "Camp film",
    title: "Camp",
    credit: "Team",
  };
  render(<Gallery />);
  act(() => vi.advanceTimersByTime(3999));
  expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole("button", { name: "Go to slide 2" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (let tick = 0; tick < 5; tick++) act(() => vi.advanceTimersByTime(4000));
  expect(screen.getByTestId("gallery-rotor")).toHaveStyle({ transform: "rotateY(-360deg)" });
  expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("pauses on keyboard focus and keeps inactive faces out of interaction", () => {
  media.items = [
    { src: "/one.jpg", alt: "First", title: "First", credit: "Test fixture" },
    { src: "/two.jpg", alt: "Second", title: "Second", credit: "Test fixture" },
  ];
  const { container } = render(<Gallery />);
  fireEvent.focus(screen.getByRole("button", { name: "Next photo" }));
  act(() => vi.advanceTimersByTime(12000));
  expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(container.querySelector('figure[aria-hidden="true"]')).toHaveAttribute("inert");
});

it("does not start automatic rotation for reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  media.items = [
    { src: "/one.jpg", alt: "First", title: "First", credit: "Test fixture" },
    { src: "/two.jpg", alt: "Second", title: "Second", credit: "Test fixture" },
  ];
  render(<Gallery />);
  act(() => vi.advanceTimersByTime(12000));
  expect(screen.getByRole("button", { name: "Go to slide 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
