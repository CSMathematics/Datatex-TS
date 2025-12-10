import { languages } from 'monaco-editor'

export const latexConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '%'
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '$', close: '$' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '$', close: '$' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*\\\\begin\\{[a-zA-Z0-9]+\\}'),
      end: new RegExp('^\\s*\\\\end\\{[a-zA-Z0-9]+\\}')
    }
  }
}

export const latexLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.latex',

  // The start state
  tokenizer: {
    root: [
      // LaTeX commands (e.g. \documentclass, \begin, \item)
      [/(\\[a-zA-Z@]+)/, 'keyword'],
      [/(\\.)/, 'keyword'], // Escaped characters or single-char commands

      // Environments: \begin{...} and \end{...}
      [/(\\(?:begin|end))(\s*)(\{)/, ['keyword', '', '@brackets']],

      // Brackets & delimiters
      [/[{}()[\]]/, '@brackets'],

      // Math mode
      [/\$\$/, 'string.math', '@displayMath'], // $$ ... $$
      [/\$/, 'string.math', '@inlineMath'], // $ ... $
      [/\\\[/, 'string.math', '@displayMathBracket'], // \[ ... \]
      [/\\\(/, 'string.math', '@inlineMathBracket'], // \( ... \)

      // Comments
      [/(%)(.*)$/, ['comment', 'comment.content']],

      // Numbers
      [/\d+/, 'number'],

      // Control characters
      [/[&]/, 'keyword']
    ],

    displayMath: [
      [/\$\$/, { token: 'string.math', next: '@pop' }],
      [/./, 'string.math']
    ],

    inlineMath: [
      [/\$/, { token: 'string.math', next: '@pop' }],
      [/./, 'string.math']
    ],

    displayMathBracket: [
      [/\\\]/, { token: 'string.math', next: '@pop' }],
      [/./, 'string.math']
    ],

    inlineMathBracket: [
      [/\\\)/, { token: 'string.math', next: '@pop' }],
      [/./, 'string.math']
    ]
  }
}
