<script lang="ts">
  export let href: string;
  export let className: string = "";
  export let props: { [key: string]: any } = {};
</script>

<a class={className} {href} target="_blank" rel="noopener noreferrer" {...props}
  ><slot /></a
>
