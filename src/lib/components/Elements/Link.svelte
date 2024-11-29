<!-- @migration-task Error while migrating Svelte code: migrating this component would require adding a `$props` rune but there's already a variable named props.
     Rename the variable and try again or migrate by hand. -->
<script lang="ts">
  export let href: string;
  export let className: string = "";
  export let props: { [key: string]: any } = {};

  //有効なリンクかのチェックもする
  const checkSafe = () => {
    try {
      const check = href.match(/^http?s:\/\//);
      if (!check) {
        href = "https://" + href;
      }
      const url = new URL(href.toString());
      return (
        url.protocol === "https:" ||
        url.protocol === "http:" ||
        url.protocol === "mailto:"
      );
    } catch {
      return false;
    }
  };
  const isSafe = checkSafe();
</script>

{#if isSafe}
  <a
    class={className}
    {href}
    title={href}
    target="_blank"
    rel="noopener noreferrer"
    {...props}><slot /></a
  >
{:else}<slot />{/if}
