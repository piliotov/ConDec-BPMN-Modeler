export class CommandStack {
  constructor() {
    this.stack = [];
    this.stackIndex = -1;
    this.listeners = new Set();
  }
  execute(command) {
    command.execute();
    this.stack = this.stack.slice(0, this.stackIndex + 1);
    this.stack.push(command);
    this.stackIndex++;
    this.notifyListeners('executed', command);
  }
  undo() {
    if (!this.canUndo()) {
      return false;
    }
    const command = this.stack[this.stackIndex];
    command.undo();
    this.stackIndex--;
    this.notifyListeners('undone', command);
    return true;
  }
  redo() {
    if (!this.canRedo()) {
      return false;
    }
    this.stackIndex++;
    const command = this.stack[this.stackIndex];
    command.execute();
    this.notifyListeners('redone', command);
    return true;
  }
  canUndo() {
    return this.stackIndex >= 0;
  }
  canRedo() {
    return this.stackIndex < this.stack.length - 1;
  }
  clear() {
    this.stack = [];
    this.stackIndex = -1;
    this.notifyListeners('cleared');
  }
  addListener(listener) {
    this.listeners.add(listener);
  }
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  notifyListeners(event, command) {
    this.listeners.forEach(listener => {
      try {
        listener(event, command);
      } catch (error) {
        console.error('Error in command stack listener:', error);
      }
    });
  }
  size() {
    return this.stack.length;
  }
  index() {
    return this.stackIndex;
  }
}
export class Command {
  constructor(description = 'Command') {
    this.description = description;
  }
  execute() {
    throw new Error('Command.execute() must be implemented by subclass');
  }
  undo() {
    throw new Error('Command.undo() must be implemented by subclass');
  }
  getDescription() {
    return this.description;
  }
}
