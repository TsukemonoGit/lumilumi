<script lang="ts">
  import { onMount } from "svelte";

  interface Step {
    x: number;
    width: number;
    label: string;
  }

  export let step: Step;
  export let snap: boolean = false;
  export let grid: number = 10;
  export let selected: boolean = false;
  export let intersects: (step: Step, x: number, width: number) => boolean;

  let grabberWidth: number = 10;
  let expanding: "left" | "right" | null = null;
  let mouseDown: number | null = null;
  let start: number | null = null;
  let initial: { x: number; width: number } | null = null;
  let box: SVGRectElement;

  function startExpand(type: "left" | "right", event: MouseEvent) {
    mouseDown = event.pageX;
    expanding = type;
    start = event.pageX;
    initial = { x: step.x, width: step.width };
  }

  function mouseup() {
    mouseDown = null;
    expanding = null;
    start = null;
    initial = null;
  }

  function expand(event: MouseEvent) {
    if (!expanding || !start || !initial) return;

    if (expanding === "left") {
      const delta = calcSnap(start - event.pageX);
      const x = initial.x - delta;
      const width = initial.width + delta;

      if (intersects(step, x, width)) return;

      step.x = x;
      step.width = width;
    }

    if (expanding === "right") {
      const delta = calcSnap(event.pageX - start);
      const width = initial.width + delta;

      if (intersects(step, step.x, width)) return;

      step.width = width;
    }
  }

  function calcSnap(value: number): number {
    if (!snap) return value;
    const units = value / grid;
    return Math.floor(units) * grid;
  }

  function move(event: MouseEvent) {
    if (!selected || mouseDown === null) return;

    const delta = event.pageX - calcSnap(mouseDown);
    const x = calcSnap(step.x + delta);

    if (intersects(step, x, step.width)) return;

    step.x = x;
    mouseDown = event.pageX;
  }

  function mousemove(event: MouseEvent) {
    if (expanding) {
      expand(event);
    } else {
      move(event);
    }
  }

  onMount(() => {
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("mousemove", mousemove);

    return () => {
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("mousemove", mousemove);
    };
  });
</script>

<g
  class:expanding
  class:selected
  on:mousedown={(event) => (mouseDown = event.pageX)}
>
  <rect
    x={step.x}
    y={2}
    width={step.width}
    height={36}
    class="step"
    on:click
    bind:this={box}
  />
  <rect
    x={step.x}
    y={2}
    width={grabberWidth}
    height={36}
    fill="red"
    class="grip"
    on:mousedown={(event) => startExpand("left", event)}
    class:active={expanding === "left"}
  />
  <text x={step.x + step.width / 2} y={25} text-anchor="middle" on:click>
    {step.label}
  </text>
  <rect
    x={step.x + step.width - grabberWidth}
    y={2}
    width={grabberWidth}
    height={36}
    fill="blue"
    class="grip"
    on:mousedown={(event) => startExpand("right", event)}
    class:active={expanding === "right"}
  />
</g>

<style>
  .step {
    fill: #8884;
    stroke: #222a;
    rx: 2;
    cursor: pointer;
  }
  .expanding .step,
  .selected .step {
    stroke: #228e;
  }
  .selected .step {
    fill: #8888;
  }
  .selected text,
  .selected .step {
    cursor: grabbing;
    user-select: none;
  }
  .grip {
    cursor: col-resize;
    fill: #fff0;
  }
  .grip.active,
  .grip:hover {
    fill: #2288;
  }
</style>
