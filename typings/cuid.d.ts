declare module 'cuid' {
  /**
   * Returns a short random string
   */
  type Generate = () => string;

  const a: Generate;
  export = a;
}
