/* `<T>`, including `=>` and one nested `<>`, then `(`. */
const TYPE_ARG = `(?:<(?:[^<>]|=>|<[^<>]*>)*>)?`;

/* toHaveBeenCalledWith, toHaveBeenLastCalledWith, toHaveBeenCalledExactlyOnceWith. */
export const CALLED_WITH = /toHaveBeen\w*Called\w*With/;
export const EXPECT_ELEMENT_CALL = /\bexpect\s*\.\s*element\s*\(/;
/* `expect` then `.poll(`, including a line break and indent before `.poll`. */
export const EXPECT_POLL_CALL = /\bexpect\s*\.\s*poll\s*\(/;
export const INPUT_BINDING_CALL = _callOf("inputBinding");
/* Skill examples write `outputBinding<T>(` and `vi.fn<(...) => void>()`. */
export const OUTPUT_BINDING_CALL = _callOf("outputBinding");
/* `try {` or `catch (`, not `promise.catch(`. */
export const TRY_CATCH = /\btry\s*\{|(?<!\.)\bcatch\s*\(/;
export const VI_FN_CALL = _callOf(String.raw`vi\.fn`);

function _callOf(name: string): RegExp {
  return new RegExp(String.raw`\b${name}\s*${TYPE_ARG}\s*\(`);
}
