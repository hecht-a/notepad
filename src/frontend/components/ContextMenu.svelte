<style lang="scss">
  @import "../../assets/scss/root";

  .right__click {
    display: none;
    flex-direction: column;
    z-index: 999;
    position: absolute;
    background: $grey-1;
    box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px;
    padding: 0.4em;
    border-radius: 10px;

    .round {
      position: relative;
      border: 2px solid $frost-4;
      background: $frost-4;
      border-radius: 50%;
      width: 10px;
      height: 10px;
      top: calc(-0.4em - 5px);
      left: calc(-0.4em - 5px);
      margin-bottom: -10px;
    }

    .top {
      position: relative;
      background: $grey-1;
      border-radius: 3px 7px 0 0;
      height: 10px;
      width: calc(100% + 0.8em);
      top: -10px;
      left: -0.4em;
      margin-bottom: -10px;
    }

    button {
      text-align: left;
      width: 100%;
      cursor: pointer;
      margin: 0;
      background: none;
      border: none;
      color: $snow-1;
      font-size: 0.9em;
      border-radius: 3px;

      &:hover {
        background: $grey-4;
      }
    }
  }
</style>

<script lang="ts">
  import { onMount } from "svelte";

  export let contextType: string = null;
  export let sidebarTarget: HTMLButtonElement = null;
  export let resetSidebar: () => void = null;
  export let deleteNote: (name: string) => Promise<void> = null;
  export let download: (name: string) => Promise<void> = null;
  let reset: () => void = null;

  function copy(value: string): Promise<void> {
    return navigator.clipboard.writeText(value);
  }

  onMount(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#note");
    reset = () => {
      document.querySelector<HTMLDivElement>(".right__click").style.display = "none";
      textarea.focus();
    };

    const copyBtn = document.querySelector("#copier");
    const cutBtn = document.querySelector("#couper");
    const pasteBtn = document.querySelector("#coller");
    const selectAll = document.querySelector("#tout__selectionner");

    copyBtn.addEventListener("click", () => {
      const { value, selectionStart, selectionEnd } = textarea;
      const copied = value.slice(selectionStart, selectionEnd);
      copy(copied);
      reset();
    });

    cutBtn.addEventListener("click", () => {
      const { value, selectionStart, selectionEnd } = textarea;
      const val = value.slice(selectionStart, selectionEnd);
      copy(val);
      const start = value.slice(0, selectionStart);
      const end = value.slice(selectionEnd, value.length);
      textarea.value = start + end;
      reset();
    });

    pasteBtn.addEventListener("click", async () => {
      const { value, selectionStart, selectionEnd } = textarea;
      const clipboard = await navigator.clipboard.readText();

      const start = value.slice(0, selectionStart);
      const end = value.slice(selectionStart === selectionEnd ? selectionStart : selectionEnd, value.length);
      textarea.value = start + clipboard + end;

      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
      reset();
    });

    selectAll.addEventListener("click", () => {
      textarea.selectionStart = 0;
      textarea.selectionEnd = textarea.value.length;
      reset();
    });
  });
</script>

<div class="right__click">
  <div class="round"></div>
  <div class="top"></div>
  {#if contextType === "textarea"}
    <button id="tout__selectionner">tout sélectionner</button>
    <button id="copier">copier</button>
    <button id="couper">couper</button>
    <button id="coller">coller</button>
  {:else if contextType === "sidebar"}
    <button
      id="download__note"
      on:click="{() => {
        download(sidebarTarget.id);
        reset();
      }}">Télécharger</button
    >
    <button
      id="delete__note"
      on:click="{async () => {
        await deleteNote(sidebarTarget.id);
        reset();
        resetSidebar();
      }}">Supprimer la note</button
    >
  {/if}
</div>
