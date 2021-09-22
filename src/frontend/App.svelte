<style lang="scss">
  @use "sass:math";
  @import "../assets/scss/root";

  main {
    display: flex;
    flex-direction: row;
    height: 100vh;
    overflow: hidden;

    #sidebar, #container {
      height: 100%;
      color: $snow-3;

      .title {
        padding: $containers-padding;
        height: $title-height;
        background: $grey-1;

        h3 {
          margin: 0;
          padding: 0;
          text-transform: uppercase;
        }

        .buttons {
          .icon {
            background: none;
            border: none;
            cursor: pointer;
            color: $snow-3;
            font-size: 1.2em;

            &:active {
              color: $snow-1;
            }
          }
        }
      }
    }

    #container {
      background: $grey-2;
      width: 100%;

      .container__title {
        display: flex;
        //justify-content: space-between;
        align-items: center;

        button {
          margin: 0;
          height: 100%;
        }

        .buttons {
          margin-left: auto;
        }
      }

      .input {
        width: 100%;
        height: calc(100% - #{$containers-padding * 2} - #{$title-height});

        textarea, input {
          margin: 0;
          width: 100%;
          background: transparent;
          border: none;
          border-top: 1px solid $snow-3;
          color: $snow-3;
        }

        input {
          font-size: 1.2em;
          padding: math.div($textarea-padding, 2);

          &:disabled {
            color: $snow-1;
            opacity: 0.4;
            cursor: no-drop;
          }
        }

        textarea {
          resize: none;
          height: 100%;
          padding: $textarea-padding;
        }
      }
    }

    #sidebar {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: $grey-1;
      min-width: 175px;
      max-width: 10vw;
      border-right: 2px solid $snow-1;

      .title {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1em;
        margin-bottom: 5em;
      }

      .notes {
        display: flex;
        flex-direction: column;
        overflow: auto;
        margin-bottom: 2em;
        width: 100%;
      }
      ::-webkit-scrollbar {
        width: 13px;
      }
      ::-webkit-scrollbar-thumb {
        border-radius: 8px;
        border: 2px solid $grey-4;
        background-color: $snow-1;
      }
      ::-webkit-scrollbar-track {
        background-color: $grey-4;
        border-radius: 8px;
      }
    }
  }
