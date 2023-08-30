/**
 * @module cat.ts
 * @description This module defines the Cat class.
 */

import {Hook} from '../../src/decorators/hook.decorator';
import {BaseSchema, ElasticDataType, Prop, Schema} from '../../src';

/**
 * @class Cat
 * @extends BaseSchema<Cat>
 * @description Represents a cat object.
 */
@Schema({index: 'cats'})
export class Cat extends BaseSchema<Cat> {
  /**
   * @static
   * @property {boolean} __Post_Save__Test - A test property for post save hook.
   */
  public static __Post_Save__Test = false;

  /**
   * @static
   * @property {boolean} __Pre_Save__Test - A test property for pre save hook.
   */
  public static __Pre_Save__Test = false;

  /**
   * @property {string} name - The name of the cat.
   */
  @Prop({
    type: ElasticDataType.Keyword,
    description: 'The name of the cat.',
  })
  name!: string;

  /**
   * @property {number} age - The age of the cat.
   */
  @Prop({
    type: ElasticDataType.Integer,
  })
  age!: number;

  /**
   * @method preSave
   * @description A hook that runs before saving a cat instance.
   * @returns {Promise<Cat>} The modified cat.
   */
  @Hook('preSave')
  async preSave(): Promise<Cat> {
    if (Cat.__Pre_Save__Test) {
      this.name = 'preSaveName';
    }
    return this;
  }

  /**
   * @method postSave
   * @description A hook that runs after saving a cat instance.
   * @returns {Promise<Cat>} The modified cat.
   */
  @Hook('postSave')
  async postSave(): Promise<Cat> {
    if (Cat.__Post_Save__Test) this.name = 'postSaveName';
    return this;
  }

  /**
   * @method preUpdate
   * @description A hook that runs before updating a cat instance.
   */
  @Hook('preUpdate')
  async preUpdate() {}

  /**
   * @method postUpdate
   * @description A hook that runs after updating a cat instance.
   */
  @Hook('postUpdate')
  async postUpdate() {}

  /**
   * @method preDelete
   * @description A hook that runs before deleting a cat instance.
   */
  @Hook('preDelete')
  async preDelete() {}

  /**
   * @method postDelete
   * @description A hook that runs after deleting a cat instance.
   */
  @Hook('postDelete')
  async postDelete() {}
}
