'use strict';

const FileUtilities = require('./file-utilities');

describe('FileUtilities', () => {
  describe('_getConditions', () => {
    it('should return an empty array', () => {
      const result = FileUtilities._getConditions('some-file.js', '__');
      expect(result).toEqual([]);
    });

    it('should return a single condition', () => {
      const result = FileUtilities._getConditions('__condition.some-file.js', '__');
      expect(result).toEqual(['condition']);
    });

    it('should return a single condition', () => {
      const result = FileUtilities._getConditions('_condition', '_');
      expect(result).toEqual(['condition']);
    });

    it('should return a single condition', () => {
      const result = FileUtilities._getConditions('__condition(action).some-file.js', '__');
      expect(result).toEqual(['condition']);
    });

    it('should return a single condition', () => {
      const result = FileUtilities._getConditions('_condition(action)', '_');
      expect(result).toEqual(['condition']);
    });

    it('should return multiple conditions', () => {
      const result = FileUtilities._getConditions('__a+b.some-file.js', '__');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return multiple conditions', () => {
      const result = FileUtilities._getConditions('_a+b', '_');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return multiple conditions', () => {
      const result = FileUtilities._getConditions('__a+b(action).some-file.js', '__');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return multiple conditions', () => {
      const result = FileUtilities._getConditions('__a+b(action)', '__');
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('_checkConditions', () => {
    const rules = {
      a: () => true,
      b: () => false,
      c: props => props.in
    };

    it('should throw if a condition does not exists', () => {
      expect(() => FileUtilities._checkConditions(['d'], {}, rules)).toThrow();
    });

    it('should return true', () => {
      const result = FileUtilities._checkConditions(['a'], {}, rules);
      expect(result).toBe(true);
    });

    it('should return true', () => {
      const result = FileUtilities._checkConditions(['a', 'c'], {props: {in: true}}, rules);
      expect(result).toBe(true);
    });

    it('should return false', () => {
      const result = FileUtilities._checkConditions(['a', 'b'], {}, rules);
      expect(result).toBe(false);
    });

    it('should return false', () => {
      const result = FileUtilities._checkConditions(['a', 'c'], {props: {in: false}}, rules);
      expect(result).toBe(false);
    });
  });

  describe('_getAction', () => {
    it('should return null', () => {
      const result = FileUtilities._getAction('some-file.js');
      expect(result).toEqual(null);
    });

    it('should return an action', () => {
      const result = FileUtilities._getAction('(action).some-file.js');
      expect(result).toEqual('action');
    });

    it('should return an action', () => {
      const result = FileUtilities._getAction('__condition(action).some-file.js');
      expect(result).toEqual('action');
    });

    it('should return an action', () => {
      const result = FileUtilities._getAction('__a+b(action).some-file.js');
      expect(result).toEqual('action');
    });
  });
});
