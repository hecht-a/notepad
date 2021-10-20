/* eslint-disable no-underscore-dangle */
import Dexie, { Table } from "dexie";
import type { Model, Note } from "./models";

export class DBManager {
  private db: Dexie;

  private readonly _name: string;

  private static version = 1;

  constructor(name: string) {
    if (!name) {
      name = "null";
    }
    this._name = name;
    this.db = new Dexie(name);
    this.db.version(DBManager.version).stores({
      notes: "++id, &name, content, length",
    });
    // eslint-disable-next-line no-console
    console.log("database initialized");
  }

  public get name(): string {
    return this._name;
  }

  public async loadNotes(): Promise<Note[]> {
    const table: Table<Note, number> = this.getTable("notes");
    return table.toArray();
  }

  public async getNote(note: string | number): Promise<Note | false> {
    const table: Table<Note, number> = this.getTable("notes");
    return table
      .where(typeof note === "number" ? { id: note } : { name: note })
      .toArray()
      .then((n) => n[0] ?? false)
      .catch(() => false);
  }

  public async addNote(note: Omit<Note, "id">): Promise<boolean> {
    const table: Table<Omit<Note, "id">, number> = this.getTable("notes");
    return table
      .put(note)
      .then(() => true)
      .catch(() => false);
  }

  public async updateNote(id: number, changes: { content: string; "content-length": number }): Promise<number> {
    const table: Table<Note, number> = this.getTable("notes");
    return table.update(id, changes);
  }

  public async deleteNote(note: string | number): Promise<number> {
    const table: Table<Note, number> = this.getTable("notes");
    return table.where(/\d+/.test(String(note)) ? { id: Number(note) } : { name: note }).delete();
  }

  private getTable<TableModel extends Model, IndexableType>(
    schema: TableModel["tableName"]
  ): Table<TableModel, IndexableType> {
    return this.db.table(schema);
  }
}
