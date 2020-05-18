export * from "./named-function";
export * from "./should-get-capitalized";

const b = 'some other thing';

export { b as x };

export { a as b } from './some-module';
export { c as foo, w as other } from './other-module';