</style>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { removeChildren } from "../App/removeChildren";
  import ContextMenu from "./components/ContextMenu.svelte"

  let text: string = "";
  let name: string = "";
  let selected: string | null = null;
  let contextType = "textarea";
  let cache;
  let sidebarTarget;
  let reset;
  let deleteN;
  let download;

  onMount(() => {
    const ctx: HTMLDivElement = document.querySelector(".right__click");
    const textarea = document.querySelector("textarea");
    const input = document.querySelector("input");
    const sidebar = document.querySelector<HTMLDivElement>("#sidebar");

    const saveNote = document.querySelector<HTMLButtonElement>("#save");
    const newNote = document.querySelector<HTMLButtonElement>("#new");
    const deleteNote = document.querySelector<HTMLButtonElement>("#delete");
    const downloadNote = document.querySelector<HTMLButtonElement>("#download");

    cache = caches.open("v1");
    const write = async (url: string, content, type= "text/plain"): Promise<void> => {
      return (await cache).put(url, new Response(content, {
        headers: {
          "content-type": `${type}; charset=utf-8`,
          "content-disposition": `inline; filename='${encodeURIComponent(url.split("/").pop())}'`,
          "link": null,
        }
      }));
    }

    const deleteNoteFn = async (url: string): Promise<boolean> => {
      return (await cache).delete(url)
    }

    const read = async (url: string): Promise<Response> => {
      return (await cache).match(url);
    };

    const readAll = async (): Promise<Response[]> => {
      return (await cache).matchAll();
    }

    function normalizeName(str: string): string {
      return str.split("=").pop().split("'")[1].split(".")[0];
    }

    async function setSidebarItems(sidebar: HTMLDivElement) {
      const items = await readAll();
      const notes = sidebar.querySelector<HTMLDivElement>(".notes");
      removeChildren(notes);
      for (const item of items) {
        const i = items.indexOf(item);
        const btn = document.createElement("button");
        const noteName = normalizeName(item.headers.get("content-disposition"));
        btn.id = noteName;
        btn.classList.add("item");
        btn.textContent = noteName;
        btn.style.marginRight = "0.8em";
        btn.style.marginLeft = "0.8em";
        if(i === items.length - 1) {
          btn.style.marginBottom = "0";
        }
        notes.appendChild(btn);
        btn.addEventListener("click", async (e) => {
          document.querySelectorAll<HTMLButtonElement>(".item").forEach(b => b.style.backgroundColor = "");
          (e.target as HTMLButtonElement).style.backgroundColor = "#81A1C1";
          input.disabled = true;
          selected = noteName;
          text = await item.clone().text();
          name = noteName;
          textarea.focus();
        });
        btn.addEventListener("contextmenu", (e) => {
          sidebarTarget = e.target;
          e.preventDefault()
          ctx.style.display = "flex";
          ctx.style.left = `${e.x}px`;
          ctx.style.top = `${e.y}px`;
          contextType = "sidebar";
        })
      }
    }

    reset = () => {
      text = "";
      name = "";
      input.focus();
      input.disabled = false;
      selected = null;
      setSidebarItems(sidebar);
    }

    setSidebarItems(sidebar);
    input.focus();

    deleteN = async () => {
      if(selected === null) {
        return;
      }
      await deleteNoteFn(`notes/${selected}.txt`);
      reset();
    }

    download = async () => {
      const note = (await (await cache).matchAll()).filter((item) => item.headers.get("content-disposition").includes(selected))[0];

      const data = URL.createObjectURL(new Blob([await note.clone().text()], { type: "text/plain" }));

      const link = document.createElement('a');
      link.href = data;
      link.download = selected;

      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );

      setTimeout(() => {
        URL.revokeObjectURL(data);
        link.remove();
      }, 100);
    };

    async function save() {
      if(text === "" || name === "") {
        return;
      }

      name = name.length <= 8 ? name : name.slice(0, 8);

      if((await (await cache).match(`/notes/${name}.txt`))) {
        input.disabled = true;
        selected = name;
        text = await (await read(`/notes/${name}.txt`)).clone().text();
        textarea.focus();
        alert("note already exists, switching to this note");
        return;
      }

      if(selected === null) {
        await write(`notes/${name}.txt`, text);
        selected = name;
      } else {
        await write(`notes/${selected}.txt`, text);
      }

      input.disabled = true;
      text = await (await read(`notes/${name}.txt`)).text();
      await setSidebarItems(sidebar);
    }

    textarea.addEventListener("keydown", (e) => {
      textarea.scrollTop = textarea.scrollHeight;
      if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if(text !== "") {
          save()
        } else {
          deleteN();
        }
      } else if (e.code === "Backspace" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if(text !== "") {
          deleteN();
        }
      }
    });
    window.addEventListener("keydown", (e) => {
      if(e.code === "KeyN" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        reset();
        input.focus();
      }
    });
    newNote.addEventListener("click", reset);
    saveNote.addEventListener("click", save);
    window.addEventListener("click", (e: PointerEvent) => {
      const excluded: HTMLDivElement[] = [ctx];
      for(const c of ctx.children) {
        excluded.push(<HTMLDivElement>c)
      }

      if(!excluded.includes(e.target)) {
        ctx.style.display = "none";
      }
    });
    textarea.addEventListener("contextmenu", (e: PointerEvent) => {
      e.preventDefault()
      ctx.style.display = "flex";
      ctx.style.left = `${e.x}px`;
      ctx.style.top = `${e.y}px`;
      contextType = "textarea";
    });
  });
</script>

<main>
  <ContextMenu bind:contextType={contextType} bind:cache={cache} bind:sidebarTarget={sidebarTarget}
               bind:resetSidebar={reset} />
  <div id="sidebar">
    <div class="title">
      <h3>Notes</h3>
      <button id="new">Nouvelle note</button>
    </div>
    <div class="notes"></div>
  </div>
  <div id="container">
    <div class="title container__title">
      <h3>Notes</h3>
      <div class="buttons">
        {#if selected !== null }
          <button class="icon" id="download" on:click={download}><i class="fas fa-file-download"></i></button>
          <button class="icon" id="delete" on:click={deleteN}><i class="fas fa-trash-alt"></i></button>
        {/if}
        <button id="save">sauvegarder</button>
      </div>
    </div>
    <div class="input">
      <input type="text" name="name" id="name" placeholder="Entrez le nom de la note" bind:value={name} maxlength="10" />
      <textarea name="note" id="note" placeholder="Entrez votre texte" bind:value={text}></textarea>
    </div>
  </div>
</main>
