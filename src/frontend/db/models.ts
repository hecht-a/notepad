export type NoteModel = {
  readonly tableName: "notes";
  id: number;
  name: string;
  content: string;
  length: number;
};

export type Note = Omit<NoteModel, "tableName">;

export type Model = NoteModel;
