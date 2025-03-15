<script lang="ts">
  interface Props {
    id: string;
    onError: () => void;
  }
  let { id, onError }: Props = $props();
</script>

<div class="aspect-video w-full max-h-64">
  <iframe
    width="100%"
    height="100%"
    src={`https://www.youtube.com/embed/${id}`}
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    loading="lazy"
    class="max-h-64"
    onerror={onError}
  ></iframe>
</div>
