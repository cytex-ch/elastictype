export interface HookMetadata {
  /**
   * The target function of the schema.
   * @remarks
   * The target function represents the schema class or constructor function.
   * @type {Function}
   */
  target: Function;

  /**
   * The value of the hook.
   * @remarks
   * The value of the hook is a function that will be called when the hook is triggered.
   * @type {Function}
   */
  value: Function;

  /**
   * The name of the hook.
   * @remarks
   * The name of the hook is a string that represents the name of the hook.
   * @type {string}
   */
  name:
    | "postSave"
    | "postUpdate"
    | "postDelete"
    | "preSave"
    | "preUpdate"
    | "preDelete";
}
