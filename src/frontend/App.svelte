<style lang="scss">
  @use "sass:math";
  @import "../assets/scss/root";

  main {
    display: flex;
    flex-direction: row;
    height: 100vh;
    overflow: hidden;

    #sidebar,
    #container {
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

        textarea,
        input {
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
  import { onMount } from "svelte";
  import { removeChildren } from "../App/removeChildren";
  import ContextMenu from "./components/ContextMenu.svelte";
  import { DBManager } from "./db/DBManager";
  import type { Note } from "./db/models";
  import { alertify } from "@labeg/alertify.js";

  let items: Note[];

  function setItems(newItems: Note[]): void {
    items = newItems;
  }

  type Options = {
    maxItems?: number;
    type: "success" | "error" | "log";
    cb?: () => Promise<void> | void;
    duration?: number;
  };

  async function notif(message: string, options?: Options) {
    const notification = alertify.setLogPosition("top right").setDelay(options.duration ?? 2000);
    if (options) {
      if ("maxItems" in options) {
        notification.setMaxLogItems(options.maxItems);
      }
    }
    switch (options.type) {
      case "success":
        notification.success(message);
        break;
      case "error":
        notification.error(message);
        break;
      case "log":
        notification.log(message);
        break;
      default:
        notification.log(message);
    }
    notification.setCloseLogOnClick(true);
    document.querySelectorAll(".alertify-logs > .success").forEach((elem) => elem.classList.add("green"));

    if ("cb" in options) {
      await options.cb();
    }
  }

  let text: string = "";
  let name: string = "";
  let selected: string | null = null;
  let contextType = "textarea";
  let sidebarTarget: HTMLButtonElement;
  let reset: () => void;
  let deleteNote: (name: string) => Promise<void>;
  let download: (name: string) => Promise<void>;

  const db = new DBManager("notes");

  onMount(() => {
    const ctx: HTMLDivElement = document.querySelector(".right__click");
    const textarea = document.querySelector("textarea");
    const input = document.querySelector("input");
    const sidebar = document.querySelector<HTMLDivElement>("#sidebar");

    const saveNote = document.querySelector<HTMLButtonElement>("#save");
    const newNote = document.querySelector<HTMLButtonElement>("#new");

    const write = async (name: string, content: string): Promise<boolean> => {
      return db.addNote({ name, content, length: content.length });
    };

    const update = async (id: number, content: string): Promise<number> => {
      return db.updateNote(id, { content, "content-length": content.length });
    };

    deleteNote = async (name: string): Promise<void> => {
      await notif("Note supprimée avec succès.", { type: "success" });
      await db.deleteNote(name);
      reset();
    };

    const read = async (note: string | number): Promise<Note | false> => {
      return db.getNote(note);
    };

    const readAll = async (): Promise<Note[]> => {
      return db.loadNotes();
    };

    async function setSidebarItems(sidebar: HTMLDivElement, noNotif = false) {
      if (!noNotif) {
        await notif("Chargements des notes", {
          maxItems: 1,
          type: "success",
          cb: async () => {
            await readAll().then(async (i) => {
              setItems(i);
              await notif("Notes chargées", { type: "success" });
            });
          },
        });
      } else {
        setItems(await readAll());
      }
      const notes = sidebar.querySelector<HTMLDivElement>(".notes");
      removeChildren(notes);
      for (const item of items) {
        const i = items.indexOf(item);
        const btn = document.createElement("button");
        const noteName = item.name;
        btn.id = String(item.id);
        btn.classList.add("item");
        btn.textContent = noteName;
        btn.style.marginRight = "0.8em";
        btn.style.marginLeft = "0.8em";
        if (i === items.length - 1) {
          btn.style.marginBottom = "0";
        }
        if (item.name === selected) {
          document.querySelectorAll<HTMLButtonElement>(".item").forEach((b) => (b.style.backgroundColor = ""));
          btn.style.backgroundColor = "#81A1C1";
        }
        notes.appendChild(btn);
        btn.addEventListener("click", async (e) => {
          document.querySelectorAll<HTMLButtonElement>(".item").forEach((b) => (b.style.backgroundColor = ""));
          (e.target as HTMLButtonElement).style.backgroundColor = "#81A1C1";
          input.disabled = true;
          selected = noteName;
          text = item.content;
          name = noteName;
          textarea.setAttribute("selected-note", btn.id);
          textarea.focus();
        });
        btn.addEventListener("contextmenu", (e) => {
          sidebarTarget = e.target as HTMLButtonElement;
          e.preventDefault();
          ctx.style.display = "flex";
          ctx.style.left = `${e.x}px`;
          ctx.style.top = `${e.y}px`;
          contextType = "sidebar";
        });
      }
    }

    reset = () => {
      text = "";
      name = "";
      input.focus();
      input.disabled = false;
      selected = null;
      setSidebarItems(sidebar, true);
    };

    setSidebarItems(sidebar);
    input.focus();

    download = async (name: string) => {
      const note = (await read(name)) as Note;

      const data = URL.createObjectURL(new Blob([note.content], { type: "text/plain" }));

      const link = document.createElement("a");
      link.href = data;
      link.download = selected;

      link.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );

      setTimeout(() => {
        URL.revokeObjectURL(data);
        link.remove();
      }, 100);
    };

    async function save() {
      if (text === "" || name === "") {
        await notif("Il manque le nom et le contenu", { type: "error" });
        return;
      }

      name = name.length <= 8 ? name : name.slice(0, 8);

      if (selected === null) {
        if ((await read(name)) !== false) {
          await notif("La note existe déjà<br>Changement vers cette note", { type: "error" });
          selected = name;
          text = ((await read(name)) as Note).content;
          input.disabled = true;
          return;
        }
        await write(name, text);
        selected = name;
        await notif("Note créée", { type: "success" });
        await setSidebarItems(sidebar, true);
      } else {
        const id = parseInt(textarea.getAttribute("selected-note"));
        await update(id, text);
        await notif("Note modifiée", { type: "success" });
        selected = ((await read(id)) as Note).name;
      }

      input.disabled = true;
      text = ((await read(name)) as Note).content;
    }

    window.addEventListener("drop", async (event) => {
      const files = event.dataTransfer.files;
      for (const file of files) {
        let { name: fileName } = file;
        const content = await file.text();
        if (!/^.*(.txt)$/.test(fileName)) {
          await notif(`Le fichier <b>${fileName}</b> n'est pas au format txt`, { type: "error" });
          return;
        }
        name = fileName.split(".txt")[0].slice(0, 8);
        if ((await read(name)) !== false) {
          await notif("La note existe déjà<br>Changement vers cette note", { type: "log" });
          selected = name;
          text = ((await read(name)) as Note).content;
          input.disabled = true;
          return;
        }
        await write(name, content);
        selected = name;
        await notif("Note créée", { type: "success" });
        await setSidebarItems(sidebar, true);
        input.disabled = true;
        text = ((await read(name)) as Note).content;
      }
    });
    textarea.addEventListener("keydown", (e) => {
      textarea.scrollTop = textarea.scrollHeight;
      if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (text !== "") {
          save();
        } else {
          deleteNote(selected);
        }
      } else if (e.code === "Backspace" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (text !== "") {
          deleteNote(selected);
        }
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyN" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        reset();
        input.focus();
      }
    });
    newNote.addEventListener("click", reset);
    saveNote.addEventListener("click", save);
    window.addEventListener("click", (e: PointerEvent) => {
      const excluded: HTMLDivElement[] = [ctx];
      for (const c of ctx.children) {
        excluded.push(<HTMLDivElement>c);
      }

      if (!excluded.includes(e.target as HTMLDivElement)) {
        ctx.style.display = "none";
      }
    });
    textarea.addEventListener("contextmenu", (e: PointerEvent) => {
      e.preventDefault();
      ctx.style.display = "flex";
      ctx.style.left = `${e.x}px`;
      ctx.style.top = `${e.y}px`;
      contextType = "textarea";
    });
  });
</script>

<main>
  <ContextMenu bind:contextType bind:sidebarTarget bind:resetSidebar="{reset}" bind:download bind:deleteNote />
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
        {#if selected !== null}
          <button class="icon" id="download" on:click="{() => download(selected)}"
            ><i class="fas fa-file-download"></i></button
          >
          <button class="icon" id="delete" on:click="{() => deleteNote(selected)}"
            ><i class="fas fa-trash-alt"></i></button
          >
        {/if}
        <button id="save">sauvegarder</button>
      </div>
    </div>
    <div class="input">
      <input
        type="text"
        name="name"
        id="name"
        placeholder="Entrez le nom de la note"
        bind:value="{name}"
        maxlength="10"
      />
      <textarea name="note" id="note" placeholder="Entrez votre texte" bind:value="{text}"></textarea>
    </div>
  </div>
</main>
