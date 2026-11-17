import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { YouTubePlayer } from "@/components/youtube-player";

afterEach(() => {
  vi.useRealTimers();
  delete (window as Window & { YT?: unknown }).YT;
});
it("uses custom controls and records pause/completion through the official API", async () => {
  const playVideo = vi.fn();
  const pauseVideo = vi.fn();
  const destroy = vi.fn();
  const progress = vi.fn();
  let options: {
    playerVars: Record<string, unknown>;
    events: { onReady(): void; onStateChange(event: { data: number }): void };
  };
  class MockPlayer {
    constructor(_element: HTMLElement, config: typeof options) {
      options = config;
    }
    playVideo = playVideo;
    pauseVideo = pauseVideo;
    destroy = destroy;
    getCurrentTime = () => 42;
    getPlayerState = () => 1;
  }
  (window as Window & { YT?: unknown }).YT = { Player: MockPlayer };
  const view = render(
    <YouTubePlayer videoId="M7lc1UVf-VE" initialSeconds={25} onProgress={progress} />,
  );
  await waitFor(() => expect(options).toBeDefined());
  expect(options!.playerVars).toMatchObject({
    controls: 0,
    start: 25,
    origin: window.location.origin,
  });
  act(() => options.events.onReady());
  fireEvent.click(screen.getByRole("button", { name: "Reproduzir vídeo" }));
  expect(playVideo).toHaveBeenCalledTimes(1);
  act(() => options.events.onStateChange({ data: 1 }));
  fireEvent.click(screen.getByRole("button", { name: "Pausar vídeo" }));
  expect(pauseVideo).toHaveBeenCalledTimes(1);
  act(() => options.events.onStateChange({ data: 2 }));
  expect(progress).toHaveBeenCalledWith(42, false);
  act(() => options.events.onStateChange({ data: 0 }));
  expect(progress).toHaveBeenCalledWith(42, true);
  expect(screen.getByRole("button", { name: "Alternar tela cheia" })).toBeEnabled();
  view.unmount();
  expect(progress).toHaveBeenLastCalledWith(42, true);
  expect(destroy).toHaveBeenCalledTimes(1);
});
