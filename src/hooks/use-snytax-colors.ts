import { useMemo } from 'react';
import type { SyntaxColors } from '@/types/code-viewer';

export const useSyntaxColors = (theme: string): SyntaxColors => {
  return useMemo(() => {
    const getColor = (colors: string[]) =>
      colors[
        theme === 'white'
          ? 0
          : theme === 'light'
          ? 1
          : theme === 'dark'
          ? 2
          : theme === 'tomorrow'
          ? 3
          : 4
      ];

    return {
      comment: getColor([
        '#6a737d',
        '#708090',
        '#6a9955',
        '#969896',
        '#75715e',
      ]),
      punctuation: getColor([
        '#24292e',
        '#999',
        '#d4d4d4',
        '#cccccc',
        '#f8f8f2',
      ]),
      tag: getColor(['#22863a', '#905', '#569cd6', '#cc7832', '#f92672']),
      attrName: getColor(['#6f42c1', '#690', '#9cdcfe', '#de935f', '#a6e22e']),
      attrValue: getColor(['#032f62', '#07a', '#ce9178', '#b5bd68', '#e6db74']),
    };
  }, [theme]);
};
