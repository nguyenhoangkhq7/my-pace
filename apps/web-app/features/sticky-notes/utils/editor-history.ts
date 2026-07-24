/**
 * Dedicated Undo/Redo history manager for ContentEditable rich text editor.
 * Maintains an internal stack of HTML states to make Ctrl+Z and Ctrl+Y work 100% reliably.
 */
export class EditorHistory {
  private stack: string[] = [];
  private index: number = -1;
  private maxHistory: number = 50;

  constructor(initialContent: string = "") {
    this.push(initialContent);
  }

  public push(html: string) {
    if (this.stack[this.index] === html) return;

    // Discard any redo states when a new change is made
    this.stack = this.stack.slice(0, this.index + 1);

    this.stack.push(html);
    if (this.stack.length > this.maxHistory) {
      this.stack.shift();
    } else {
      this.index++;
    }
  }

  public canUndo(): boolean {
    return this.index > 0;
  }

  public canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }

  public undo(): string | null {
    if (!this.canUndo()) return null;
    this.index--;
    return this.stack[this.index];
  }

  public redo(): string | null {
    if (!this.canRedo()) return null;
    this.index++;
    return this.stack[this.index];
  }

  public current(): string {
    return this.stack[this.index] || "";
  }

  public reset(html: string) {
    this.stack = [html];
    this.index = 0;
  }
}
