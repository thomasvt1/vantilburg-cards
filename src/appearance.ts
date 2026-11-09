import type { Palette } from './types';
export const palettes: Record<Palette, { light: string[]; dark: string[] }> = {
  blue: { light: ['#e7f5fc', '#bce8fa', '#246b9a'], dark: ['#193e52', '#245c76', '#94dcfa'] },
  peach: { light: ['#fff0eb', '#ffd5c6', '#a64d37'], dark: ['#4b302c', '#704337', '#ffb79d'] },
  purple: { light: ['#f2edff', '#dfd2fa', '#7553a8'], dark: ['#352c50', '#514073', '#cfb2ff'] },
  teal: { light: ['#e6f8f5', '#b9eee6', '#207d78'], dark: ['#193f3d', '#245e59', '#8be2d5'] },
  pink: { light: ['#ffedf5', '#fbd1e4', '#ab4e7b'], dark: ['#492d40', '#6d405a', '#ffb0d5'] },
  indigo: { light: ['#ecf0ff', '#ccd6ff', '#526db5'], dark: ['#2b3453', '#414f7b', '#b1c4ff'] },
  slate: { light: ['#edf3fa', '#d6e5ee', '#52758e'], dark: ['#293c49', '#3b5668', '#b4d7ed'] },
  green: { light: ['#ecf8ef', '#ccebd5', '#3c8354'], dark: ['#233f30', '#355e43', '#a4e5b5'] },
  mint: { light: ['#eef8f4', '#d2ecdf', '#3e8269'], dark: ['#203f35', '#315e4d', '#99dfbf'] },
  neutral: { light: ['#ffffff', '#d6e5ee', '#52758e'], dark: ['#222b35', '#3b5668', '#b4d7ed'] },
};
