export interface CodeViewerProps {
  code: string;
  language: 'xml' | 'xsd';
  theme?: 'white' | 'light' | 'dark' | 'tomorrow' | 'okaidia';
  wrapText?: boolean;
}

export interface ThemeColors {
  background: string;
  color: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  lineNumberBorder: string;
  lineNumberColor: string;
}

export interface SyntaxColors {
  comment: string;
  punctuation: string;
  tag: string;
  attrName: string;
  attrValue: string;
}
