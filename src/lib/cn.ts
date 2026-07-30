import clsx, { type ClassValue } from 'clsx';

/** รวม class name แบบมีเงื่อนไข */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
